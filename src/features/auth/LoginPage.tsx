import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthCard } from './components/AuthCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from './useAuth'
export function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation()
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); setBusy(true); setError('')
    try { await login(String(form.get('email')), String(form.get('password')))
      const from = (location.state as {from?: string} | null)?.from
      void navigate(from?.startsWith('/') && !from.startsWith('//') ? from : '/dashboard', {replace:true})
    } catch (e) { setError(e instanceof Error ? e.message : 'Sign in failed.') } finally { setBusy(false) }
  }
  return <AuthCard title="Welcome back" description="Sign in to your caregiver account."><form onSubmit={submit} className="space-y-4">
    <label className="block">Email<Input name="email" type="email" autoComplete="email" required /></label>
    <label className="block">Password<Input name="password" type="password" autoComplete="current-password" required /></label>
    {error && <p role="alert">{error}</p>}<Button disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</Button>
    <div className="flex justify-between text-sm"><Link to="/register">Create an account</Link><Link to="/forgot-password">Forgot password?</Link></div>
  </form></AuthCard>
}
