import { useCallback,useState,type FormEvent } from 'react'
import { useLiveRecords } from '@/hooks/useLiveRecords'
import { nutritionService } from './nutritionService'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import type { ChildFeaturePageProps } from '@/types'
const tables=['nutrition_messages']
export function NutritionPage({childId}:ChildFeaturePageProps) {
 const load=useCallback(()=>nutritionService.list(childId),[childId])
 const {data,error,loading,refresh}=useLiveRecords(load,tables,childId)
 const [busy,setBusy]=useState(false);const [failure,setFailure]=useState('')
 async function submit(e:FormEvent<HTMLFormElement>) {e.preventDefault();const form=e.currentTarget;const f=new FormData(form);setBusy(true);setFailure('');try {await nutritionService.add(childId,String(f.get('body')));form.reset();await refresh()} catch(e){setFailure(e instanceof Error?e.message:'Unable to save note.')}finally{setBusy(false)}}
 return <div className="max-w-3xl space-y-6"><PageHeader title="Nutrition notes" subtitle="Save feeding observations and questions for your next clinic visit."/>
 <p className="text-sm text-muted-foreground">Use “Ask SuwaDaru AI” for live nutrition questions. Notes below are saved separately and are not automatically shared with the assistant.</p>
 {loading&&<p role="status">Loading notes…</p>}{error&&<div role="alert">{error}<Button onClick={()=>void refresh()}>Retry</Button></div>}
 <div className="space-y-3">{data?.length===0&&<p>No notes saved yet.</p>}{data?.map(n=><article key={n.id} className="rounded-2xl border bg-card p-5"><p className="whitespace-pre-wrap">{n.body}</p><p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()} · {n.sender==='user'?'Caregiver note':'Assistant'}</p></article>)}</div>
 <form className="space-y-3" onSubmit={submit}><label htmlFor="nutrition-note" className="font-medium">New note</label><textarea id="nutrition-note" name="body" required maxLength={8000} rows={4} className="block w-full rounded-xl border bg-card p-3"/>{failure&&<p role="alert">{failure}</p>}<Button disabled={busy} type="submit">{busy?'Saving…':'Save note'}</Button></form></div>
}
