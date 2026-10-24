import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { toAuthError } from '../services/auth'
import { useAuth } from '../hooks/useAuth'

/** Fixed destinations only; never redirect to an untrusted `next` parameter. */
export function AuthCallbackPage({ resetPassword = false }: { resetPassword?: boolean }) {
  const { service } = useAuth()
  const [callbackUrl] = useState(() => window.location.href)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'complete'>('loading')
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void service.completeCallback(callbackUrl).then(
      () => { if (active) setStatus('ready') },
      error => { if (active) { setMessage(toAuthError(error).message); setStatus('error') } },
    ).finally(() => {
      // Remove the code/error payload from browser history on success AND failure.
      if (active) window.history.replaceState(window.history.state, '', window.location.pathname)
    })
    return () => { active = false }
  }, [service, callbackUrl])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    if (password !== confirmation) { setMessage('Passwords do not match.'); return }
    setSaving(true)
    setMessage('')
    try {
      await service.updatePassword(password)
      setPassword('')
      setConfirmation('')
      setStatus('complete')
    } catch (error) {
      setMessage(toAuthError(error).message)
    } finally { setSaving(false) }
  }

  if (status === 'loading') return <p role="status">Checking your email link…</p>
  if (status === 'error') return <div><p role="alert">{message}</p><Link to="/forgot-password">Request a new reset email</Link><p><Link to="/login">Return to sign in</Link></p></div>
  if (!resetPassword) return <Navigate to="/dashboard" replace />
  if (status === 'complete') return <div><p role="status">Password updated successfully.</p><Link to="/dashboard">Continue to dashboard</Link></div>
  return (
    <form onSubmit={submit} className="mx-auto grid max-w-md gap-4 p-6">
      <h1>Choose a new password</h1>
      <label htmlFor="new-password">New password</label>
      <input id="new-password" type="password" autoComplete="new-password" minLength={8} required
        value={password} onChange={event => setPassword(event.target.value)} disabled={saving} />
      <label htmlFor="confirm-password">Confirm new password</label>
      <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required
        value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={saving} />
      {message ? <p role="alert">{message}</p> : null}
      <button type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button>
    </form>
  )
}
