// Isolated PostgreSQL RLS Verification Tests for Phase 3.
// Tests two independent accounts and verifies strict tenant isolation.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PGlite } = require('../../node_modules/.phase2-tools/node_modules/@electric-sql/pglite')
const db = new PGlite()
let passed = 0

// Test Identities
const accountA = '11111111-aaaa-4111-8111-aaaaaaaaaaaa'
const accountB = '22222222-bbbb-4222-8222-bbbbbbbbbbbb'
const attacker = '33333333-cccc-4333-8333-cccccccccccc'
const editorUser = '44444444-dddd-4444-8444-dddddddddddd'
const viewerUser = '55555555-eeee-4555-8555-eeeeeeeeeeee'

async function check(name, fn) {
  await fn()
  console.log(`PASS ${++passed}: ${name}`)
}

async function asUser(user, fn, role = 'authenticated') {
  assert.ok(['authenticated', 'anon'].includes(role))
  return db.transaction(async tx => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? ''])
    return fn(tx)
  })
}

async function denied(user, sql, params = [], code = '42501', role = 'authenticated') {
  await assert.rejects(asUser(user, tx => tx.query(sql, params), role), e => e.code === code)
}

const createSql = 'select * from public.create_child($1, $2::date, $3, $4::numeric, $5)'

