/**
 * Pure calendar-aware date utilities for child immunization timelines.
 *
 * Implements BR-01:
 *   - Birthdate may not be in the future.
 *   - Age milestones use calendar-month arithmetic with an explicit end-of-month
 *     clamping rule, NOT a constant 30-day multiplier.
 *   - Correctly handles leap years (e.g. Feb 29) and varying month lengths
 *     (28, 29, 30, 31 days).
 */

/** Check if a year is a leap year in the Gregorian calendar. */
export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true
  if (year % 100 === 0) return false
  return year % 4 === 0
}

/** Get the number of days in a given calendar month (1-indexed month: 1 = Jan, 12 = Dec). */
export function daysInMonth(year: number, month1Indexed: number): number {
  if (month1Indexed < 1 || month1Indexed > 12) {
    throw new RangeError(`Month must be between 1 and 12, received ${month1Indexed}`)
  }
  // Month 2 (February)
  if (month1Indexed === 2) {
    return isLeapYear(year) ? 29 : 28
  }
  // Months with 30 days: April (4), June (6), September (9), November (11)
  if (month1Indexed === 4 || month1Indexed === 6 || month1Indexed === 9 || month1Indexed === 11) {
    return 30
  }
  // All other months have 31 days
  return 31
}

/**
 * Add a given number of calendar months to an ISO date string (YYYY-MM-DD).
 *
 * End-of-month rule (BR-01, T-06):
 * If the original date's day of month exceeds the maximum days in the target
 * month, clamp the day to the last day of the target month.
 *
 * Examples:
 *   - 2025-01-31 + 1 month  -> 2025-02-28
 *   - 2024-01-31 + 1 month  -> 2024-02-29 (2024 is a leap year)
 *   - 2024-02-29 + 12 months -> 2025-02-28
 *   - 2024-02-29 + 48 months -> 2028-02-29
 *   - 2025-03-31 + 1 month  -> 2025-04-30
 *   - 2025-08-31 + 1 month  -> 2025-09-30
 */
export function addCalendarMonths(isoDate: string, months: number): string {
  const parts = isoDate.split("-").map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid ISO date string: "${isoDate}"`)
  }
  const [year, month, day] = parts

  // Total months from year 0
  const totalMonths = year * 12 + (month - 1) + months
  const targetYear = Math.floor(totalMonths / 12)
  const targetMonth = (totalMonths % 12) + 1

  const maxDayInTargetMonth = daysInMonth(targetYear, targetMonth)
  const targetDay = Math.min(day, maxDayInTargetMonth)

  const yStr = String(targetYear).padStart(4, "0")
  const mStr = String(targetMonth).padStart(2, "0")
  const dStr = String(targetDay).padStart(2, "0")
  return `${yStr}-${mStr}-${dStr}`
}

/** Check if an ISO date string is in the future compared to reference date (default: today). */
export function isFutureDate(
  isoDate: string,
  referenceDate: string = new Date().toISOString().slice(0, 10),
): boolean {
  return isoDate > referenceDate
}

/** Calculate the calendar day difference between two ISO dates (to - from). */
export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  const fromMs = Date.parse(`${fromIsoDate}T00:00:00Z`)
  const toMs = Date.parse(`${toIsoDate}T00:00:00Z`)
  if (isNaN(fromMs) || isNaN(toMs)) {
    throw new Error(`Invalid date comparison between "${fromIsoDate}" and "${toIsoDate}"`)
  }
  return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24))
}

/** Format an ISO date (YYYY-MM-DD) into human-readable text (e.g., "15 Apr 2025"). */
export function formatCalendarDate(isoDate: string): string {
  if (!isoDate) return "—"
  const parts = isoDate.split("-").map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate
  const [y, m, d] = parts
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]
  const monthName = months[m - 1] ?? ""
  return `${d} ${monthName} ${y}`
}
