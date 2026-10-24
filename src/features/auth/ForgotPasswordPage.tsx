import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { authService } from '@/services/auth'
import { AuthCard } from './components/AuthCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/useLanguage'

export function ForgotPasswordPage() {
  const { language } = useLanguage()
  const isSi = language === 'si'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await authService.sendPasswordReset(String(f.get('email')))
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : isSi ? 'ඉල්ලීම අසාර්ථක විය.' : 'Request failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title={isSi ? 'මුරපදය ප්‍රතිසාධනය කරන්න' : 'Reset password'}
      description={isSi ? 'ඔබගේ මුරපදය නැවත සකස් කිරීමට සබැඳියක් ඉල්ලන්න.' : 'Request a link to reset your password.'}
    >
      {sent ? (
        <div className="space-y-3 text-center py-4">
          <p role="status" className="text-sm text-foreground">
            {isSi
              ? 'එම ලිපිනය සඳහා ගිණුමක් තිබේ නම්, මුරපදය ප්‍රතිසාධනය කිරීමේ සබැඳිය සඳහා ඔබේ ඊමේල් පරීක්ෂා කරන්න.'
              : 'If an account exists for that address, check your email for the reset link.'}
          </p>
          <Link to="/login" className="inline-block text-sm font-semibold text-primary underline">
            {isSi ? 'නැවත ඇතුල් වීමට යන්න' : 'Back to sign in'}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs sm:text-sm font-medium text-foreground space-y-1.5">
            <span>{isSi ? 'විද්‍යුත් තැපෑල (Email)' : 'Email'}</span>
            <Input name="email" type="email" autoComplete="email" required placeholder="name@example.com" />
          </label>
          {error && <p role="alert" className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full btn-premium">
            {busy ? (isSi ? 'යවමින්…' : 'Sending…') : isSi ? 'ප්‍රතිසාධන සබැඳිය යවන්න' : 'Send reset link'}
          </Button>
          <p className="text-center text-xs text-muted-foreground pt-2">
            <Link to="/login" className="hover:text-primary transition-colors underline">
              {isSi ? 'නැවත ඇතුල් වීමට යන්න' : 'Back to sign in'}
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  )
}

