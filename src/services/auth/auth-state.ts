import type { Session, User } from '@supabase/supabase-js'
import { toAuthError } from './auth-service'
import type { AuthServiceError, ConnectedAuthService } from './auth-service'

export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  session: Session | null
  user: User | null
  error: AuthServiceError | null
}
export const initialAuthState: AuthState = { status: 'loading', session: null, user: null, error: null }

// Subscribe before restoration; stale restoration cannot undo a newer logout/login.
// Keep the SDK listener synchronous to avoid its auth lock deadlock.
export function observeAuth(service: ConnectedAuthService, publish: (state: AuthState) => void) {
  let active = true
  let revision = 0
  const emit = (session: Session | null, error: AuthServiceError | null = null) => {
    if (active) publish({ status: session ? 'authenticated' : 'unauthenticated', session, user: session?.user ?? null, error })
  }
  const unsubscribe = service.onAuthStateChange((_event, session) => {
    revision++
    emit(session)
  })
  const start = revision
  void service.getSession().then(
    session => { if (revision === start) emit(session) },
    error => { if (revision === start) emit(null, toAuthError(error)) },
  )
  return () => { active = false; unsubscribe() }
}
