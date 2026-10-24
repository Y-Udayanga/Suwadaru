import type { ChildSex } from "@/types"

/**
 * Returns today's date formatted as an ISO 8601 date-only string (YYYY-MM-DD)
 * using local calendar components to prevent timezone drift bugs.
 */
export function getTodayIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Validates whether a year is a leap year according to the Gregorian calendar.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Returns the maximum days in a given calendar month and year.
 */
export function getDaysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28
    case 4:
    case 6:
    case 9:
    case 11:
      return 30
    default:
      return 31
  }
}

/**
 * Validates whether a date string is a structurally valid ISO 8601 calendar date.
 * Strictly verifies leap years and month boundaries without Date timezone distortion.
 */
export function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false
  }

  const [yearStr, monthStr, dayStr] = dateStr.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (month < 1 || month > 12) {
    return false
  }

  const maxDays = getDaysInMonth(year, month)
  return day >= 1 && day <= maxDays
}

/**
 * Validates a child's Date of Birth (DOB).
 * Enforces:
 * - Non-empty
 * - Structurally valid calendar date
 * - Not in the future (per FR-026, T-03)
 * - Sensible historical boundary (e.g. child under 18)
 */
export function validateChildDob(dob: string): string | null {
  const trimmed = dob.trim()
  if (!trimmed) {
    return "Date of birth is required."
  }

  if (!isValidIsoDate(trimmed)) {
    return "Please enter a valid calendar date in YYYY-MM-DD format."
  }

  const today = getTodayIsoDate()
  if (trimmed > today) {
    return "Date of birth cannot be in the future."
  }

  const [yearStr] = trimmed.split("-")
  const year = Number(yearStr)
  const currentYear = new Date().getFullYear()
  if (year < currentYear - 18) {
    return "Child date of birth must be within the past 18 years."
  }

  return null
}

/**
 * Validates a child's fictional name.
 */
export function validateChildName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return "Child's name is required."
  }
  if (trimmed.length < 2) {
    return "Child's name must be at least 2 characters."
  }
  if (trimmed.length > 50) {
    return "Child's name cannot exceed 50 characters."
  }
  return null
}

/**
 * Validates child sex for the WHO growth reference dataset.
 */
export function validateChildSex(sex: string): string | null {
  if (sex !== "male" && sex !== "female") {
    return "Please select sex (male or female for WHO reference curves)."
  }
  return null
}

/**
 * Validates optional birth weight in kilograms.
 */
export function validateBirthWeight(
  weight: number | string | undefined,
): string | null {
  if (weight === undefined || weight === null || weight === "") {
    return null // Optional field
  }

  const num = typeof weight === "number" ? weight : Number(weight)
  if (isNaN(num)) {
    return "Birth weight must be a valid number in kilograms."
  }
  if (num <= 0) {
    return "Birth weight must be greater than 0 kg."
  }
  if (num < 0.4 || num > 10) {
    return "Please enter a realistic birth weight between 0.4 kg and 10.0 kg."
  }

  return null
}

/**
 * Computes human-friendly age string from ISO date string without timezone skew.
 */
export function calculateAge(dobStr: string): {
  years: number
  months: number
  days: number
  text: string
} {
  if (!isValidIsoDate(dobStr)) {
    return { years: 0, months: 0, days: 0, text: "Unknown age" }
  }

  const [birthY, birthM, birthD] = dobStr.split("-").map(Number)
  const today = getTodayIsoDate()
  const [currY, currM, currD] = today.split("-").map(Number)

  let years = currY - birthY
  let months = currM - birthM
  let days = currD - birthD

  if (days < 0) {
    months -= 1
    const prevMonth = currM === 1 ? 12 : currM - 1
    const prevMonthYear = currM === 1 ? currY - 1 : currY
    days += getDaysInMonth(prevMonthYear, prevMonth)
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years < 0) {
    return { years: 0, months: 0, days: 0, text: "Just born" }
  }

  let text = ""
  if (years > 0) {
    text = `${years} ${years === 1 ? "year" : "years"}`
    if (months > 0) {
      text += `, ${months} ${months === 1 ? "month" : "months"}`
    }
  } else if (months > 0) {
    text = `${months} ${months === 1 ? "month" : "months"}`
    if (days > 0) {
      text += `, ${days} ${days === 1 ? "day" : "days"}`
    }
  } else {
    text = `${days} ${days === 1 ? "day" : "days"} old`
  }

  return { years, months, days, text }
}

export interface ChildFormErrors {
  name?: string
  dateOfBirth?: string
  sex?: string
  birthWeightKg?: string
  clinicName?: string
  form?: string
}

export interface ChildFormValues {
  name: string
  dateOfBirth: string
  sex: ChildSex
  birthWeightKg: string
  clinicName: string
}