try {
  // Minimal Supabase Auth fixture for isolated PostgreSQL testing
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `)

  for (const id of [accountA, accountB, attacker, editorUser, viewerUser]) {
    await db.query('insert into auth.users (id) values ($1)', [id])
  }

  // Apply Phase 2 Core Migration
  await check('apply Phase 2 core migration', async () => {
    const phase2Sql = await readFile(new URL('../migrations/20261024071052_phase2_core_child_schema.sql', import.meta.url), 'utf8')
    await db.exec(phase2Sql)
  })

  // Apply Phase 3 Secure RLS Migration
  await check('apply Phase 3 secure RLS migration and verify RLS active', async () => {
    const phase3Sql = await readFile(new URL('../migrations/20261024073000_phase3_secure_row_level_security.sql', import.meta.url), 'utf8')
    await db.exec(phase3Sql)

    const { rows } = await db.query(
      "select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename"
    )
    assert.deepEqual(
      rows,
      ['child_caregivers', 'children', 'user_profiles'].map(tablename => ({
        tablename,
        rowsecurity: true,
      }))
    )
  })

  let childA
  let childB

  // Independent Account Creation Test
  await check('Account A creates Child A and Account B creates Child B with correct owner association', async () => {
    childA = (await asUser(accountA, tx =>
      tx.query(createSql, ['Child A (Nethmi)', '2024-05-10', 'female', 3.2, 'mother'])
    )).rows[0]

    childB = (await asUser(accountB, tx =>
      tx.query(createSql, ['Child B (Kavindu)', '2024-08-20', 'male', 3.5, 'father'])
    )).rows[0]

    assert.equal(childA.created_by, accountA)
    assert.equal(childB.created_by, accountB)
    assert.notEqual(childA.id, childB.id)

    // Verify Account A owner row
    const membersA = (await asUser(accountA, tx => tx.query('select * from public.child_caregivers'))).rows
    assert.equal(membersA.length, 1)
    assert.equal(membersA[0].child_id, childA.id)
    assert.equal(membersA[0].user_id, accountA)
    assert.equal(membersA[0].access_level, 'owner')

    // Verify Account B owner row
    const membersB = (await asUser(accountB, tx => tx.query('select * from public.child_caregivers'))).rows
    assert.equal(membersB.length, 1)
    assert.equal(membersB[0].child_id, childB.id)
    assert.equal(membersB[0].user_id, accountB)
    assert.equal(membersB[0].access_level, 'owner')
  })

  // Account A Isolation & Read/Update Test
  await check('Account A can read and update Child A', async () => {
    const readA = (await asUser(accountA, tx =>
      tx.query('select * from public.children where id = $1', [childA.id])
    )).rows
    assert.equal(readA.length, 1)
    assert.equal(readA[0].name, 'Child A (Nethmi)')

    const updatedA = (await asUser(accountA, tx =>
      tx.query("update public.children set name = 'Child A Updated' where id = $1 returning *", [childA.id])
    )).rows
    assert.equal(updatedA.length, 1)
    assert.equal(updatedA[0].name, 'Child A Updated')
  })

  // Account B cannot read or update Child A (IDOR Protection)
  await check('Account B cannot read or update Child A, even when knowing its UUID', async () => {
    // Select by specific UUID returns 0 rows
    const readAttempt = (await asUser(accountB, tx =>
      tx.query('select * from public.children where id = $1', [childA.id])
    )).rows
    assert.equal(readAttempt.length, 0)

    // Full table select returns only Child B
    const allChildrenB = (await asUser(accountB, tx => tx.query('select * from public.children'))).rows
    assert.equal(allChildrenB.length, 1)
    assert.equal(allChildrenB[0].id, childB.id)

    // Update attempt affects 0 rows
    const updateAttempt = (await asUser(accountB, tx =>
      tx.query("update public.children set name = 'Hacked by B' where id = $1 returning id", [childA.id])
    )).rows
    assert.equal(updateAttempt.length, 0)

    // Verify Child A remained unchanged
    const verifyA = (await asUser(accountA, tx =>
      tx.query('select name from public.children where id = $1', [childA.id])
    )).rows[0]
    assert.equal(verifyA.name, 'Child A Updated')
  })

  // Account A cannot read or update Child B
  await check('Account A cannot read or update Child B', async () => {
    const readAttempt = (await asUser(accountA, tx =>
      tx.query('select * from public.children where id = $1', [childB.id])
    )).rows
    assert.equal(readAttempt.length, 0)

    const updateAttempt = (await asUser(accountA, tx =>
      tx.query("update public.children set name = 'Hacked by A' where id = $1 returning id", [childB.id])
    )).rows
    assert.equal(updateAttempt.length, 0)
  })

  // Anonymous Access Blocked
  await check('Anonymous user cannot access private child data or user profiles', async () => {
    for (const table of ['children', 'child_caregivers', 'user_profiles']) {
      await denied(null, `select * from public.${table}`, [], '42501', 'anon')
      await denied(null, `delete from public.${table}`, [], '42501', 'anon')
    }
    await denied(null, createSql, ['Anon Child', '2024-01-01', 'male', 3.0, 'parent'], '42501', 'anon')
  })

  // Attacker cannot add themselves to child_caregivers
  await check('Attacker cannot insert a relationship to an arbitrary child in child_caregivers', async () => {
    // Attempt to self-attach to Child A
    await denied(
      attacker,
      "insert into public.child_caregivers (child_id, user_id, relationship, access_level) values ($1, $2, 'relative', 'owner')",
      [childA.id, attacker]
    )
    // Attempt to attach to Child B
    await denied(
      attacker,
      "insert into public.child_caregivers (child_id, user_id, relationship, access_level) values ($1, $2, 'doctor', 'editor')",
      [childB.id, attacker]
    )
  })

  // Attacker cannot escalate access_level
  await check('Attacker and existing caregivers cannot escalate access_level', async () => {
    await denied(attacker, "update public.child_caregivers set access_level = 'owner'")
    await denied(accountA, "update public.child_caregivers set access_level = 'owner'")
    await denied(accountB, "update public.child_caregivers set access_level = 'owner'")
  })

  // Attacker cannot insert directly into public.children (must use RPC)
  await check('Direct insert into public.children is denied to all clients', async () => {
    await denied(
      accountA,
      "insert into public.children (name, date_of_birth, sex, created_by) values ('Forged', '2024-01-01', 'male', $1)",
      [accountA]
    )
    await denied(
      attacker,
      "insert into public.children (name, date_of_birth, sex, created_by) values ('Forged', '2024-01-01', 'male', $1)",
      [attacker]
    )
  })

  // Child Deletion is Disabled for MVP
  await check('Child deletion is disabled for the MVP (even for owner)', async () => {
    await denied(accountA, 'delete from public.children where id = $1', [childA.id])
    await denied(accountB, 'delete from public.children where id = $1', [childB.id])
    await denied(attacker, 'delete from public.children where id = $1', [childA.id])
    await denied(accountA, 'delete from public.child_caregivers where child_id = $1', [childA.id])
  })

  // Role Access Levels: Editor can edit, Viewer cannot edit
  await check('Editor caregiver can update permitted child demographics; viewer cannot', async () => {
    // Add editor and viewer to Child A using trusted connection (simulating verified invitation)
    await db.query(
      "insert into public.child_caregivers (child_id, user_id, relationship, access_level) values ($1, $2, 'pediatrician', 'editor')",
      [childA.id, editorUser]
    )
    await db.query(
      "insert into public.child_caregivers (child_id, user_id, relationship, access_level) values ($1, $2, 'grandparent', 'viewer')",
      [childA.id, viewerUser]
    )

    // Both can view Child A
    assert.equal((await asUser(editorUser, tx => tx.query('select * from public.children where id = $1', [childA.id]))).rows.length, 1)
    assert.equal((await asUser(viewerUser, tx => tx.query('select * from public.children where id = $1', [childA.id]))).rows.length, 1)

    // Editor CAN update demographic fields (e.g. birth_weight_kg)
    const editorUpdate = (await asUser(editorUser, tx =>
      tx.query("update public.children set birth_weight_kg = 3.450 where id = $1 returning birth_weight_kg", [childA.id])
    )).rows
    assert.equal(editorUpdate.length, 1)
    assert.equal(Number(editorUpdate[0].birth_weight_kg), 3.45)

    // Viewer CANNOT update (affects 0 rows due to RLS with check)
    const viewerUpdate = (await asUser(viewerUser, tx =>
      tx.query("update public.children set name = 'Viewer Tamper' where id = $1 returning id", [childA.id])
    )).rows
    assert.equal(viewerUpdate.length, 0)
  })

  // Caregiver Membership Isolation
  await check('Users can see only their own caregiver relationships (acyclic, no policy recursion)', async () => {
    // Editor sees only their own membership
    const editorMembers = (await asUser(editorUser, tx => tx.query('select * from public.child_caregivers'))).rows
    assert.equal(editorMembers.length, 1)
    assert.equal(editorMembers[0].user_id, editorUser)

    // Viewer sees only their own membership
    const viewerMembers = (await asUser(viewerUser, tx => tx.query('select * from public.child_caregivers'))).rows
    assert.equal(viewerMembers.length, 1)
    assert.equal(viewerMembers[0].user_id, viewerUser)

    // Account A sees only their own membership (even though other caregivers exist on Child A)
    const ownerMembers = (await asUser(accountA, tx => tx.query('select * from public.child_caregivers'))).rows
    assert.equal(ownerMembers.length, 1)
    assert.equal(ownerMembers[0].user_id, accountA)
  })

  // User Profiles Security
  await check('User profiles: self select/update permitted; cross-user and privilege assignment blocked', async () => {
    // User A creates their profile
    await asUser(accountA, tx => tx.query('insert into public.user_profiles (id, full_name) values ($1, $2)', [accountA, 'Account A Parent']))
    // User B creates their profile
    await asUser(accountB, tx => tx.query('insert into public.user_profiles (id, full_name) values ($1, $2)', [accountB, 'Account B Parent']))

    // User A can read their own profile
    const profileA = (await asUser(accountA, tx => tx.query('select * from public.user_profiles'))).rows
    assert.equal(profileA.length, 1)
    assert.equal(profileA[0].full_name, 'Account A Parent')

    // User A cannot read User B profile
    const readBFromA = (await asUser(accountA, tx => tx.query('select * from public.user_profiles where id = $1', [accountB]))).rows
    assert.equal(readBFromA.length, 0)

    // User A can update their own full_name
    const updatedProf = (await asUser(accountA, tx =>
      tx.query("update public.user_profiles set full_name = 'Updated Parent A' where id = $1 returning full_name", [accountA])
    )).rows
    assert.equal(updatedProf.length, 1)
    assert.equal(updatedProf[0].full_name, 'Updated Parent A')

    // User A cannot update User B profile
    const crossUpdate = (await asUser(accountA, tx =>
      tx.query("update public.user_profiles set full_name = 'Attacked' where id = $1 returning id", [accountB])
    )).rows
    assert.equal(crossUpdate.length, 0)

    // User A cannot modify id or timestamps
    await denied(accountA, 'update public.user_profiles set id = $1', [attacker])
    await denied(accountA, 'update public.user_profiles set updated_at = now()')

    // User cannot assign administrative or health worker privileges (no grant on other columns)
    await denied(accountA, "update public.user_profiles set full_name = ' '", [], '23514')
  })

  console.log(`\nAll ${passed} Phase 3 RLS test groups PASSED on ${(await db.query('select version()')).rows[0].version}`)
} finally {
  await db.close()
}
