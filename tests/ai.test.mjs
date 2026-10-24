import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { test } from 'node:test'
import { chatHandler } from '../server/chat.ts'
import { streamChat } from '../src/services/gemini.ts'

const event = (text, finishReason) => `data: ${JSON.stringify({candidates:[{content:{parts:[{text}]}, ...(finishReason ? {finishReason} : {})}]})}\r\n\r\n`
async function withServer(provider, run, env = {GEMINI_API_KEY:'test-only'}) {
  const server = createServer((req, res) => void chatHandler(req, res, env, provider))
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  try { await run(`http://127.0.0.1:${server.address().port}`) }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
}

test('rejects malformed and oversized requests before calling provider', async () => {
  await withServer(() => {throw new Error('Provider must not be called')}, async base => {
    for (const [body, expected] of [['null',400],['{',400],[JSON.stringify({prompt:' '}),400],[JSON.stringify({prompt:'Hello',history:{}}),400],[JSON.stringify({prompt:'Hello',history:[{role:'model',parts:[{text:'bad'}]}]}),400],[JSON.stringify({prompt:'x'.repeat(70000)}),413]]) {
      const response = await fetch(base, {method:'POST',headers:{'Content-Type':'application/json'},body})
      assert.equal(response.status, expected)
    }
    const cross = await fetch(base, {method:'POST',headers:{'Content-Type':'application/json','Sec-Fetch-Site':'cross-site'},body:JSON.stringify({prompt:'Hello'})})
    assert.equal(cross.status,403)
  })
})

test('streams chunks before upstream finishes, preserving history and server-only key', async () => {
  let release
  const gate = new Promise(resolve => {release=resolve})
  const encoder = new TextEncoder()
  await withServer(async (url, options) => {
    assert.match(url, /streamGenerateContent\?alt=sse$/)
    assert.equal(options.headers['x-goog-api-key'],'test-only')
    const body = JSON.parse(options.body)
    assert.deepEqual(body.contents.map(t=>t.role),['user','model','user'])
    return new Response(new ReadableStream({async start(controller){controller.enqueue(encoder.encode(event('Hello '))); await gate; controller.enqueue(encoder.encode(event('world','STOP'))); controller.close()}}))
  }, async base => {
    const response = await fetch(base, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Next',history:[{role:'user',parts:[{text:'First'}]},{role:'model',parts:[{text:'Answer'}]}]})})
    assert.match(response.headers.get('content-type'), /text\/event-stream/)
    const reader = response.body.getReader()
    const first = await reader.read()
    assert.match(new TextDecoder().decode(first.value), /Hello /)
    release()
    let remainder=''
    while(true){const {value,done}=await reader.read(); if(done)break; remainder+=new TextDecoder().decode(value)}
    assert.match(remainder,/world/)
  })
})

test('falls back only before streaming and reports actual selected model', async () => {
  let calls=0
  await withServer(async () => ++calls===1 ? new Response('',{status:429}) : new Response(event('OK','STOP')), async base => {
    const response=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Hello'})})
    assert.equal(response.status,200); assert.equal(response.headers.get('x-ai-model'),'fallback'); assert.match(await response.text(),/OK/)
  }, {GEMINI_API_KEY:'test-only',GEMINI_MODEL:'primary',GEMINI_FALLBACK_MODELS:'fallback'})
  assert.equal(calls,2)
})

test('client handles fragmented UTF-8 SSE and refuses truncated success', async () => {
  const original=globalThis.fetch
  const bytes=new TextEncoder().encode(event('ආයුබෝවන් ') + event('hello','STOP'))
  const updates=[]
  try {
    globalThis.fetch=async () => new Response(new ReadableStream({start(c){for(const byte of bytes)c.enqueue(Uint8Array.of(byte));c.close()}}),{headers:{'Content-Type':'text/event-stream','X-AI-Model':'tested'}})
    const result=await streamChat({prompt:'hello',onText:text=>updates.push(text)})
    assert.equal(result.text,'ආයුබෝවන් hello'); assert.equal(result.modelUsed,'tested'); assert.equal(updates.length,2)
    globalThis.fetch=async () => new Response(event('incomplete'),{headers:{'Content-Type':'text/event-stream'}})
    await assert.rejects(streamChat({prompt:'hello'}),/before the answer completed/)
    globalThis.fetch=async () => new Response('data: {"error":{"message":"Disconnected"}}\n\n',{headers:{'Content-Type':'text/event-stream'}})
    await assert.rejects(streamChat({prompt:'hello'}),/Disconnected/)
  } finally {globalThis.fetch=original}
})
