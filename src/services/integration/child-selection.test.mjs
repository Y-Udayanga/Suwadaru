import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, {
  compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext},
}).outputText).toString('base64')
const errors = moduleUrl(await readFile(new URL('../contracts/errors.ts',import.meta.url),'utf8'))
const { AppError } = await import(errors)
const source = (await readFile(new URL('./child-selection.ts',import.meta.url),'utf8')).replace("'../contracts/errors'",JSON.stringify(errors))
const { createChildSelection } = await import(moduleUrl(source))
const a = {id:'11111111-1111-4111-8111-111111111111',name:'Fictional Child A',dateOfBirth:'2024-02-29',sex:'female'}
const b = {...a,id:'22222222-2222-4222-8222-222222222222',name:'Fictional Child B'}
const tick = () => new Promise(resolve => setImmediate(resolve))
function deferred() { let resolve; let reject; const promise = new Promise((yes,no) => {resolve=yes;reject=no});return {promise,resolve,reject} }
const service = (overrides={}) => ({getMyChildren:async () => [a,b],createChild:async () => b,...overrides})

test('load, select multiple children, preserve selection after refresh, reject arbitrary IDs',async () => {
  const store = createChildSelection(service(),'fictional-parent')
  store.start(); await tick()
  assert.equal(store.getSnapshot().selectedChildId,a.id)
  store.selectChild(b.id)
  await store.refresh()
  assert.equal(store.getSnapshot().selectedChildId,b.id)
  assert.throws(() => store.selectChild('unknown'),error => error.code === 'not_found')
  store.stop()
})
test('successful creation appears immediately and becomes the selected child',async () => {
  const store = createChildSelection(service({getMyChildren:async () => [a]}),'fictional-parent')
  store.start(); await tick()
  assert.equal(await store.createChild(b),b)
  assert.deepEqual(store.getSnapshot().children,[a,b])
  assert.equal(store.getSnapshot().selectedChildId,b.id)
  assert.equal(store.getSnapshot().saving,false)
  store.stop()
})
test('unauthenticated store never fetches or creates; account switch starts empty',async () => {
  let calls = 0
  const api = service({getMyChildren:async () => {calls++;return [a]}})
  const store = createChildSelection(api,null)
  store.start(); await tick()
  assert.equal(calls,0)
  await assert.rejects(store.createChild(a),error => error.code === 'unauthenticated')
  const next = createChildSelection(api,'another-parent')
  assert.deepEqual(next.getSnapshot().children,[])
  assert.equal(next.getSnapshot().selectedChildId,null)
})
test('logout clears child state and prevents late list responses from restoring it',async () => {
  const request = deferred()
  const store = createChildSelection(service({getMyChildren:() => request.promise}),'fictional-parent')
  store.start(); store.stop(); request.resolve([a]); await tick()
  assert.deepEqual(store.getSnapshot().children,[])
  assert.equal(store.getSnapshot().selectedChildId,null)
  // StrictMode effect teardown/start must remain usable.
  store.start(); await tick()
  assert.equal(store.getSnapshot().children.length,1)
  store.stop()
})
test('late create cannot publish or signal navigation success after account change',async () => {
  const request = deferred()
  const store = createChildSelection(service({createChild:() => request.promise}),'fictional-parent')
  store.start(); await tick()
  const pending = store.createChild(b)
  store.stop(); request.resolve(b)
  await assert.rejects(pending,error => error.code === 'unauthenticated')
  assert.deepEqual(store.getSnapshot().children,[])
})
test('duplicate create is blocked and an older list cannot overwrite the returned child',async () => {
  const list = deferred(); const create = deferred()
  const store = createChildSelection(service({getMyChildren:() => list.promise,createChild:() => create.promise}),'fictional-parent')
  store.start()
  const pending = store.createChild(b)
  await assert.rejects(store.createChild(b),error => error.code === 'validation')
  create.resolve(b); await pending
  list.resolve([a]); await tick()
  assert.deepEqual(store.getSnapshot().children,[b])
  store.stop()
})
test('list failure clears stale child data and exposes safe errors; creation preserves safe validation',async () => {
  let fail = false
  const store = createChildSelection(service({getMyChildren:async () => {if(fail) throw new Error('secret server details');return [a]},createChild:async () => {throw new AppError('validation','Check the child name.')}}),'fictional-parent')
  store.start(); await tick()
  await assert.rejects(store.createChild(b),error => error.message === 'Check the child name.')
  assert.deepEqual(store.getSnapshot().children,[a])
  fail=true
  await assert.rejects(store.refresh(),error => error.code === 'unavailable' && !error.message.includes('secret'))
  assert.deepEqual(store.getSnapshot().children,[])
  store.stop()
})
test('creation failure during initial list load does not leave a perpetual loading state',async () => {
  const list = deferred()
  const store = createChildSelection(service({getMyChildren:() => list.promise,createChild:async () => {throw new AppError('validation','Check the child name.')}}),'fictional-parent')
  store.start()
  await assert.rejects(store.createChild(b),error => error.code === 'validation')
  assert.equal(store.getSnapshot().status,'error')
  assert.equal(store.getSnapshot().saving,false)
  list.resolve([a]);await tick()
  assert.equal(store.getSnapshot().status,'error')
  store.stop()
})
