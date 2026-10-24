import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { Button } from '@/components/ui/button'

type Message = {role:'user'|'assistant';content:string}
export function ChatPanel() {
  const [open,setOpen] = useState(false)
  const [messages,setMessages] = useState<Message[]>([])
  const [input,setInput] = useState('')
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const abort = useRef<AbortController | null>(null)
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => () => abort.current?.abort(), [])
  useEffect(() => { bottom.current?.scrollIntoView({block:'nearest'}) },[messages])
  async function send(text:string) {
    if (busy || !text.trim()) return
    const next:Message[] = [...messages.filter(m=>m.content),{role:'user',content:text.trim()}]
    setMessages([...next,{role:'assistant',content:''}]);setInput('');setBusy(true);setError('')
    const controller = new AbortController();abort.current=controller
    try {
      const session = await supabase?.auth.getSession()
      const response = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.data.session?.access_token ?? ''}`},body:JSON.stringify({messages:next.slice(-20)}),signal:controller.signal})
      if (!response.ok) { const body=await response.json();throw new Error(body.error || 'Chat unavailable.') }
      if (!response.body) throw new Error('Streaming is unavailable.')
      const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';let answer=''
      while(true) {
        const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done})
        const lines=buffer.split('\n');buffer=lines.pop() || ''
        for(const line of lines) {
          if(!line.startsWith('data:')) continue
          const data=JSON.parse(line.slice(5).trim())
          if(data.error) throw new Error('The AI response was interrupted. Please retry.')
          const text=(data.candidates?.[0]?.content?.parts ?? []).map((p:{text?:string})=>p.text ?? '').join('')
          answer+=text
          setMessages([...next,{role:'assistant',content:answer}])
        }
        if(done) break
      }
      if(!answer) throw new Error('No answer was returned. Please rephrase and retry.')
    } catch(e) {if(!controller.signal.aborted) setError(e instanceof Error?e.message:'Unable to connect.')}
    finally {setBusy(false);abort.current=null}
  }
  return <div className="fixed bottom-5 right-5 z-50">
    {open && <section aria-label="SuwaDaru AI assistant" className="mb-3 flex max-h-[75vh] w-[min(24rem,calc(100vw-2.5rem))] flex-col rounded-2xl border bg-background p-4 shadow-xl">
      <div className="flex items-center justify-between"><h2 className="font-semibold">SuwaDaru AI</h2><Button variant="ghost" disabled={busy} onClick={()=>{setMessages([]);setError('')}}>New chat</Button></div>
      <p className="my-2 text-xs text-muted-foreground">General education, not a diagnosis. Messages are sent to Google Gemini. Avoid identifying information. Chat is not saved.</p>
      <div className="flex gap-2 flex-wrap">{['Nutrition tips','Understanding growth','Vaccination questions'].map(p=><Button key={p} variant="outline" size="sm" disabled={busy} onClick={()=>void send(p)}>{p}</Button>)}</div>
      <div role="log" aria-live="polite" className="my-3 min-h-24 overflow-y-auto space-y-3">{messages.map((m,i)=><div key={i} className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap"><strong>{m.role==='user'?'You':'Assistant'}</strong><p>{m.content || (busy?'Thinking…':'Response stopped.')}</p></div>)}<div ref={bottom}/></div>
      {error && <p role="alert" className="mb-2 text-sm text-destructive">{error}</p>}
      <form onSubmit={e=>{e.preventDefault();void send(input)}} className="space-y-2"><label htmlFor="ai-message" className="sr-only">Your question</label><textarea id="ai-message" value={input} onChange={e=>setInput(e.target.value)} maxLength={8000} placeholder="Ask a caregiving question…" className="w-full rounded-lg border p-2" required/><div className="flex gap-2"><Button type="submit" disabled={busy || !input.trim()}>Send</Button>{busy&&<Button type="button" variant="outline" onClick={()=>abort.current?.abort()}>Stop</Button>}</div></form>
    </section>}
    <Button onClick={()=>setOpen(!open)} aria-expanded={open}>{open?'Close assistant':'Ask SuwaDaru AI'}</Button>
  </div>
}
