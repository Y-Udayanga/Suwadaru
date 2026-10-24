export interface ChatTurn { role: 'user' | 'model'; parts: { text: string }[] }
export interface ChatOptions {
  prompt: string
  history?: ChatTurn[]
  signal?: AbortSignal
  onText?: (text: string) => void
  onModel?: (model: string) => void
}

export async function streamChat(options: ChatOptions) {
  // Keep complete question/answer pairs within the server's context budget.
  const history = (options.history || []).slice(-12)
  while (history.length && JSON.stringify(history).length > 14000) history.splice(0, 2)
  const response = await fetch('/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: options.prompt, history }), signal: options.signal,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `AI request failed (${response.status}). Please retry.`)
  }
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('The AI endpoint is unavailable. Please contact the site administrator.')
  const modelUsed = response.headers.get('X-AI-Model') || 'Gemini'
  options.onModel?.(modelUsed)
  const reader = response.body.getReader(), decoder = new TextDecoder()
  let pending = '', text = '', finished = false
  function consume(event: string) {
    const raw = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n').trim()
    if (!raw || raw === '[DONE]') return
    const data = JSON.parse(raw)
    if (data.error) throw new Error(data.error.message || 'AI stream interrupted.')
    if (data.promptFeedback?.blockReason) throw new Error('The model could not answer that question. Please rephrase it.')
    const candidate = data.candidates?.[0]
    const reason = candidate?.finishReason
    if (reason && !['STOP', 'MAX_TOKENS'].includes(reason)) throw new Error('The model could not complete this answer. Please rephrase your question.')
    const chunk = (candidate?.content?.parts || []).filter((part: { thought?: boolean }) => !part.thought).map((part: { text?: string }) => part.text || '').join('')
    if (chunk) { text += chunk; options.onText?.(text) }
    if (reason === 'MAX_TOKENS') throw new Error('The answer reached its length limit. Ask a shorter question or request one part at a time.')
    if (reason === 'STOP') finished = true
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      pending += decoder.decode(value, { stream: !done })
      // Normalize CRLF after buffering, including boundaries split between network chunks.
      pending = pending.replace(/\r\n/g, '\n')
      let boundary: number
      while ((boundary = pending.indexOf('\n\n')) !== -1) {
        consume(pending.slice(0, boundary)); pending = pending.slice(boundary + 2)
      }
      if (done) { if (pending.trim()) consume(pending); break }
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
  if (!text.trim()) throw new Error('No answer returned. Please rephrase your question.')
  if (!finished) throw new Error('The connection ended before the answer completed. Please retry.')
  return { text, modelUsed }
}
