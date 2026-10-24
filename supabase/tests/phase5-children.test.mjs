// Real SQL and RLS in isolated PostgreSQL (PGlite); fictional records only.
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
const require = createRequire(import.meta.url)
const { PGlite } = require('../../node_modules/.phase2-tools/node_modules/@electric-sql/pglite')

test('Phase 5 database authorization and atomic child creation', async t => {
  const db = new PGlite()
  const users = ['11111111', '22222222', '33333333', '44444444'].map(p => `${p}-aaaa-4000-8000-aaaaaaaaaaaa`)
  const [owner, stranger, editor, viewer] = users
  const create = "select * from public.create_child($1, $2::date, 'female', $3::numeric, $4, $5)"
  const valid = ['Fictional Child', '2024-02-29', 3.125, 'parent', 'Fictional Clinic']
  async function as(user, sql, params = [], role = 'authenticated') {
    return db.transaction(async tx => {
      await tx.exec(`set local role ${role}`)
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? ''])
      return tx.query(sql, params)
    })
  }
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
      alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
    `)
    const dir = new URL('../migrations/', import.meta.url)
    for (const file of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort())
      await db.exec(await readFile(new URL(file, dir), 'utf8'))
    for (const user of users) await db.query('insert into auth.users values ($1, $2)', [user, { full_name: 'Fictional Parent' }])
    let childId
    await t.test('create one child and verify current-user owner association', async () => {
      const row = (await as(owner, create, valid)).rows[0]
      childId = row.id
      assert.equal(row.created_by, owner)
      assert.equal(row.clinic_name, 'Fictional Clinic')
      const membership = (await as(owner, 'select * from public.child_caregivers')).rows[0]
      assert.equal(membership.child_id, childId)
      assert.equal(membership.user_id, owner)
      assert.equal(membership.access_level, 'owner')
    })
    await t.test('multiple children; list and retrieve only linked children', async () => {
      await as(owner, create, ['Fictional Sibling', ...valid.slice(1)])
      await as(stranger, create, ['Fictional Other Family', ...valid.slice(1)])
      assert.equal((await as(owner, 'select * from public.children')).rows.length, 2)
      assert.equal((await as(stranger, 'select * from public.children')).rows.length, 1)
      assert.equal((await as(owner, 'select * from public.children where id=$1', [childId])).rows.length, 1)
      assert.equal((await as(stranger, 'select * from public.children where id=$1', [childId])).rows.length, 0)
      assert.equal((await as(stranger, "update public.children set name='Forbidden' where id=$1 returning id", [childId])).rows.length, 0)
    })
    await t.test('owner/editor can update demographics; viewer cannot', async () => {
      // Trusted fixture setup only; no invitation API exists.
      for (const [user, level] of [[editor, 'editor'], [viewer, 'viewer']])
        await db.query("insert into public.child_caregivers(child_id,user_id,relationship,access_level) values ($1,$2,'fixture',$3)", [childId,user,level])
      for (const user of [owner, editor]) {
        const row = (await as(user, "update public.children set name='Updated Fictional Child', date_of_birth='2023-02-28', sex='male', birth_weight_kg=null, clinic_name=null where id=$1 returning *", [childId])).rows[0]
        assert.equal(row.name, 'Updated Fictional Child')
        assert.equal(row.created_by, owner)
        assert.equal(row.clinic_name, null)
      }
      assert.equal((await as(viewer, 'select * from public.children where id=$1', [childId])).rows.length, 1)
      assert.equal((await as(viewer, "update public.children set clinic_name='Forbidden' where id=$1 returning id", [childId])).rows.length, 0)
    })
    await t.test('invalid required fields, dates, names, and birth weights rejected in SQL', async () => {
      for (const [index, value] of [[0,' '],[0,'\t'],[0,'x'.repeat(201)],[0,null], [1,'2025-02-29'],[1,'9999-01-01'],[1,'infinity'],[1,null],[2,0],[2,-1],[2,'NaN'],[2,'Infinity'],[4,'']]) {
        const args = [...valid]; args[index] = value
        await assert.rejects(as(owner, create, args), e => ['23514','23502','22008'].includes(e.code))
      }
      await assert.rejects(as(owner, 'update public.children set birth_weight_kg=-1 where id=$1', [childId]), e => e.code === '23514')
    })
    await t.test('failed owner association rolls back child insert', async () => {
      const before = (await as(owner, 'select * from public.children')).rows.length
      await assert.rejects(as(owner, create, [...valid.slice(0,3), '', valid[4]]), e => e.code === '23514')
      assert.equal((await as(owner, 'select * from public.children')).rows.length, before)
    })
    await t.test('unauthenticated access, provenance writes and arbitrary memberships denied', async () => {
      await assert.rejects(as(null, create, valid, 'anon'), e => e.code === '42501')
      await assert.rejects(as(null, create, valid), e => e.code === '42501')
      await assert.rejects(as(null, 'select * from public.children', [], 'anon'), e => e.code === '42501')
      for (const sql of ["update public.children set created_by=gen_random_uuid()", 'delete from public.children',
        "insert into public.children(name,date_of_birth,sex,created_by) values ('Forged','2024-01-01','male',auth.uid())",
        "update public.child_caregivers set access_level='owner'", 'delete from public.child_caregivers',
        `insert into public.child_caregivers(child_id,user_id,relationship,access_level) values ('${childId}',auth.uid(),'parent','owner')`])
        await assert.rejects(as(stranger, sql), e => e.code === '42501')
    })
    await t.test('date-only result is independent of database session timezone', async () => {
      for (const zone of ['Pacific/Honolulu', 'Pacific/Kiritimati', 'Asia/Colombo']) {
        await db.exec(`set timezone='${zone}'`)
        assert.equal((await as(owner, 'select date_of_birth::text as dob from public.children where id=$1', [childId])).rows[0].dob, '2023-02-28')
      }
    })
  } finally { await db.close() }
})

