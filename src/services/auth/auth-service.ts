import type { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js'

export type AuthErrorCode = 'validation' | 'invalid_credentials' | 'email_unconfirmed'
  | 'rate_limited' | 'invalid_link' | 'unauthenticated' | 'unavailable'

export class AuthServiceError extends Error {
  readonly code: AuthErrorCode
  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.name = 'AuthServiceError'
    this.code = code
  }
}

export function toAuthError(error: unknown): AuthServiceError {
  if (error instanceof AuthServiceError) return error
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null
  if (code === 'invalid_credentials') return new AuthServiceError('invalid_credentials', 'Email or password is incorrect.')
  if (code === 'email_not_confirmed') return new AuthServiceError('email_unconfirmed', 'Confirm your email before signing in. Check your inbox and spam folder.')
  if (code === 'session_not_found' || code === 'refresh_token_not_found' || code === 'refresh_token_already_used' || code === 'bad_jwt')
    return new AuthServiceError('unauthenticated', 'Your session has expired. Sign in or request a new reset link.')
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit')
    return new AuthServiceError('rate_limited', 'Too many attempts. Please wait a few minutes and try again.')
  if (code === 'weak_password' || code === 'same_password')
    return new AuthServiceError('validation', 'Choose a stronger password that differs from your previous password.')
  return new AuthServiceError('unavailable', 'Authentication is unavailable. Please try again. If this continues, contact support.')
}

export interface SignUpInput { email: string; password: string; fullName: string }
export interface SignInInput { email: string; password: string }
export type SignUpResult =
  | { status: 'verification_pending'; session: null }
  | { status: 'authenticated'; session: Session }

export interface ConnectedAuthService {
  signUp(input: SignUpInput): Promise<SignUpResult>
  signIn(input: SignInInput): Promise<Session>
  signOut(): Promise<void>
  sendPasswordReset(email: string): Promise<void>
  updatePassword(password: string): Promise<User>
  getCurrentUser(): Promise<User | null>
  getSession(): Promise<Session | null>
  onAuthStateChange(listener: (event: AuthChangeEvent, session: Session | null) => void): () => void
  completeCallback(url: string): Promise<Session>
}

function emailValue(email: string) {
  const value = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    throw new AuthServiceError('validation', 'Enter a valid email address.')
  return value
}
function passwordValue(password: string) {
  if (password.length < 8) throw new AuthServiceError('validation', 'Use at least 8 characters for your password.')
  return password // Never trim or otherwise transform passwords.
}

export function createAuthService(client: SupabaseClient | null, getOrigin: () => string): ConnectedAuthService {
  function auth() {
    if (!client) throw new AuthServiceError('unavailable', 'Account access is not configured. Please contact support.')
    return client.auth
  }
  async function run<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation() } catch (error) { throw toAuthError(error) }
  }
  // Share only an in-flight exchange for StrictMode. Consumed links must be
  // checked again by Auth rather than reusing an old authenticated session.
  let callback: { url: string; promise: Promise<Session> } | undefined
  const service: ConnectedAuthService = {
    signUp: input => run(async () => {
      const fullName = input.fullName.trim()
      if (!fullName || fullName.length > 200 || [...fullName].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))
        throw new AuthServiceError('validation', 'Enter your full name using 1–200 characters.')
      const { data, error } = await auth().signUp({
        email: emailValue(input.email), password: passwordValue(input.password),
        options: { data: { full_name: fullName }, emailRedirectTo: `${getOrigin()}/auth/callback` },
      })
      if (error) throw error
      // No browser profile INSERT: the database trigger commits it with auth.users.
      return data.session ? { status: 'authenticated', session: data.session }
        : { status: 'verification_pending', session: null }
    }),
    signIn: input => run(async () => {
      if (!input.password) throw new AuthServiceError('validation', 'Enter your password.')
      const { data, error } = await auth().signInWithPassword({ email: emailValue(input.email), password: input.password })
      if (error) throw error
      return data.session
    }),
    signOut: () => run(async () => {
      const { error } = await auth().signOut({ scope: 'local' })
      if (error) throw error
    }),
    sendPasswordReset: email => run(async () => {
      const { error } = await auth().resetPasswordForEmail(emailValue(email), { redirectTo: `${getOrigin()}/reset-password` })
      if (error) throw error
    }),
    updatePassword: password => run(async () => {
      passwordValue(password)
      if (!await service.getCurrentUser())
        throw new AuthServiceError('unauthenticated', 'Your session has expired. Sign in or request a new reset link.')
      const { data, error } = await auth().updateUser({ password })
      if (error) throw error
      return data.user
    }),
    getCurrentUser: () => run(async () => {
      if (!await service.getSession()) return null
      const { data, error } = await auth().getUser()
      if (error) throw error
      return data.user
    }),
    getSession: () => run(async () => {
      if (!client) return null
      const { data, error } = await auth().getSession()
      if (error) throw error
      return data.session
    }),
    onAuthStateChange: listener => {
      if (!client) return () => {}
      const { data } = auth().onAuthStateChange(listener)
      return () => data.subscription.unsubscribe()
    },
    completeCallback: url => {
      if (callback?.url === url) return callback.promise
      const promise = run(async () => {
        const parsed = new URL(url)
        const hash = new URLSearchParams(parsed.hash.slice(1))
        const code = parsed.searchParams.get('code')
        if (parsed.searchParams.has('error') || hash.has('error') || !code)
          throw new AuthServiceError('invalid_link', 'This link is invalid or expired. Request a new email and open it in the browser where you requested it.')
        const { data, error } = await auth().exchangeCodeForSession(code)
        if (error || !data.session)
          throw new AuthServiceError('invalid_link', 'This link is invalid or expired. Request a new email and open it in the browser where you requested it.')
        return data.session
      })
      callback = { url, promise }
      void promise.then(
        () => { if (callback?.promise === promise) callback = undefined },
        () => { if (callback?.promise === promise) callback = undefined },
      )
      return promise
    },
  }
  return service
}
