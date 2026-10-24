import type { AuthService } from "./contracts/auth-service"
import { AppError } from "./contracts/errors"
import type { DemoSession, DemoSignInInput } from "@/types"
import { fixtureIds } from "../data/mock/children"

/**
 * Storage key used to persist generic demo session flags across browser reloads.
 * SECURITY: NEVER store passwords, email addresses, tokens, or medical records here.
 */
const DEMO_STORAGE_KEY = "suwadaru_demo_session"

export class MockAuthService implements AuthService {
  /**
   * Simulates a demo sign-in with fictional identity.
   * Conforms to AuthService. No external API or real identity provider is called.
   */
  async demoSignIn(input: DemoSignInInput): Promise<DemoSession> {
    // Simulate brief network latency for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 300))

    const displayName = input.displayName.trim()
    if (!displayName) {
      throw new AppError("validation", "Display name is required to start a demo session.")
    }

    const session: DemoSession = {
      caregiverId: fixtureIds.caregiver,
      displayName,
      isDemo: true,
    }

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          DEMO_STORAGE_KEY,
          JSON.stringify({
            isDemo: true,
            caregiverId: session.caregiverId,
            displayName: session.displayName,
          }),
        )
      }
    } catch {
      // LocalStorage access might fail in certain private browsing modes; fail gracefully
    }

    return session
  }

  /**
   * Clears the demo session.
   */
  async demoSignOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 150))

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(DEMO_STORAGE_KEY)
      }
    } catch {
      // Ignore storage access error
    }
  }

  /**
   * Resolves the current demo session from memory/storage, or null if unauthenticated.
   */
  async getSession(): Promise<DemoSession | null> {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
        if (!raw) return null

        const parsed = JSON.parse(raw) as Partial<DemoSession> | null
        if (
          parsed &&
          parsed.isDemo === true &&
          typeof parsed.displayName === "string" &&
          parsed.displayName.trim().length > 0
        ) {
          return {
            caregiverId: parsed.caregiverId || fixtureIds.caregiver,
            displayName: parsed.displayName,
            isDemo: true,
          }
        }
      }
    } catch {
      // Parse error or access issue; clear invalid storage
      try {
        window.localStorage.removeItem(DEMO_STORAGE_KEY)
      } catch {
        // Ignore
      }
    }

    return null
  }
}

/**
 * Singleton mock auth service instance conforming to AuthService contract.
 */
export const mockAuthService = new MockAuthService()
