// No network, real accounts, secrets, or mail delivery. Transpile the actual TS
// sources in memory so these Node tests need no application test dependency.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
import { createClient } from '@supabase/supabase-js'

function moduleUrl(source) {
  return 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  }).outputText).toString('base64')
}
const serviceUrl = moduleUrl(await readFile(new URL('./auth-service.ts', import.meta.url), 'utf8'))
const { createAuthService, AuthServiceError, toAuthError } = await import(serviceUrl)
const stateSource = (await readFile(new URL('./auth-state.ts', import.meta.url), 'utf8')).replace("'./auth-service'", JSON.stringify(serviceUrl))
const { observeAuth, initialAuthState } = await import(moduleUrl(stateSource))

const user = { id: 'fictional-parent', email: 'parent@example.test' }
const session = { user, access_token: 'synthetic-access', refresh_token: 'synthetic-refresh' }

function fixture(overrides = {}) {
  let listener = () => {}
  let current = null
  let unsubscribed = 0
  const calls = []
  const auth = {
    signUp: async input => { calls.push(['signup', input]); return {data:{session:null},error:null} },
    signInWithPassword: async input => { calls.push(['signin', input]); current = session; listener('SIGNED_IN', session); return {data:{session},error:null} },
    signOut: async input => { calls.push(['signout', input]); current = null; listener('SIGNED_OUT', null); return {error:null} },
    resetPasswordForEmail: async (...input) => { calls.push(['reset', ...input]); return {error:null} },
    updateUser: async input => { calls.push(['update', input]); listener('USER_UPDATED', session); return {data:{user},error:null} },
    getUser: async () => ({data:{user},error:null}),
    getSession: async () => ({data:{session:current},error:null}),
    exchangeCodeForSession: async code => { calls.push(['exchange',code]); current = session; listener('SIGNED_IN', session); return {data:{session},error:null} },
    onAuthStateChange: cb => { listener = cb; return {data:{subscription:{unsubscribe:() => { unsubscribed++ }}}} },
    ...overrides,
  }
  return { service: createAuthService({auth}, () => 'https://app.example.test'), calls,
    emit: (event, value) => listener(event,value), unsubscribed: () => unsubscribed }
}
const input = {email:' parent@example.test ',password:' pass word ',fullName:' Parent Example '}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('signup uses safe name metadata and distinguishes pending confirmation', async () => {
  const f = fixture()
  assert.deepEqual(await f.service.signUp(input), {status:'verification_pending',session:null})
  assert.deepEqual(f.calls[0][1], {email:'parent@example.test',password:' pass word ',options:{data:{full_name:'Parent Example'},emailRedirectTo:'https://app.example.test/auth/callback'}})
  const immediate = fixture({signUp:async () => ({data:{session},error:null})})
  assert.equal((await immediate.service.signUp(input)).status, 'authenticated')
})
test('invalid signup input never reaches auth; passwords remain unmodified', async () => {
  const f = fixture()
  for (const change of [{fullName:' '},{fullName:'x'.repeat(201)},{fullName:'a\nb'},{password:'short'},{email:'invalid'}]) {
    await assert.rejects(f.service.signUp({...input,...change}), error => error.code === 'validation')
  }
  assert.equal(f.calls.length, 0)
})
test('sign in and sign out publish authenticated/unauthenticated transitions', async () => {
  const f = fixture()
  const states = [initialAuthState]
  const stop = observeAuth(f.service, value => states.push(value))
  await tick()
  assert.equal(await f.service.getCurrentUser(), null)
  await f.service.signIn(input)
  assert.equal((await f.service.getCurrentUser()).id, user.id)
  await f.service.signOut()
  assert.deepEqual(states.map(state => state.status), ['loading','unauthenticated','authenticated','unauthenticated'])
  assert.equal(states.at(-1).user, null)
  assert.deepEqual(f.calls.at(-1), ['signout',{scope:'local'}])
  stop()
  assert.equal(f.unsubscribed(), 1)
})
test('invalid credentials, unconfirmed email and unknown errors expose safe actionable messages', async () => {
  for (const [code, expected] of [['invalid_credentials','invalid_credentials'],['email_not_confirmed','email_unconfirmed'],['over_request_rate_limit','rate_limited'],['database_failure','unavailable']]) {
    const f = fixture({signInWithPassword:async () => ({data:{session:null},error:{code,message:'SECRET TECHNICAL DETAIL'}})})
    await assert.rejects(f.service.signIn(input), error => error.code === expected && !error.message.includes('SECRET'))
  }
  assert.equal(toAuthError(new Error('SECRET')).code, 'unavailable')
})
test('restores session on refresh and clears listener on unmount', async () => {
  const f = fixture({getSession:async () => ({data:{session},error:null})})
  const states = []
  const stop = observeAuth(f.service, state => states.push(state))
  await tick()
  assert.equal(states[0].user.id, user.id)
  stop()
  f.emit('SIGNED_OUT', null)
  assert.equal(states.length, 1)
})
test('stale restoration cannot undo logout; no update after cleanup', async () => {
  let resolve
  const f = fixture({getSession:() => new Promise(done => { resolve = done })})
  const states = []
  const stop = observeAuth(f.service, state => states.push(state))
  f.emit('SIGNED_OUT', null)
  resolve({data:{session},error:null})
  await tick()
  assert.equal(states.length, 1)
  assert.equal(states[0].status, 'unauthenticated')
  stop()
  const states2 = []
  const stop2 = observeAuth(f.service, state => states2.push(state))
  stop2()
  resolve({data:{session},error:null})
  await tick()
  assert.equal(states2.length, 0)
})
test('restoration failure becomes safe unauthenticated error state', async () => {
  const f = fixture({getSession:async () => {throw new Error('internal failure')}})
  const states = []
  const stop = observeAuth(f.service, state => states.push(state))
  await tick()
  assert.equal(states[0].status, 'unauthenticated')
  assert.equal(states[0].error.code, 'unavailable')
  stop()
})
test('confirmation and recovery code exchange are deduplicated for StrictMode', async () => {
  const f = fixture()
  const url = 'https://app.example.test/auth/callback?code=synthetic-code'
  const [a,b] = await Promise.all([f.service.completeCallback(url),f.service.completeCallback(url)])
  assert.equal(a, session)
  assert.equal(b, session)
  assert.equal(f.calls.length, 1)
  await f.service.completeCallback('https://app.example.test/reset-password?code=another-code')
  assert.equal(f.calls.length, 2)
})
test('expired/invalid/reset-error links cannot fall back to an existing session', async () => {
  const f = fixture({exchangeCodeForSession:async () => ({data:{session:null},error:{code:'otp_expired'}})})
  for (const path of ['/reset-password','/reset-password?error=access_denied&error_description=SECRET','/reset-password#error=access_denied','/reset-password?code=expired']) {
    await assert.rejects(f.service.completeCallback('https://app.example.test'+path), error => error instanceof AuthServiceError && error.code === 'invalid_link' && !error.message.includes('SECRET'))
  }
})
test('reset email has fixed redirect; password update requires a valid current user', async () => {
  const f = fixture()
  await f.service.sendPasswordReset(input.email)
  assert.deepEqual(f.calls[0], ['reset','parent@example.test',{redirectTo:'https://app.example.test/reset-password'}])
  await assert.rejects(f.service.updatePassword('new-password'), error => error.code === 'unauthenticated')
  await f.service.completeCallback('https://app.example.test/reset-password?code=recovery-code')
  await f.service.updatePassword(' new password ')
  assert.deepEqual(f.calls.at(-1), ['update',{password:' new password '}])
})
test('missing configuration preserves public routes and returns safe errors for auth actions', async () => {
  const service = createAuthService(null, () => 'https://app.example.test')
  assert.equal(await service.getSession(), null)
  assert.equal(await service.getCurrentUser(), null)
  service.onAuthStateChange(() => {})()
  await assert.rejects(service.signIn(input), error => error.code === 'unavailable')
})

