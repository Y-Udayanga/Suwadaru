import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthCard } from './components/AuthCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from './useAuth'
import { useLanguage } from '@/hooks/useLanguage'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguage()
  const isSi = language === 'si'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await login(String(form.get('email')), String(form.get('password')))
      const from = (location.state as { from?: string } | null)?.from
      void navigate(from?.startsWith('/') && !from.startsWith('//') ? from : '/dashboard', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : isSi ? 'ඇතුල් වීම අසාර්ථක විය.' : 'Sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title={isSi ? 'නැවත ඔබව සාදරයෙන් පිළිගනිමු' : 'Welcome back'}
      description={isSi ? 'ඔබගේ සත්කාරක ගිණුමට ඇතුල් වන්න.' : 'Sign in to your caregiver account.'}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs sm:text-sm font-medium text-foreground space-y-1.5">
          <span>{isSi ? 'විද්‍යුත් තැපෑල (Email)' : 'Email'}</span>
          <Input name="email" type="email" autoComplete="email" required placeholder="name@example.com" />
        </label>
        <label className="block text-xs sm:text-sm font-medium text-foreground space-y-1.5">
          <span>{isSi ? 'මුරපදය (Password)' : 'Password'}</span>
          <Input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        </label>
        {error && <p role="alert" className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">{error}</p>}
        <Button disabled={busy} type="submit" className="w-full btn-premium">
          {busy ? (isSi ? 'ඇතුල් වෙමින්…' : 'Signing in…') : isSi ? 'ඇතුල් වන්න' : 'Sign in'}
        </Button>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <Link to="/register" className="hover:text-primary transition-colors underline">
            {isSi ? 'නව ගිණුමක් සාදන්න' : 'Create an account'}
          </Link>
          <Link to="/forgot-password" className="hover:text-primary transition-colors">
            {isSi ? 'මුරපදය අමතකද?' : 'Forgot password?'}
          </Link>
        </div>
      </form>
    </AuthCard>
  )
}

