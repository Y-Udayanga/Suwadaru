// Read-only heuristic scan. Report locations/categories, never matched values.
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
const root = process.cwd().replaceAll('\\','/')
const git = (...args) => execFileSync('git', ['-c',`safe.directory=${root}`,...args], {encoding:'utf8',maxBuffer:32*1024*1024})
const findings = []
const objects = git('rev-list','--objects','--all').trim().split('\n')
let blobs = 0
for (const item of objects) {
  const [oid,...path] = item.split(' ')
  if (git('cat-file','-t',oid).trim() !== 'blob') continue
  blobs++
  const source = git('cat-file','-p',oid)
  const patterns = {
    secret_key:/sb_secret_[A-Za-z0-9_-]{20,}/,
    private_key:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    provider_key:/AIza[0-9A-Za-z_-]{35}/,
    github_token:/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/,
    database_password:/postgres(?:ql)?:\/\/[^\s:/]+:[^\s@<>]+@/,
  }
  for (const [category, pattern] of Object.entries(patterns)) {
    if (pattern.test(source)) findings.push({oid,path:path.join(' '),category})
  }
  for (const token of source.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try {
      const payload = JSON.parse(Buffer.from(token[0].split('.')[1],'base64url').toString())
      if (payload.role === 'service_role') findings.push({oid,path:path.join(' '),category:'service_role_jwt'})
    } catch { /* Not a JWT. */ }
  }
}
const trackedEnv = git('ls-files').split('\n').filter(path => /(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('.example'))
const envChecks = {}
if (existsSync('.env')) {
  const entries = Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => {
    const index = line.indexOf('='); return [line.slice(0,index),line.slice(index+1).trim()]
  }))
  envChecks.urlConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(entries.VITE_SUPABASE_URL ?? '')
  envChecks.publishableKeyConfigured = (entries.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').startsWith('sb_publishable_')
}
console.log(JSON.stringify({scope:'all blobs reachable from local refs; heuristic, not a guarantee',blobs,findings,trackedEnv,envChecks},null,2))
if (findings.length || trackedEnv.length) process.exitCode = 1
