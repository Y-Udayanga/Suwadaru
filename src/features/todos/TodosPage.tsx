import {useCallback,useState,type FormEvent} from 'react'
import {useLiveRecords} from '@/hooks/useLiveRecords'
import {database,check,listRows} from '@/services/health'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
const tables=['todos'];type Todo={id:string;title:string;completed:boolean}
export function TodosPage(){
 const load=useCallback(()=>listRows<Todo>('todos'),[]);const {data,error,loading,refresh}=useLiveRecords(load,tables)
 const [failure,setFailure]=useState('');const [busy,setBusy]=useState(false)
 async function add(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;const title=String(new FormData(form).get('title'));setBusy(true);setFailure('');try{const{error}=await database().from('todos').insert({title}).select().single();check(error);form.reset();await refresh()}catch(e){setFailure(e instanceof Error?e.message:'Unable to save.')}finally{setBusy(false)}}
 async function toggle(t:Todo){setFailure('');try{const{error}=await database().from('todos').update({completed:!t.completed}).eq('id',t.id).select().single();check(error);await refresh()}catch(e){setFailure(e instanceof Error?e.message:'Unable to save.')}}
 return <div className="mx-auto max-w-xl space-y-5 p-6"><h1 className="text-2xl font-semibold">My tasks</h1>{loading&&<p role="status">Loading…</p>}{(error||failure)&&<p role="alert">{error||failure}</p>}<form className="flex gap-2" onSubmit={add}><Input name="title" aria-label="New task" required maxLength={500}/><Button type="submit" disabled={busy}>Add</Button></form>{data?.length===0&&<p>No tasks yet.</p>}<ul className="space-y-3">{data?.map(t=><li key={t.id}><label className="flex gap-3"><input type="checkbox" checked={t.completed} onChange={()=>void toggle(t)}/><span className={t.completed?'line-through':''}>{t.title}</span></label></li>)}</ul></div>
}
