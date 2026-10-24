import test from "node:test"
import assert from "node:assert/strict"

// Mock window and localStorage for Node testing environment
const storage = new Map<string, string>()
;(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => {
      storage.clear()
    },
  },
}

import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateDisplayName,
  validateIdentifier,
} from "../src/features/auth/validation.ts"
import { MockAuthService } from "../src/services/mock-auth-service.ts"
import { AppError } from "../src/services/contracts/errors.ts"

test("Validation: Blank forms and required fields", () => {
  assert.strictEqual(validateEmail(""), "Email address is required.")
  assert.strictEqual(validateEmail("   "), "Email address is required.")
  assert.strictEqual(validatePassword(""), "Password is required.")
  assert.strictEqual(validateDisplayName(""), "Caregiver name is required.")
  assert.strictEqual(validateDisplayName("   "), "Caregiver name is required.")
  assert.strictEqual(
    validateIdentifier(""),
    "Please enter your email or demo username.",
  )
  assert.strictEqual(
    validateConfirmPassword("validPass1", ""),
    "Please confirm your password.",
  )
})

test("Validation: Invalid email formats", () => {
  const invalidEmails = [
    "plainaddress",
    "#@%^%#$@#$@#.com",
    "@example.com",
    "Joe Smith <email@example.com>",
    "email.example.com",
    "email@example@example.com",
    ".email@example.com",
    "email.@example.com",
    "email@example",
  ]

  for (const email of invalidEmails) {
    const error = validateEmail(email)
    assert.ok(
      error !== null,
      `Expected ${email} to fail validation, but passed.`,
    )
    assert.strictEqual(
      error,
      "Please enter a valid email address (e.g., parent@example.com).",
    )
  }

  // Valid emails
  assert.strictEqual(validateEmail("parent@example.com"), null)
  assert.strictEqual(validateEmail("test.caregiver@demo.gov.lk"), null)
})

test("Validation: Mismatched passwords and minimum length", () => {
  // Too short
  assert.strictEqual(
    validatePassword("12345"),
    "Password must be at least 6 characters.",
  )
  assert.strictEqual(validatePassword("abc"), "Password must be at least 6 characters.")

  // Valid password length
  assert.strictEqual(validatePassword("123456"), null)
  assert.strictEqual(validatePassword("securePassword2026"), null)

  // Mismatched
  assert.strictEqual(
    validateConfirmPassword("securePassword", "differentPassword"),
    "Passwords do not match.",
  )

  // Matching
  assert.strictEqual(
    validateConfirmPassword("securePassword", "securePassword"),
    null,
  )
})

test("Validation: Display name length", () => {
  assert.strictEqual(
    validateDisplayName("A"),
    "Caregiver name must be at least 2 characters.",
  )
  assert.strictEqual(validateDisplayName("Priyantha Perera"), null)
})

test("MockAuthService: demoSignIn, getSession, and demoSignOut flow", async () => {
  storage.clear()
  const authService = new MockAuthService()

  // Initially unauthenticated
  const initialSession = await authService.getSession()
  assert.strictEqual(initialSession, null)

  // Rejects blank display name
  await assert.rejects(
    async () => {
      await authService.demoSignIn({ displayName: "" })
    },
    (err: unknown) => {
      return (
        err instanceof AppError &&
        err.code === "validation" &&
        err.message.includes("Display name is required")
      )
    },
  )

  // Successful demo sign in
  const session = await authService.demoSignIn({
    displayName: "Priyantha Perera",
  })
  assert.strictEqual(session.isDemo, true)
  assert.strictEqual(session.displayName, "Priyantha Perera")
  assert.strictEqual(session.caregiverId, "caregiver_demo_parent")

  // Session persisted across reloads
  const retrievedSession = await authService.getSession()
  assert.deepStrictEqual(retrievedSession, session)

  // Security Verification: Ensure NO passwords or emails exist in storage
  const storedJson = storage.get("suwadaru_demo_session")
  assert.ok(storedJson, "Demo session flag should exist in storage")
  const parsed = JSON.parse(storedJson)
  assert.strictEqual(parsed.isDemo, true)
  assert.strictEqual(parsed.displayName, "Priyantha Perera")
  assert.strictEqual(parsed.password, undefined)
  assert.strictEqual(parsed.email, undefined)
  assert.strictEqual(parsed.token, undefined)

  // Sign out clears session
  await authService.demoSignOut()
  const postLogoutSession = await authService.getSession()
  assert.strictEqual(postLogoutSession, null)
  assert.strictEqual(storage.get("suwadaru_demo_session"), undefined)
})
