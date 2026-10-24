import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const { PGlite } = require('../../node_modules/.phase2-tools/node_modules/@electric-sql/pglite')

test('Phase 4: atomic profile provisioning, backfill and RLS', async t => {
  const db = new PGlite()
  const a = '11111111-aaaa-4111-8111-aaaaaaaaaaaa'
  const b = '22222222-bbbb-4222-8222-bbbbbbbbbbbb'
  const c = '33333333-cccc-4333-8333-cccccccccccc'
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth, public to anon, authenticated, service_role;
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    `)
    const migrations = new URL('../migrations/', import.meta.url)
    const files = (await readdir(migrations)).filter(file => file.endsWith('.sql')).sort()
    const provisioning = files.find(file => file.includes('phase4'))
    assert.ok(provisioning, 'Phase 4 migration must exist')
    for (const file of files.filter(file => file < provisioning)) {
      await db.exec(await readFile(new URL(file, migrations), 'utf8'))
    }
    await db.query('insert into auth.users values ($1, $2), ($3, $4)', [a, {full_name:'Old Name'}, b, {full_name:'Backfilled Name'}])
    await db.query('insert into public.user_profiles (id, full_name) values ($1, $2)', [a, 'Chosen Name'])
    for (const file of files.filter(file => file >= provisioning)) {
      await db.exec(await readFile(new URL(file, migrations), 'utf8'))
    }
    await t.test('backfill missing profiles while preserving existing names', async () => {
      const { rows } = await db.query('select full_name from public.user_profiles order by id')
      assert.deepEqual(rows.map(row => row.full_name), ['Chosen Name', 'Backfilled Name'])
    })
    await t.test('signup provisions immediately without a session; metadata grants no role', async () => {
      await db.query('insert into auth.users values ($1, $2)', [c, {full_name:'  New Parent  ', role:'admin'}])
      assert.equal((await db.query('select full_name from public.user_profiles where id = $1', [c])).rows[0].full_name, 'New Parent')
      assert.equal((await db.query('select count(*)::int as count from public.child_caregivers')).rows[0].count, 0)
    })
    await t.test('malformed or blank metadata still produces a usable profile', async () => {
      for (const [index, metadata] of [null, {}, {full_name:'   '}, {full_name:{role:'admin'}}, {full_name:'x'.repeat(500)}].entries()) {
        const id = `00000000-0000-4000-8000-00000000000${index}`
        await db.query('insert into auth.users values ($1, $2)', [id, metadata])
        const profile = (await db.query('select * from public.user_profiles where id = $1', [id])).rows[0]
        assert.ok(profile)
        assert.ok(profile.full_name === null || profile.full_name.length <= 200)
      }
    })
    await t.test('profile insertion failure rolls back the auth account', async () => {
      await db.exec("alter table public.user_profiles add constraint test_reject_name check (full_name <> 'reject')")
      const id = '99999999-0000-4000-8000-000000000000'
      await assert.rejects(db.query('insert into auth.users values ($1, $2)', [id, {full_name:'reject'}]), error => error.code === '23514')
      assert.equal((await db.query('select * from auth.users where id = $1', [id])).rows.length, 0)
      await db.exec('alter table public.user_profiles drop constraint test_reject_name')
    })
    async function asUser(role, fn) {
      return db.transaction(async tx => {
        await tx.exec(`set local role ${role}`)
        await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [a])
        return fn(tx)
      })
    }
    await t.test('self reads/updates only; no browser profile INSERT or DELETE', async () => {
      assert.equal((await asUser('authenticated', tx => tx.query('select * from public.user_profiles'))).rows.length, 1)
      assert.equal((await asUser('authenticated', tx => tx.query('update public.user_profiles set full_name = $1 where id = $2 returning id', ['Updated', a]))).rows.length, 1)
      assert.equal((await asUser('authenticated', tx => tx.query('update public.user_profiles set full_name = $1 where id = $2 returning id', ['Forged', b]))).rows.length, 0)
      for (const sql of ["insert into public.user_profiles (id) values (gen_random_uuid())", 'delete from public.user_profiles', 'update public.user_profiles set updated_at = now()']) {
        await assert.rejects(asUser('authenticated', tx => tx.exec(sql)), error => error.code === '42501')
      }
      await assert.rejects(asUser('anon', tx => tx.exec('select * from public.user_profiles')), error => error.code === '42501')
    })
    await t.test('trigger function not executable by clients or service role; fixed search path', async () => {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        const result = await db.query("select has_function_privilege($1, 'private.provision_auth_user_profile()', 'execute') as allowed", [role])
        assert.equal(result.rows[0].allowed, false)
      }
      const { rows } = await db.query("select proconfig from pg_proc where oid = 'private.provision_auth_user_profile()'::regprocedure")
      assert.deepEqual(rows[0].proconfig, ['search_path=""'])
    })
  } finally { await db.close() }
})
