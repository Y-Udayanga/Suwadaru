/**
 * Feature-local child resolver for Frontend B health pages.
 *
 * BOUNDARY: This is a local adapter. It does NOT own or duplicate the
 * authoritative child types or `ChildService` contract from Frontend A.
 *
 * When `childService` from `@/services/contracts` is wired (B1), replace
 * the in-memory lookup here with:
 *   import { childService } from "@/services/mock/childService"
 *   (or wherever A mounts the real adapter)
 *
 * INTEGRATION IMPORTS NEEDED FROM FRONTEND A:
 *   - `childService.get(childId)` — currently simulated here using mock data.
 *   - `Child` type from `@/types` — already re-exported via A's index.
 */

import type { Child } from "@/types"
import { AppError } from "@/services/contracts"
import { getCaregiverChild, isPersistedChildId } from "@/services/health"
import { demoChildren } from "@/data/mock"

const MOCK_DELAY = 300

function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Resolve a child by ID. Throws `AppError("not_found")` for unknown IDs
 * so callers can display a safe empty/404 state (BRD BR-08, T-05).
 */
export async function resolveChild(childId: string): Promise<Child> {
  if (isPersistedChildId(childId)) {
    return getCaregiverChild(childId)
  }
  await delay()
  const child = (demoChildren as readonly Child[]).find((c) => c.id === childId)
  if (!child) {
    throw new AppError(
      "not_found",
      `No child record found for ID "${childId}". Please select a valid child.`,
    )
  }
  return child
}

/**
 * Compute completed calendar months between a date-of-birth and a reference
 * date (default: today). Uses calendar-month arithmetic as required by BR-01.
 */
export function ageInMonths(dateOfBirth: string, referenceDate?: string): number {
  const ref = referenceDate ?? new Date().toISOString().slice(0, 10)
  const [by, bm, bd] = dateOfBirth.split("-").map(Number)
  const [ry, rm, rd] = ref.split("-").map(Number)
  let months = (ry - by) * 12 + (rm - bm)
  if (rd < bd) months -= 1
  return Math.max(0, months)
}

/**
 * Format an age in months to a human-readable string.
 * e.g. 7 → "7 months", 14 → "1 year 2 months", 24 → "2 years"
 */
export function formatAge(months: number): string {
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years} year${years !== 1 ? "s" : ""}`
  return `${years} year${years !== 1 ? "s" : ""} ${rem} month${rem !== 1 ? "s" : ""}`
}
