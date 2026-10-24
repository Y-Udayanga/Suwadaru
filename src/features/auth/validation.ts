/**
 * Pure validation functions for demo authentication flows.
 * Provides clear, friendly, and accessible error messages.
 */

const EMAIL_REGEX =
  /^[a-zA-Z0-9]+(?:[._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/

/**
 * Validates an email address.
 * In demo mode, email is used for illustrative purposes only.
 */
export function validateEmail(email: string, required = true): string | null {
  const trimmed = email.trim()
  if (!trimmed) {
    return required ? "Email address is required." : null
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address (e.g., parent@example.com)."
  }
  return null
}

/**
 * Validates a password input.
 * Enforces minimum length for good UI practice even in demo mode.
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required."
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters."
  }
  return null
}

/**
 * Validates that confirm password matches the primary password.
 */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) {
    return "Please confirm your password."
  }
  if (password !== confirmPassword) {
    return "Passwords do not match."
  }
  return null
}

/**
 * Validates a display name (caregiver name).
 */
export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return "Caregiver name is required."
  }
  if (trimmed.length < 2) {
    return "Caregiver name must be at least 2 characters."
  }
  return null
}

/**
 * Validates identifier (email or username) for login.
 */
export function validateIdentifier(identifier: string): string | null {
  const trimmed = identifier.trim()
  if (!trimmed) {
    return "Please enter your email or demo username."
  }
  // If user entered something that looks like an attempt at an email (contains @), check format
  if (trimmed.includes("@") && !EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address."
  }
  return null
}

export interface LoginFormErrors {
  identifier?: string
  password?: string
  form?: string
}

export interface RegisterFormErrors {
  displayName?: string
  email?: string
  password?: string
  confirmPassword?: string
  form?: string
}

export interface ForgotPasswordFormErrors {
  email?: string
  form?: string
}
