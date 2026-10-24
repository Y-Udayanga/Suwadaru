import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { mockAuthService } from "@/services/mock-auth-service"
import type { DemoSession } from "@/types"

export interface AuthContextValue {
  /** The current active demo session or null if unauthenticated */
  session: DemoSession | null
  /** Whether a valid demo session exists */
  isAuthenticated: boolean
  /** Whether the initial session check or async operation is resolving */
  isLoading: boolean
  /** Sign in to the fictional demo account */
  login: (displayName?: string) => Promise<DemoSession>
  /** Register a fictional demo caregiver account */
  register: (displayName: string) => Promise<DemoSession>
  /** Sign out and clear active demo session */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Rehydrate demo session from storage on initial mount
  useEffect(() => {
    let mounted = true
    void mockAuthService
      .getSession()
      .then((existingSession) => {
        if (mounted) {
          setSession(existingSession)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(null)
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (displayName?: string): Promise<DemoSession> => {
    setIsLoading(true)
    try {
      const newSession = await mockAuthService.demoSignIn({
        displayName: displayName || "Demo Parent",
      })
      setSession(newSession)
      return newSession
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (displayName: string): Promise<DemoSession> => {
    setIsLoading(true)
    try {
      const newSession = await mockAuthService.demoSignIn({
        displayName: displayName.trim() || "Demo Parent",
      })
      setSession(newSession)
      return newSession
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      await mockAuthService.demoSignOut()
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value: AuthContextValue = {
    session,
    isAuthenticated: session !== null,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }

