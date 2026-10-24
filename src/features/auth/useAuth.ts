import { useAuth as useConnectedAuth } from '@/hooks/useAuth'
export function useAuth() {
  const auth = useConnectedAuth()
  const user = auth.user
  return {
    isLoading: auth.loading, isAuthenticated: auth.isAuthenticated,
    session: user ? { caregiverId: user.id, displayName: user.user_metadata.full_name || user.email || 'Caregiver' } : null,
    login: (email: string, password: string) => auth.service.signIn({ email, password }),
    register: (fullName: string, email: string, password: string) => auth.service.signUp({ fullName, email, password }),
    logout: () => auth.service.signOut(),
  }
}
export type AuthContextValue = ReturnType<typeof useAuth>
