import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthCard } from './components/AuthCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from './useAuth'
export function RegisterPage() {
  const { register } = useAuth(); const navigate = useNavigate()
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [pending, setPending] = useState(false)
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); setError('')
    try {
      if (f.get('password') !== f.get('confirm')) throw new Error('Passwords must match.')
      const result = await register(String(f.get('name')), String(f.get('email')), String(f.get('password')))
      if (result.status === 'verification_pending') setPending(true); else void navigate('/dashboard')
    } catch (e) { setError(e instanceof Error ? e.message : 'Registration failed.') } finally { setBusy(false) }
  }
  return <AuthCard title="Create your account" description="Keep your child’s records in one place.">{pending ? <p role="status">Check your email for a confirmation link, then sign in. <Link to="/login">Go to sign in</Link></p> : <form onSubmit={submit} className="space-y-4">
    <label className="block">Full name<Input name="name" autoComplete="name" maxLength={200} required /></label>
    <label className="block">Email<Input name="email" type="email" autoComplete="email" required /></label>
    <label className="block">Password<Input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    <label className="block">Confirm password<Input name="confirm" type="password" autoComplete="new-password" minLength={8} required /></label>
    {error && <p role="alert">{error}</p>}<Button disabled={busy} type="submit">{busy ? 'Creating account…' : 'Create account'}</Button>
    <p><Link to="/login">Already registered? Sign in</Link></p>
  </form>}</AuthCard>
}
