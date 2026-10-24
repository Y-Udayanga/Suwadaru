// Uses only disposable test accounts provisioned for this run. Never real records.
import {readFileSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {createClient} from '@supabase/supabase-js'
const users=JSON.parse(readFileSync('node_modules/.hosted-test.json','utf8'))
const url='https://jrlithrdswjallpolwep.supabase.co'
const key='sb_publishable_xqEkbKRx3x9Ok7ahCW3mxw_Dl_zHrhN'
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
const owner=client(),stranger=client(),observer=client()
const ok=({data,error})=>{if(error)throw error;return data}
let channel
try {
 for(const [c,u] of [[owner,users[0]],[stranger,users[1]],[observer,users[0]]]) ok(await c.auth.signInWithPassword({email:u.email,password:u.password}))
 const profile=ok(await owner.from('user_profiles').select().single());assert.equal(profile.id,users[0].id)
 const child=ok(await owner.rpc('create_child',{p_name:'Disposable integration check',p_date_of_birth:'2024-01-01',p_sex:'female'}))
 writeFileSync('node_modules/.hosted-child.json',JSON.stringify({id:child.id}))
 assert.equal(ok(await stranger.from('children').select().eq('id',child.id)).length,0)
 let signal
 const received=new Promise(resolve=>{signal=resolve})
 channel=observer.channel('test-live-'+child.id)
 channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'growth_measurements',filter:'child_id=eq.'+child.id},payload=>signal(payload.new))
 await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('Realtime subscription timed out')),15000)
   channel.on('system',{},payload=>{if(payload.extension==='postgres_changes'&&payload.status==='ok'){clearTimeout(timeout);resolve()}})
   channel.subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timeout);reject(new Error('Realtime '+status))}})
 })
 const measurement=ok(await owner.from('growth_measurements').insert({child_id:child.id,measured_on:'2024-06-01',weight_kg:6.25}).select().single())
 const event=await Promise.race([received,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Live insert event not received')),15000))])
 assert.equal(event.id,measurement.id)
 assert.equal(ok(await observer.from('growth_measurements').select().eq('id',measurement.id))[0].weight_kg,6.25)
 assert.equal(ok(await stranger.from('growth_measurements').select().eq('child_id',child.id)).length,0)
 assert.ok((await stranger.from('growth_measurements').insert({child_id:child.id,measured_on:'2024-06-01',weight_kg:6})).error)
 assert.ok((await owner.from('growth_measurements').insert({child_id:child.id,measured_on:'2023-01-01',weight_kg:6})).error)
 ok(await owner.from('vaccination_records').insert({child_id:child.id,vaccine_code:'Disposable test dose',administered_on:'2024-06-01'}).select().single())
 const appt=ok(await owner.from('clinic_appointments').insert({child_id:child.id,clinic_name:'Disposable test clinic',scheduled_at:'2027-01-01T09:00:00+05:30'}).select().single())
 assert.equal(ok(await owner.from('clinic_appointments').update({status:'cancelled'}).eq('id',appt.id).select().single()).status,'cancelled')
 ok(await owner.from('nutrition_messages').insert({child_id:child.id,body:'Disposable verification note'}).select().single())
 assert.ok((await owner.from('nutrition_messages').insert({child_id:child.id,body:'Forbidden impersonation',sender:'assistant'})).error)
 ok(await owner.from('todos').insert({title:'Disposable verification task'}).select().single())
 console.log('PASS: authenticated profile, atomic child creation, health CRUD, account isolation, validation, and live WebSocket delivery between independent clients.')
} finally {
 if(channel)await observer.removeChannel(channel)
 for(const c of [owner,stranger,observer])await c.auth.signOut()
}
