import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  isLeapYear,
  daysInMonth,
  addCalendarMonths,
  isFutureDate,
  daysBetween,
  formatCalendarDate,
} from "../src/features/vaccinations/calendarDate.ts"

describe("calendarDate pure helper functions", () => {
  describe("isLeapYear", () => {
    it("identifies leap years and non-leap years correctly", () => {
      assert.equal(isLeapYear(2024), true)
      assert.equal(isLeapYear(2025), false)
      assert.equal(isLeapYear(2026), false)
      assert.equal(isLeapYear(2028), true)
      assert.equal(isLeapYear(1900), false) // century not div by 400
      assert.equal(isLeapYear(2000), true)  // century div by 400
    })
  })

  describe("daysInMonth", () => {
    it("returns correct days for February in leap and non-leap years", () => {
      assert.equal(daysInMonth(2024, 2), 29)
      assert.equal(daysInMonth(2025, 2), 28)
    })

    it("returns correct days for 30-day and 31-day months", () => {
      assert.equal(daysInMonth(2025, 1), 31) // Jan
      assert.equal(daysInMonth(2025, 4), 30) // Apr
      assert.equal(daysInMonth(2025, 6), 30) // Jun
      assert.equal(daysInMonth(2025, 7), 31) // Jul
      assert.equal(daysInMonth(2025, 8), 31) // Aug
      assert.equal(daysInMonth(2025, 9), 30) // Sep
    })
  })

  describe("addCalendarMonths (BR-01, T-06)", () => {
    it("adds standard months without day overflow", () => {
      assert.equal(addCalendarMonths("2025-04-15", 2), "2025-06-15")
      assert.equal(addCalendarMonths("2025-04-15", 4), "2025-08-15")
      assert.equal(addCalendarMonths("2025-04-15", 12), "2026-04-15")
    })

    it("clamps end-of-month DOB to 28th Feb in non-leap year (T-06)", () => {
      // Jan 31 + 1 month -> Feb 28 in 2025
      assert.equal(addCalendarMonths("2025-01-31", 1), "2025-02-28")
    })

    it("clamps end-of-month DOB to 29th Feb in leap year (T-06)", () => {
      // Jan 31 + 1 month -> Feb 29 in 2024
      assert.equal(addCalendarMonths("2024-01-31", 1), "2024-02-29")
    })

    it("handles leap-day birthdate (Feb 29) across subsequent years", () => {
      // Born on leap day 2024-02-29
      // At 12 months (1 year) -> 2025-02-28 (clamped to max day)
      assert.equal(addCalendarMonths("2024-02-29", 12), "2025-02-28")
      // At 24 months (2 years) -> 2026-02-28
      assert.equal(addCalendarMonths("2024-02-29", 24), "2026-02-28")
      // At 48 months (4 years, next leap year 2028) -> 2028-02-29
      assert.equal(addCalendarMonths("2024-02-29", 48), "2028-02-29")
      // At 2 months -> 2024-04-29 (April has 30 days, so 29 is valid)
      assert.equal(addCalendarMonths("2024-02-29", 2), "2024-04-29")
    })

    it("clamps 31st day to 30th for 30-day target months", () => {
      // March 31 + 1 month -> April 30
      assert.equal(addCalendarMonths("2025-03-31", 1), "2025-04-30")
      // May 31 + 1 month -> June 30
      assert.equal(addCalendarMonths("2025-05-31", 1), "2025-06-30")
      // August 31 + 1 month -> September 30
      assert.equal(addCalendarMonths("2025-08-31", 1), "2025-09-30")
      // October 31 + 1 month -> November 30
      assert.equal(addCalendarMonths("2025-10-31", 1), "2025-11-30")
    })

    it("adds 0 months as identity", () => {
      assert.equal(addCalendarMonths("2025-04-15", 0), "2025-04-15")
    })
  })

  describe("isFutureDate (BR-01, FR-026)", () => {
    it("returns true for future dates and false for past/today", () => {
      const today = "2026-10-24"
      assert.equal(isFutureDate("2026-10-25", today), true)
      assert.equal(isFutureDate("2027-01-01", today), true)
      assert.equal(isFutureDate("2026-10-24", today), false)
      assert.equal(isFutureDate("2026-10-23", today), false)
      assert.equal(isFutureDate("2025-04-15", today), false)
    })
  })

  describe("daysBetween", () => {
    it("calculates exact calendar day differences", () => {
      assert.equal(daysBetween("2026-10-20", "2026-10-24"), 4)
      assert.equal(daysBetween("2026-10-24", "2026-10-20"), -4)
      assert.equal(daysBetween("2026-10-24", "2026-10-24"), 0)
    })
  })

  describe("formatCalendarDate", () => {
    it("formats ISO string into readable presentation", () => {
      assert.equal(formatCalendarDate("2025-04-15"), "15 Apr 2025")
      assert.equal(formatCalendarDate("2026-02-28"), "28 Feb 2026")
    })
  })
})
