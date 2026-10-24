import { AppError, type AppErrorCode } from "@/services/contracts"
import type { HealthViolationCode } from "@/domain/health/vaccination"

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function assertUuid(value: string, label: string): void {
  if (!value || value.trim() === "") {
    throw new AppError("validation", `${label} is required.`)
  }
  if (!UUID.test(value)) {
    throw new AppError("validation", `${label} must be a UUID.`)
  }
}

export function throwHealthResult(code: HealthViolationCode, message: string): never {
  throw new AppError(toAppCode(code), message)
}

export function throwSupabaseError(error: { code?: string; message: string }): never {
  const code = error.code ?? ""
  const message = error.message ?? ""
  if (
    code === "PGRST301" ||
    code === "401" ||
    /jwt/i.test(message)
  ) {
    throw new AppError("unauthenticated", "Authentication required.")
  }
  if (code === "23505") {
    throw new AppError(
      "validation",
      "A record for this vaccine already exists for the child.",
    )
  }
  if (code === "23514" || code === "22007" || code === "22P02") {
    throw new AppError("validation", "The health record did not meet the saved checks.")
  }
  if (
    code === "23503" ||
    code === "42501" ||
    code === "PGRST116" ||
    /row-level security/i.test(message)
  ) {
    throw new AppError("not_found", "The child or record was not found.")
  }
  throw new AppError("unavailable", "The health service could not complete the request.")
}

function toAppCode(code: HealthViolationCode): AppErrorCode {
  if (
    code === "unauthenticated" ||
    code === "not_found" ||
    code === "validation" ||
    code === "unavailable"
  ) {
    return code
  }
  return "validation"
}
