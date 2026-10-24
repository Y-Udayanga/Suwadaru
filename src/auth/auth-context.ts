import { createContext } from 'react'
import type { ConnectedAuthService } from '../services/auth/auth-service'
import type { AuthState } from '../services/auth/auth-state'

export type AuthContextValue = AuthState & { loading: boolean; isAuthenticated: boolean; service: ConnectedAuthService }
export const AuthContext = createContext<AuthContextValue | null>(null)
