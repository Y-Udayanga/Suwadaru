import { fail, ok, type HealthResult } from "../result.ts"
import type { IsoDate } from "../../../types/common.ts"

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Gregorian leap year. Century years are leap years only when divisible by 400. */
export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true
  if (year % 100 === 0) return false
  return year % 4 === 0
}

/** Days in a calendar month. `month` is 1 through 12. */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30
  return 31
}

/**
 * Accept only a real `YYYY-MM-DD` calendar date.
 * Lexicographic comparison is safe after this check.
 */
export function validateIsoDate(value: string): HealthResult<IsoDate> {
  if (typeof value !== "string") {
    return fail("validation", "Date must be a YYYY-MM-DD string.")
  }
  const match = ISO_DATE.exec(value)
  if (!match) {
    return fail(
      "validation",
      `Date "${value}" must be a real calendar date in YYYY-MM-DD form.`,
    )
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12) {
    return fail("validation", `Date "${value}" has an invalid month.`)
  }
  const maxDay = daysInMonth(year, month)
  if (day < 1 || day > maxDay) {
    return fail("validation", `Date "${value}" is not a real calendar day.`)
  }
  return ok(value)
}

/**
 * Add completed calendar months. If the day does not exist in the target
 * month, clamp to the last day of that month. This is not a 30-day step.
 */
export function addCalendarMonths(
  isoDate: string,
  months: number,
): HealthResult<IsoDate> {
  const parsed = validateIsoDate(isoDate)
  if (!parsed.ok) return parsed
  if (!Number.isInteger(months) || months < 0) {
    return fail("validation", "Months to add must be a non-negative integer.")
  }

  const [year, month, day] = parsed.value.split("-").map(Number)
  const totalMonths = year * 12 + (month - 1) + months
  const targetYear = Math.floor(totalMonths / 12)
  const targetMonth = (totalMonths % 12) + 1
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth))
  const result = [
    String(targetYear).padStart(4, "0"),
    String(targetMonth).padStart(2, "0"),
    String(targetDay).padStart(2, "0"),
  ].join("-")
  return ok(result)
}

/** Whole calendar days from `fromIsoDate` to `toIsoDate`. Both must already be valid. */
export function daysBetween(fromIsoDate: IsoDate, toIsoDate: IsoDate): number {
  const from = utcDayNumber(fromIsoDate)
  const to = utcDayNumber(toIsoDate)
  return to - from
}

function utcDayNumber(isoDate: IsoDate): number {
  const [year, month, day] = isoDate.split("-").map(Number)
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000)
}

/**
 * Calendar date in Asia/Colombo for an instant.
 * Callers pass this in as `today` so schedule generation stays deterministic.
 */
export function calendarDateInColombo(instant: Date): IsoDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value
  return `${year}-${month}-${day}`
}
