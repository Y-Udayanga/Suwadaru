import { useEffect, useId, useRef, useState } from 'react'
import { streamChat, type ChatTurn } from '@/services/gemini'

type Message = { role: 'user' | 'model'; text: string; incomplete?: boolean }
const starters = [
  { label: 'Meal ideas', prompt: 'Help me plan nutritious meals using Sri Lankan ingredients. What information do you need about age and allergies?' },
  { label: 'Feeding habits', prompt: 'How can caregivers make mealtimes calm and encourage a varied diet?' },
  { label: 'Growth questions', prompt: 'Explain how a caregiver can discuss a child’s growth chart with their midwife without self-diagnosing.' },
  { label: 'Vaccination questions', prompt: 'Explain why childhood vaccinations matter and what questions to ask at a clinic visit. Do not give a vaccine schedule.' },
]

export function AiChat({ title = 'SuwaDaru AI assistant' }: { title?: string }) {
  const questionId = useId()
  const [messages, setMessages] = useState<Message[]>([])
  const [prompt, setPrompt] = useState(''), [answer, setAnswer] = useState('')
  const [error, setError] = useState(''), [model, setModel] = useState('')
  const [busy, setBusy] = useState(false)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const controller = useRef<AbortController | null>(null)
  const history = useRef<ChatTurn[]>([])
  const transcript = useRef<HTMLDivElement>(null)
  const follow = useRef(true)

  useEffect(() => {
    const status = new AbortController()
    void fetch('/api/chat', { signal: status.signal }).then(async response => {
      if (!response.ok) throw new Error('AI endpoint unavailable')
      const data = await response.json()
      if (!status.signal.aborted) setConfigured(data.configured === true)
    }).catch(() => { if (!status.signal.aborted) setConfigured(false) })
    return () => { status.abort(); controller.current?.abort(); controller.current = null }
  }, [])

  useEffect(() => {
    if (follow.current && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight
  }, [answer, messages, busy])

  async function send() {
    const question = prompt.trim()
    if (!question || controller.current) return
    const active = new AbortController()
    controller.current = active
    let partial = ''
    setBusy(true); setError(''); setAnswer(''); setPrompt(''); setModel('')
    follow.current = true
    setMessages(current => [...current, { role: 'user', text: question }])
    try {
      const result = await streamChat({
        prompt: question, history: history.current, signal: active.signal,
        onModel: value => { if (controller.current === active) setModel(value) },
        onText: value => { partial = value; if (controller.current === active) setAnswer(value) },
      })
      if (controller.current !== active) return
      history.current = [...history.current, { role: 'user', parts: [{ text: question }] }, { role: 'model', parts: [{ text: result.text }] }].slice(-12) as ChatTurn[]
      setMessages(current => [...current, { role: 'model', text: result.text }])
      setConfigured(true)
    } catch (failure) {
      if (controller.current !== active) return
      if (partial) setMessages(current => [...current, { role: 'model', text: partial, incomplete: true }])
      setPrompt(question)
      setError(active.signal.aborted ? 'Response stopped. Any partial answer is marked incomplete. Send again to retry.' : failure instanceof Error ? failure.message : 'Could not send your question. Please retry.')
    } finally {
      if (controller.current === active) { controller.current = null; setBusy(false); setAnswer('') }
    }
  }

  return <section className="mx-auto w-full min-w-0 max-w-3xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      <span role="status" className="rounded-full bg-mint px-3 py-1 text-sm text-slate-900">{busy ? (answer ? 'Responding live' : 'Connecting…') : configured === null ? 'Checking connection…' : configured ? 'AI configured' : 'AI connection unavailable'}</span>
    </div>
    <p className="text-sm text-muted-foreground">Ask about nutrition, feeding, growth education, or clinic questions in English, Sinhala, or Tamil. AI can make mistakes; ask your midwife or doctor for personal medical advice.</p>
    <p className="text-xs text-muted-foreground">Your conversation is sent to Google Gemini. Avoid names or identifying details. Chats stay in this page’s memory and clear when you leave or start a new chat.</p>
    <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
      {starters.map(starter => <button type="button" key={starter.label} disabled={busy} onClick={() => setPrompt(starter.prompt)} className="min-h-11 rounded-full border border-border bg-card px-4 text-sm hover:bg-mint disabled:opacity-50">{starter.label}</button>)}
    </div>
    <div ref={transcript} onScroll={e => { const el = e.currentTarget; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80 }} className="max-h-[55dvh] min-h-48 sm:min-h-64 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-4" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
      {!messages.length && <p className="text-muted-foreground">How can I help today? Include your child’s age and any food allergies when asking for meal ideas.</p>}
      {messages.map((message, index) => <article key={index} className={`whitespace-pre-wrap [overflow-wrap:anywhere] rounded-xl p-4 ${message.role === 'user' ? 'bg-mint text-slate-900' : 'bg-muted'}`}>
        <p className="mb-2 text-sm font-semibold">{message.role === 'user' ? 'You' : 'SuwaDaru'}</p>
        <p>{message.text}</p>
        {message.incomplete && <p className="mt-2 text-sm font-medium">Incomplete answer — please retry before relying on it.</p>}
      </article>)}
      {busy && <article className="whitespace-pre-wrap [overflow-wrap:anywhere] rounded-xl bg-muted p-4"><p className="mb-2 text-sm font-semibold">SuwaDaru</p><p>{answer || 'Thinking…'}</p></article>}
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <form onSubmit={event => { event.preventDefault(); void send() }} className="space-y-3">
      <label htmlFor={questionId} className="block font-medium">Your question</label>
      <textarea id={questionId} value={prompt} onChange={e => setPrompt(e.target.value)} disabled={busy} maxLength={4000} rows={3} placeholder="Ask a question or choose a suggestion above…" className="w-full rounded-xl border border-border bg-card p-3 focus-visible:outline-2 focus-visible:outline-ring" />
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={busy || !prompt.trim()} className="min-h-11 rounded-xl bg-primary px-6 py-2 font-medium text-primary-foreground disabled:opacity-50">Send</button>
        {busy && <button type="button" onClick={() => controller.current?.abort()} className="min-h-11 rounded-xl border border-border px-4">Stop response</button>}
        <button type="button" disabled={busy} onClick={() => { history.current = []; setMessages([]); setError(''); setAnswer(''); setPrompt(''); setModel('') }} className="min-h-11 rounded-xl border border-border px-4 disabled:opacity-50">New chat</button>
        <span className="ml-auto text-xs text-muted-foreground">{prompt.length}/4000</span>
      </div>
    </form>
    {model && <p className="text-xs text-muted-foreground">Powered by {model}</p>}
  </section>
}
