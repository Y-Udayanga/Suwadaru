// Isolated PostgreSQL tests; never reads .env or connects to a hosted database.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PGlite } = require('../../node_modules/.phase2-tools/node_modules/@electric-sql/pglite')
const db = new PGlite()
let passed = 0
const owner = '11111111-1111-4111-8111-111111111111'
const stranger = '22222222-2222-4222-8222-222222222222'
const editor = '33333333-3333-4333-8333-333333333333'
const viewer = '44444444-4444-4444-8444-444444444444'

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

async function invalid(sql, params = [], code = '23514') {
  await assert.rejects(db.transaction(tx => tx.query(sql, params)), e => e.code === code)
}

const createSql = 'select * from public.create_child($1, $2::date, $3, $4::numeric, $5)'
const validChild = ['Fictional child', '2025-04-15', 'female', 3.125, 'parent']

try {
  // Minimal local-only Supabase auth fixture. The migration itself must never
  // define auth.users. Default grants simulate Supabase's permissive defaults.
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
  for (const id of [owner, stranger, editor, viewer]) {
    await db.query('insert into auth.users (id) values ($1)', [id])
  }

  await check('migration applies to a clean PostgreSQL database', async () => {
    await db.exec(await readFile(new URL('../migrations/20261024071052_phase2_core_child_schema.sql', import.meta.url), 'utf8'))
    const { rows } = await db.query("select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename")
    assert.deepEqual(rows, ['child_caregivers', 'children', 'user_profiles'].map(tablename => ({ tablename, rowsecurity: true })))
  })

  await check('profile self create/read/update, nullable name, and timestamp trigger', async () => {
    await asUser(owner, tx => tx.query('insert into public.user_profiles(id) values ($1)', [owner]))
    const before = (await asUser(owner, tx => tx.query('select * from public.user_profiles'))).rows[0]
    const after = (await asUser(owner, tx => tx.query("update public.user_profiles set full_name = 'Fictional parent' returning *"))).rows[0]
    assert.equal(after.full_name, 'Fictional parent')
    assert.deepEqual(after.created_at, before.created_at)
    assert.ok(after.updated_at > before.updated_at)
  })

  await check('profile cross-user reads, writes and ID/timestamp forgery blocked', async () => {
    assert.equal((await asUser(stranger, tx => tx.query('select * from public.user_profiles'))).rows.length, 0)
    assert.equal((await asUser(stranger, tx => tx.query("update public.user_profiles set full_name = 'attack' returning id"))).rows.length, 0)
    await denied(stranger, 'insert into public.user_profiles(id) values ($1)', [owner])
    await denied(owner, 'update public.user_profiles set id = $1', [stranger])
    await denied(owner, 'update public.user_profiles set updated_at = now()')
    await denied(owner, 'insert into public.user_profiles(id, created_at) values ($1, now())', [stranger])
    await denied(owner, "update public.user_profiles set full_name = ' '", [], '23514')
  })

  let child
  await check('RPC creates UUID child and exactly one caller-owned membership', async () => {
    child = (await asUser(owner, tx => tx.query(createSql, validChild))).rows[0]
    assert.match(child.id, /^[0-9a-f-]{36}$/)
    assert.equal(child.created_by, owner)
    assert.equal(child.date_of_birth.toISOString().slice(0, 10), validChild[1])
    assert.equal(Number(child.birth_weight_kg), 3.125)
    const members = (await asUser(owner, tx => tx.query('select * from public.child_caregivers'))).rows
    assert.equal(members.length, 1)
    assert.equal(members[0].child_id, child.id)
    assert.equal(members[0].user_id, owner)
    assert.equal(members[0].access_level, 'owner')
  })

  await check('owner may edit demographics but cannot forge provenance or timestamps', async () => {
    const updated = (await asUser(owner, tx => tx.query("update public.children set name = 'Updated fictional child' where id = $1 returning *", [child.id]))).rows[0]
    assert.equal(updated.name, 'Updated fictional child')
    assert.deepEqual(updated.created_at, child.created_at)
    assert.ok(updated.updated_at > child.updated_at)
    for (const assignment of ['id = gen_random_uuid()', `created_by = '${stranger}'`, 'created_at = now()', 'updated_at = now()']) {
      await denied(owner, `update public.children set ${assignment} where id = $1`, [child.id])
    }
  })

  await check('unrelated user cannot read or update child or discover memberships', async () => {
    assert.equal((await asUser(stranger, tx => tx.query('select * from public.children'))).rows.length, 0)
    assert.equal((await asUser(stranger, tx => tx.query('select * from public.child_caregivers'))).rows.length, 0)
    assert.equal((await asUser(stranger, tx => tx.query("update public.children set name = 'attack' where id = $1 returning id", [child.id]))).rows.length, 0)
  })

  await check('all clients, including owner, cannot mutate caregiver access or insert children directly', async () => {
    for (const user of [owner, stranger]) {
      await denied(user, "insert into public.child_caregivers(child_id, user_id, relationship, access_level) values ($1, $2, 'parent', 'owner')", [child.id, user])
      await denied(user, "update public.child_caregivers set access_level = 'owner'")
      await denied(user, 'delete from public.child_caregivers')
      await denied(user, "insert into public.children(name, date_of_birth, sex, created_by) values ('attack', '2025-01-01', 'male', $1)", [user])
      await denied(user, 'delete from public.children')
    }
  })

  await check('editor can edit; viewer cannot; membership policy has no recursion', async () => {
    // Trusted test fixture only: no invitation API exists in Phase 2.
    for (const [user, access] of [[editor, 'editor'], [viewer, 'viewer']]) {
      await db.query("insert into public.child_caregivers(child_id, user_id, relationship, access_level) values ($1, $2, 'guardian', $3)", [child.id, user, access])
      assert.equal((await asUser(user, tx => tx.query('select * from public.children'))).rows.length, 1)
      const ownMemberships = (await asUser(user, tx => tx.query('select * from public.child_caregivers'))).rows
      assert.equal(ownMemberships.length, 1)
      assert.equal(ownMemberships[0].user_id, user)
    }
    assert.equal((await asUser(editor, tx => tx.query("update public.children set sex = 'male' returning id"))).rows.length, 1)
    assert.equal((await asUser(viewer, tx => tx.query("update public.children set sex = 'female' returning id"))).rows.length, 0)
  })

  await check('second-insert failure rolls back child and membership atomically', async () => {
    const countSql = 'select (select count(*)::int from public.children) as children, (select count(*)::int from public.child_caregivers) as memberships'
    const before = (await db.query(countSql)).rows
    await denied(owner, createSql, [...validChild.slice(0, 4), ' '], '23514')
    assert.deepEqual((await db.query(countSql)).rows, before)
  })

  await check('invalid sex, blank name, future/infinite dates and invalid weights rejected', async () => {
    for (const [index, value] of [[0, ' '], [1, '2999-01-01'], [1, 'infinity'], [1, '-infinity'], [2, 'other'], [3, 0], [3, -1], [3, 'NaN'], [3, 'Infinity'], [3, '-Infinity']]) {
      const input = [...validChild]
      input[index] = value
      await denied(owner, createSql, input, '23514')
    }
    await denied(owner, "update public.children set date_of_birth = '2999-01-01'", [], '23514')
    await denied(owner, createSql, [null, ...validChild.slice(1)], '23502')
    await denied(owner, createSql, [validChild[0], null, ...validChild.slice(2)], '23502')
  })

  await check('optional weight and default relationship work; children remain isolated', async () => {
    const second = (await asUser(stranger, tx => tx.query("select * from public.create_child('Another fictional child', '2024-02-29', 'male')"))).rows[0]
    assert.equal(second.birth_weight_kg, null)
    assert.equal(second.created_by, stranger)
    assert.notEqual(second.id, child.id)
    assert.equal((await asUser(stranger, tx => tx.query('select * from public.children'))).rows.length, 1)
    assert.equal((await asUser(owner, tx => tx.query('select * from public.children'))).rows.length, 1)
  })

  await check('anonymous and missing-identity calls blocked, including private function', async () => {
    for (const table of ['children', 'child_caregivers', 'user_profiles']) {
      await denied(null, `select * from public.${table}`, [], '42501', 'anon')
    }
    await denied(null, createSql, validChild, '42501', 'anon')
    await denied(null, createSql, validChild)
    await denied(null, createSql.replace('public.create_child', 'private.create_child_with_owner'), validChild)
    await denied(null, createSql.replace('public.create_child', 'private.create_child_with_owner'), validChild, '42501', 'anon')
    const nonexistent = '55555555-5555-4555-8555-555555555555'
    await denied(nonexistent, createSql, validChild, '23503')
  })

  await check('FKs, unique membership and access validation enforced', async () => {
    const insert = 'insert into public.child_caregivers(child_id,user_id,relationship,access_level) values ($1,$2,$3,$4)'
    await invalid(insert, [child.id, owner, 'parent', 'owner'], '23505')
    await invalid(insert, [child.id, stranger, 'guardian', 'admin'])
    await invalid(insert, ['55555555-5555-4555-8555-555555555555', stranger, 'parent', 'owner'], '23503')
    await invalid('delete from auth.users where id = $1', [owner], '23001')
    await invalid("insert into public.user_profiles(id) values ('55555555-5555-4555-8555-555555555555')", [], '23503')
  })

  await check('privileged functions private, pinned search paths, narrowly granted', async () => {
    const functions = (await db.query(`
      select n.nspname, p.proname, p.prosecdef, p.proconfig,
        has_function_privilege('anon', p.oid, 'execute') as anon_execute,
        has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('private', 'public') order by p.proname
    `)).rows
    assert.equal(functions.length, 4)
    for (const fn of functions) {
      assert.ok(fn.proconfig.includes('search_path=""'))
      assert.equal(fn.anon_execute, false)
      assert.equal(fn.authenticated_execute, ['create_child', 'create_child_with_owner'].includes(fn.proname))
      if (fn.prosecdef) assert.equal(fn.nspname, 'private')
    }
    assert.equal(functions.filter(fn => fn.prosecdef).length, 1)
    assert.equal((await db.query("select has_schema_privilege('authenticated', 'private', 'create') as allowed")).rows[0].allowed, false)
  })

  await check('FK indexes present and trusted child deletion cascades memberships', async () => {
    const indexes = (await db.query("select indexname from pg_indexes where schemaname='public'")).rows.map(x => x.indexname)
    for (const expected of ['children_created_by_idx', 'child_caregivers_user_child_idx', 'child_caregivers_child_user_unique']) assert.ok(indexes.includes(expected))
    await db.query('delete from public.children where id = $1', [child.id])
    assert.equal((await db.query('select * from public.child_caregivers where child_id = $1', [child.id])).rows.length, 0)
  })

  console.log(`\n${passed} test groups passed on ${(await db.query('select version()')).rows[0].version}`)
} finally {
  await db.close()
}
