import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { authService } from '@/services/auth'
import { AuthCard } from './components/AuthCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
export function ForgotPasswordPage() {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false)
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); setError('')
    try { await authService.sendPasswordReset(String(f.get('email'))); setSent(true) }
    catch(e) { setError(e instanceof Error ? e.message : 'Request failed.') } finally { setBusy(false) }
  }
  return <AuthCard title="Reset password" description="Request a link to reset your password.">{sent ? <p role="status">If an account exists for that address, check your email for the reset link.</p> : <form onSubmit={submit} className="space-y-4"><label>Email<Input name="email" type="email" autoComplete="email" required /></label>{error && <p role="alert">{error}</p>}<Button type="submit" disabled={busy}>Send reset link</Button></form>}<Link to="/login">Back to sign in</Link></AuthCard>
}
