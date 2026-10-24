import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
import { createClient } from '@supabase/supabase-js'
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
}).outputText).toString('base64')
const errors = moduleUrl(await readFile(new URL('../contracts/errors.ts', import.meta.url), 'utf8'))
const source = (await readFile(new URL('./child-service.ts', import.meta.url), 'utf8')).replace("'../contracts/errors'", JSON.stringify(errors))
const { createChildService } = await import(moduleUrl(source))
const id = '11111111-1111-4111-8111-111111111111'
const row = { id, name:'Fictional Child', date_of_birth:'2024-02-29', sex:'female', birth_weight_kg:3.125, clinic_name:'Fictional Clinic', created_by:id, created_at:'2026-01-01T00:00:00Z', updated_at:'2026-01-01T00:00:00Z' }
const input = { name:row.name, dateOfBirth:row.date_of_birth, sex:row.sex, birthWeightKg:3.125, clinicName:row.clinic_name }
function fixture({ user = {id}, failure = null } = {}) {
  const calls = []
  // Exercise actual installed PostgREST serialization, against synthetic HTTP.
  const client = createClient('https://fictional.example.test', 'sb_publishable_fictional', {
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:async (url, init) => {
      const path = new URL(url)
      const body = init.body ? JSON.parse(init.body) : null
      calls.push({path, body, method:init.method})
      if (failure) return Response.json(failure, {status:400})
      const single = new Headers(init.headers).get('accept')?.includes('object')
      return Response.json(path.pathname.includes('/rpc/') || single ? row : [row, {...row,id:'22222222-2222-4222-8222-222222222222'}])
    }},
  })
  client.auth.getUser = async () => ({data:{user},error:null})
  return { service:createChildService(client, () => new Date('2026-10-24T18:30:00Z')), calls }
}
test('create, list, get and update map frontend fields and preserve aliases', async () => {
  const {service:s, calls} = fixture()
  assert.deepEqual(await s.createChild(input), {id,...input})
  assert.deepEqual(calls[0].body, {p_name:input.name,p_date_of_birth:input.dateOfBirth,p_sex:input.sex,p_birth_weight_kg:3.125,p_clinic_name:input.clinicName})
  assert.equal((await s.getMyChildren()).length, 2)
  assert.deepEqual(await s.getChildById(id), {id,...input})
  await s.updateChild(id, {name:' Updated ',birthWeightKg:null,clinicName:null})
  assert.deepEqual(calls.at(-1).body, {name:'Updated',birth_weight_kg:null,clinic_name:null})
  assert.equal(calls.at(-1).path.searchParams.get('id'), `eq.${id}`)
  for (const [alias, method] of [['list','getMyChildren'],['get','getChildById'],['create','createChild'],['update','updateChild']]) assert.equal(s[alias], s[method])
})
test('invalid names, dates, weights and required fields never reach Data API', async () => {
  const {service:s,calls} = fixture()
  for (const patch of [{name:''},{name:'\t'},{name:'x'.repeat(201)},{name:'A\nB'}, {dateOfBirth:'2025-02-29'}, {dateOfBirth:'2024-02-30'}, {dateOfBirth:'0000-01-01'}, {dateOfBirth:'2026-10-26'}, {dateOfBirth:'2024-02-29T00:00:00Z'}, {dateOfBirth:''}, {birthWeightKg:0},{birthWeightKg:-1},{birthWeightKg:NaN},{birthWeightKg:Infinity},{birthWeightKg:'3'}, {sex:'other'}, {created_by:id}, {clinicName:''}])
    await assert.rejects(s.createChild({...input,...patch}), e => e.code === 'validation')
  await assert.rejects(s.createChild({}), e => e.code === 'validation')
  await assert.rejects(s.updateChild(id, {}), e => e.code === 'validation')
  await assert.rejects(s.getChildById('bad-id'), e => e.code === 'validation')
  assert.equal(calls.length,0)
})
test('date strings survive leap day and Colombo midnight without timezone shifts', async () => {
  const {service:s,calls} = fixture()
  for (const dateOfBirth of ['2024-02-29','2026-10-25']) {
    await s.createChild({...input,dateOfBirth})
    assert.equal(calls.at(-1).body.p_date_of_birth, dateOfBirth)
  }
})
test('unauthenticated and unconfigured operations return consistent errors', async () => {
  const {service:s,calls} = fixture({user:null})
  for (const action of [() => s.createChild(input), () => s.getMyChildren(), () => s.getChildById(id), () => s.updateChild(id,{name:'Fictional'})])
    await assert.rejects(action(), e => e.code === 'unauthenticated')
  assert.equal(calls.length,0)
  await assert.rejects(createChildService(null).getMyChildren(), e => e.code === 'unavailable')
})
test('RLS-hidden rows, expired JWTs and server failures expose safe errors', async () => {
  for (const [code, expected] of [['PGRST116','not_found'],['42501','not_found'],['PGRST301','unauthenticated'],['23514','validation'],['XX000','unavailable']]) {
    const {service:s} = fixture({failure:{code,message:'SECRET DATABASE DETAIL'}})
    await assert.rejects(s.getChildById(id), e => e.code === expected && !e.message.includes('SECRET'))
    await assert.rejects(s.updateChild(id,{name:'Fictional'}), e => e.code === expected)
  }
})
