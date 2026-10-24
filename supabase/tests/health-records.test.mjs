import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile,readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const {PGlite}=require('../../node_modules/.phase2-tools/node_modules/@electric-sql/pglite')
test('real health schema: authorization, provenance, dates and persistence',async()=>{
 const db=new PGlite()
 try {
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to anon,authenticated,service_role;
 alter default privileges in schema public grant all on tables to anon,authenticated,service_role;`)
 for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())
   await db.exec(await readFile(new URL('../migrations/'+file,import.meta.url),'utf8'))
 const users=[]
 for(let i=0;i<4;i++) users.push((await db.query("insert into auth.users values(gen_random_uuid(),'{}') returning id")).rows[0].id)
 const [owner,stranger,editor,viewer]=users
 const as=async(user,sql,args=[],role='authenticated')=>db.transaction(async tx=>{
   await tx.exec('set local role '+role); await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user??'']);return tx.query(sql,args)
 })
 const child=(await as(owner,"select * from public.create_child('Test child','2024-01-01','female')")).rows[0].id
 for(const [user,level] of [[editor,'editor'],[viewer,'viewer']]) await db.query("insert into public.child_caregivers(child_id,user_id,relationship,access_level) values($1,$2,'test',$3)",[child,user,level])
 for(const [table,columns,values] of [
 ['growth_measurements','child_id,measured_on,weight_kg',"$1,'2024-04-01',5"],
 ['vaccination_records','child_id,vaccine_code,administered_on',"$1,'Test dose','2024-04-01'"],
 ['clinic_appointments','child_id,clinic_name,scheduled_at',"$1,'Test clinic','2027-01-01T10:00:00+05:30'"],
 ['nutrition_messages','child_id,body',"$1,'Test note'"]]) {
   const insert=`insert into public.${table}(${columns}) values(${values}) returning *`
   const record=(await as(owner,insert,[child])).rows[0]
   assert.equal(record.created_by,owner)
   assert.equal((await as(stranger,`select * from public.${table}`)).rows.length,0)
   assert.equal((await as(viewer,`select * from public.${table}`)).rows.length,1)
   await assert.rejects(as(viewer,insert,[child]))
   await assert.rejects(as(stranger,insert,[child]))
   await assert.rejects(as(null,`select * from public.${table}`,[],'anon'))
   await assert.rejects(as(owner,`update public.${table} set created_by=$1`,[stranger]))
   await assert.rejects(as(owner,`delete from public.${table}`))
 }
 await as(editor,"update public.growth_measurements set weight_kg=5.5 where child_id=$1",[child])
 assert.equal((await as(viewer,"update public.growth_measurements set weight_kg=9 returning id")).rows.length,0)
 for(const day of ['2023-01-01','2999-01-01','infinity']) await assert.rejects(as(owner,"insert into public.growth_measurements(child_id,measured_on,weight_kg) values($1,$2,5)",[child,day]))
 for(const number of ['0','-1','NaN','Infinity']) await assert.rejects(as(owner,"insert into public.growth_measurements(child_id,measured_on,weight_kg) values($1,'2024-05-01',$2)",[child,number]))
 await assert.rejects(as(owner,"insert into public.nutrition_messages(child_id,body,sender) values($1,'forged','assistant')",[child]))
 await assert.rejects(as(owner,"insert into public.vaccination_records(child_id,vaccine_code,administered_on,source) values($1,'forged','2024-01-01','health_worker_verified')",[child]))
 await as(owner,"insert into public.todos(title) values('Test task')")
 assert.equal((await as(stranger,'select * from public.todos')).rows.length,0)
 assert.equal((await as(owner,'select * from public.todos')).rows.length,1)
 assert.equal((await as(owner,'select * from public.growth_references')).rows.length,0)
 assert.equal((await as(owner,'select * from public.vaccination_schedule')).rows.length,0)
 console.log('Health access, isolation, validation and provenance checks passed.')
 } finally {await db.close()}
})
