import { useCallback, useState, type FormEvent } from 'react'
import { useLiveRecords } from '@/hooks/useLiveRecords'
import { vaccinationService } from './vaccinationService'
import { database, check } from '@/services/health'
import { useChild } from '@/features/children'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ChildFeaturePageProps } from '@/types'
const tables=['vaccination_records','vaccination_schedule','children']
export function VaccinationsPage({childId}:ChildFeaturePageProps) {
 const {children}=useChild(); const child=children.find(c=>c.id===childId)
 const load=useCallback(async()=>({records:await vaccinationService.getRecords(childId),schedule:await vaccinationService.getSchedule(childId)}),[childId])
 const {data,error,loading,refresh}=useLiveRecords(load,tables)
 const [failure,setFailure]=useState(''); const [busy,setBusy]=useState(false); const [editing,setEditing]=useState<string|null>(null)
 async function submit(e:FormEvent<HTMLFormElement>) {
   e.preventDefault(); const form=e.currentTarget; const f=new FormData(form); setBusy(true);setFailure('')
   try {
     if(editing) {const {error}=await database().from('vaccination_records').update({administered_on:String(f.get('date'))}).eq('id',editing).select().single();check(error)}
     else await vaccinationService.addReportedDose({childId,vaccineCode:String(f.get('vaccine')),administeredOn:String(f.get('date'))})
     setEditing(null);form.reset();await refresh()
   } catch(e) {setFailure(e instanceof Error?e.message:'Unable to save.')} finally {setBusy(false)}
 }
 return <div className="max-w-4xl space-y-6"><PageHeader title="Vaccinations" subtitle={child?.name}/>
 <p className="text-sm text-muted-foreground">Record doses from your child’s health record. Entries are parent-reported and unverified.</p>
 {loading && <p role="status">Loading records…</p>}{error && <div role="alert">{error}<Button onClick={()=>void refresh()}>Retry</Button></div>}
 <section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold mb-4">{editing?'Correct dose date':'Add reported dose'}</h2>
 <form key={editing??'new'} onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><label>Vaccine and dose<Input name="vaccine" maxLength={120} required disabled={!!editing} defaultValue={data?.records.find(r=>r.id===editing)?.vaccineCode} placeholder="As written on the health record"/></label>
 <label>Date given<Input name="date" type="date" min={child?.dateOfBirth} required defaultValue={data?.records.find(r=>r.id===editing)?.administeredOn??''}/></label>
 {failure&&<p role="alert">{failure}</p>}<Button type="submit" disabled={busy}>{busy?'Saving…':'Save dose'}</Button>{editing&&<Button type="button" variant="outline" onClick={()=>setEditing(null)}>Cancel edit</Button>}</form></section>
 <section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold mb-4">Recorded doses</h2>{data?.records.length===0&&<p>No doses recorded yet.</p>}
 <ul className="divide-y">{data?.records.map(r=><li key={r.id} className="py-3 flex justify-between gap-3"><div><strong>{r.vaccineCode}</strong><p>{r.administeredOn} · Parent-reported</p></div><Button variant="outline" onClick={()=>setEditing(r.id)}>Correct date</Button></li>)}</ul></section>
 <section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Schedule milestones</h2>{data?.schedule.length===0?<p className="mt-2 text-muted-foreground">No reviewed schedule has been published. Check the child’s health record or ask your clinic for due dates.</p>:<ul>{data?.schedule.map(m=><li key={m.id} className="py-2">{m.vaccineName} · {m.dueDate} <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="underline">Source ({m.scheduleVersion})</a></li>)}</ul>}</section>
 </div>
}
