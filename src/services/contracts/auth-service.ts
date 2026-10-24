import type { DemoSession, DemoSignInInput } from "@/types"

/**
 * Demo session boundary. Implementations must not call a real identity provider.
 * Throw AppError for expected failures.
 */
export interface AuthService {
  demoSignIn(input: DemoSignInInput): Promise<DemoSession>
  demoSignOut(): Promise<void>
  /** Resolves `null` when no demo session is active. */
  getSession(): Promise<DemoSession | null>
}
