import { useContext } from "react"
import { AuthContext, type AuthContextValue } from "./AuthContext"

/**
 * Hook to access demo authentication state and methods.
 * Must be used within an <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>.")
  }
  return context
}

export type { AuthContextValue }
