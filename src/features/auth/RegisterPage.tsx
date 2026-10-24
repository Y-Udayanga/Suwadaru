import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthCard } from './components/AuthCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from './useAuth'
import { useLanguage } from '@/hooks/useLanguage'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const isSi = language === 'si'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      if (f.get('password') !== f.get('confirm')) {
        throw new Error(isSi ? 'මුරපද දෙක එකිනෙකට ගැළපිය යුතුය.' : 'Passwords must match.')
      }
      const result = await register(String(f.get('name')), String(f.get('email')), String(f.get('password')))
      if (result.status === 'verification_pending') setPending(true)
      else void navigate('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : isSi ? 'ලියාපදිංචිය අසාර්ථක විය.' : 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title={isSi ? 'ඔබගේ ගිණුම සාදන්න' : 'Create your account'}
      description={isSi ? 'ඔබගේ දරුවාගේ සෞඛ්‍ය වාර්තා එකම තැනක සුරක්ෂිතව තබා ගන්න.' : 'Keep your child’s records in one place.'}
    >
      {pending ? (
        <div className="space-y-3 text-center py-4">
          <p role="status" className="text-sm text-foreground">
            {isSi
              ? 'තහවුරු කිරීමේ සබැඳිය සඳහා ඔබේ ඊමේල් පරීක්ෂා කර පසුව ඇතුල් වන්න.'
              : 'Check your email for a confirmation link, then sign in.'}
          </p>
          <Link to="/login" className="inline-block text-sm font-semibold text-primary underline">
            {isSi ? 'ඇතුල් වීමට යන්න' : 'Go to sign in'}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs sm:text-sm font-medium text-foreground space-y-1.5">
            <span>{isSi ? 'සම්පූර්ණ නම' : 'Full name'}</span>
            <Input name="name" autoComplete="name" maxLength={200} required placeholder={isSi ? 'ඔබේ නම' : 'Your name'} />
          </label>
          <label className="block text-xs sm:text-sm font-medium text-foreground space-y-1.5">
            <span>{isSi ? 'විද්‍යුත් තැපෑල (Email)' : 'Email'}</span>
            <Input name="email" type="email" autoComplete="email" required placeholder="name@example.com" />
          </label>
          <label className="block text-xs sm:text-sm font-medium text-foreground space-y-1.5">
            <span>{isSi ? 'මුරපදය (අවම අකුරු 8ක්)' : 'Password (min. 8 characters)'}</span>
            <Input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="••••••••" />
          </label>
          <label className="block text-xs sm:text-sm font-medium text-foreground space-y-1.5">
            <span>{isSi ? 'මුරපදය තහවුරු කරන්න' : 'Confirm password'}</span>
            <Input name="confirm" type="password" autoComplete="new-password" minLength={8} required placeholder="••••••••" />
          </label>
          {error && <p role="alert" className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">{error}</p>}
          <Button disabled={busy} type="submit" className="w-full btn-premium">
            {busy ? (isSi ? 'ගිණුම නිර්මාණය වෙමින්…' : 'Creating account…') : isSi ? 'ගිණුම සාදන්න' : 'Create account'}
          </Button>
          <p className="text-center text-xs text-muted-foreground pt-2">
            <Link to="/login" className="hover:text-primary transition-colors underline">
              {isSi ? 'දැනටමත් ගිණුමක් තිබේද? ඇතුල් වන්න' : 'Already registered? Sign in'}
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  )
}