test('installed Supabase SDK: PKCE recovery, session persistence, password change and logout', async () => {
  const values = new Map()
  const storage = { getItem:key => values.get(key) ?? null,
    setItem:(key,value) => values.set(key,value), removeItem:key => values.delete(key) }
  const sdkUser = { ...user, aud:'authenticated', role:'authenticated',
    app_metadata:{provider:'email'}, user_metadata:{full_name:'Fictional Parent'},
    created_at:'2026-01-01T00:00:00Z' }
  const payload = {access_token:'synthetic-access',refresh_token:'synthetic-refresh',
    token_type:'bearer',expires_in:3600,user:sdkUser}
  const requests = []
  const options = {
    auth:{storage,storageKey:'phase4-sdk-test',flowType:'pkce',persistSession:true,
      autoRefreshToken:false,detectSessionInUrl:false,debug:false},
    global:{fetch:async (url, init) => {
      const path = new URL(url)
      requests.push({path:path.pathname,method:init?.method})
      if (path.pathname.endsWith('/recover')) return Response.json({})
      if (path.pathname.endsWith('/token')) return Response.json(payload)
      if (path.pathname.endsWith('/user')) return Response.json(sdkUser)
      if (path.pathname.endsWith('/logout')) return new Response(null,{status:204})
      throw new Error('Unexpected SDK endpoint')
    }},
  }
  const client = createClient('https://project.example.test','sb_publishable_synthetic',options)
  const service = createAuthService(client, () => 'https://app.example.test')
  const events = []
  const stop = service.onAuthStateChange(event => events.push(event))
  try {
    await service.sendPasswordReset('parent@example.test')
    await service.completeCallback('https://app.example.test/reset-password?code=synthetic-code')
    assert.ok(events.includes('PASSWORD_RECOVERY'))
    assert.equal((await service.getSession()).user.id, user.id)
    await service.updatePassword('new-strong-password')
    assert.ok(events.includes('USER_UPDATED'))
    stop()
    // A fresh SDK instance reading the same storage simulates a page refresh.
    const restored = createAuthService(createClient('https://project.example.test','sb_publishable_synthetic',options), () => 'https://app.example.test')
    assert.equal((await restored.getSession()).user.id, user.id)
    await restored.signOut()
    assert.equal(await restored.getSession(), null)
    assert.ok(requests.some(request => request.path.endsWith('/user') && request.method === 'PUT'))
  } finally { stop(); await client.auth.stopAutoRefresh() }
})
