/**
 * Expected-failure result for pure health calculations.
 * Service adapters map this to AppError at the UI boundary.
 * A thrown exception is a programming fault, not a validation result.
 */

export type HealthViolationCode =
  | "validation"
  | "not_found"
  | "unauthenticated"
  | "forbidden"
  | "unavailable"

export interface HealthRuleViolation {
  /** Stable code. Callers branch on this, not on `message`. */
  code: HealthViolationCode
  message: string
}

export type HealthResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: HealthRuleViolation }

export function ok<T>(value: T): HealthResult<T> {
  return { ok: true, value }
}

export function fail<T = never>(
  code: HealthViolationCode,
  message: string,
): HealthResult<T> {
  return { ok: false, error: { code, message } }
}
