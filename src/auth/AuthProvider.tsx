import { useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../services/auth'
import type { ConnectedAuthService } from '../services/auth'
import { initialAuthState, observeAuth } from '../services/auth/auth-state'
import { AuthContext } from './auth-context'

export function AuthProvider({ children, service = authService }: { children: ReactNode; service?: ConnectedAuthService }) {
  const parent = useContext(AuthContext)
  const [state, setState] = useState(initialAuthState)
  useEffect(() => observeAuth(service, setState), [service])
  const value = useMemo(() => ({ ...state, loading: state.status === 'loading',
    isAuthenticated: state.status === 'authenticated', service }), [state, service])
  if (parent) throw new Error('Use only one AuthProvider in the application.')
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
