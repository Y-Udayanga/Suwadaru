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
  validateChildDob,
  validateChildName,
  validateBirthWeight,
  validateChildSex,
  isValidIsoDate,
  isLeapYear,
  getDaysInMonth,
  calculateAge,
} from "../src/features/children/validation.ts"
import { MockChildService } from "../src/services/mock-child-service.ts"
import { AppError } from "../src/services/contracts/errors.ts"
import { fixtureIds } from "../src/data/mock/children.ts"

test("Calendar & Leap Year Logic (FR-026)", () => {
  // Leap years
  assert.strictEqual(isLeapYear(2024), true)
  assert.strictEqual(isLeapYear(2000), true)
  assert.strictEqual(isLeapYear(2025), false)
  assert.strictEqual(isLeapYear(1900), false)
  assert.strictEqual(isLeapYear(2026), false)

  // Days in month
  assert.strictEqual(getDaysInMonth(2024, 2), 29) // Feb leap
  assert.strictEqual(getDaysInMonth(2025, 2), 28) // Feb regular
  assert.strictEqual(getDaysInMonth(2025, 4), 30) // April
  assert.strictEqual(getDaysInMonth(2025, 1), 31) // January

  // Valid ISO date strings
  assert.strictEqual(isValidIsoDate("2024-02-29"), true)
  assert.strictEqual(isValidIsoDate("2025-02-28"), true)
  assert.strictEqual(isValidIsoDate("2025-04-30"), true)

  // Malformed date strings
  assert.strictEqual(isValidIsoDate("2025-02-29"), false) // Invalid non-leap Feb 29
  assert.strictEqual(isValidIsoDate("2025-04-31"), false) // April only has 30 days
  assert.strictEqual(isValidIsoDate("2025-13-01"), false) // Month 13
  assert.strictEqual(isValidIsoDate("2025-00-10"), false) // Month 0
  assert.strictEqual(isValidIsoDate("not-a-date"), false)
  assert.strictEqual(isValidIsoDate("2025/05/10"), false)
})

test("Child DOB Validation: empty, malformed, and future dates (T-03)", () => {
  // Empty
  assert.strictEqual(validateChildDob(""), "Date of birth is required.")
  assert.strictEqual(validateChildDob("   "), "Date of birth is required.")

  // Malformed
  assert.strictEqual(
    validateChildDob("2025-02-30"),
    "Please enter a valid calendar date in YYYY-MM-DD format.",
  )
  assert.strictEqual(
    validateChildDob("invalid-date"),
    "Please enter a valid calendar date in YYYY-MM-DD format.",
  )

  // Future Date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`
  assert.strictEqual(
    validateChildDob(tomorrowIso),
    "Date of birth cannot be in the future.",
  )

  // Valid past date
  assert.strictEqual(validateChildDob("2025-04-15"), null)
})

test("Child Name, Sex, and Birth Weight Validation", () => {
  // Name
  assert.strictEqual(validateChildName(""), "Child's name is required.")
  assert.strictEqual(
    validateChildName("A"),
    "Child's name must be at least 2 characters.",
  )
  assert.strictEqual(validateChildName("Nethmi"), null)
  assert.strictEqual(validateChildName("Kavindu Perera"), null)

  // Sex
  assert.strictEqual(
    validateChildSex("unknown"),
    "Please select sex (male or female for WHO reference curves).",
  )
  assert.strictEqual(validateChildSex("female"), null)
  assert.strictEqual(validateChildSex("male"), null)

  // Weight
  assert.strictEqual(validateBirthWeight(""), null) // Optional
  assert.strictEqual(validateBirthWeight(undefined), null) // Optional
  assert.strictEqual(
    validateBirthWeight(0),
    "Birth weight must be greater than 0 kg.",
  )
  assert.strictEqual(
    validateBirthWeight(-2),
    "Birth weight must be greater than 0 kg.",
  )
  assert.strictEqual(
    validateBirthWeight("not-a-number"),
    "Birth weight must be a valid number in kilograms.",
  )
  assert.strictEqual(validateBirthWeight(3.1), null)
  assert.strictEqual(validateBirthWeight("2.9"), null)
})

test("Age Calculation without Timezone Drift", () => {
  const age = calculateAge("2025-04-15")
  assert.ok(typeof age.text === "string" && age.text.length > 0)
  assert.ok(age.years >= 0)
  assert.ok(age.months >= 0)
  assert.ok(age.days >= 0)
})

test("MockChildService: Seeding, Get, Add, Edit, and Safe 404 (T-04, T-05)", async () => {
  storage.clear()
  const childService = new MockChildService()

  // 1. Initial seeded children
  const initialChildren = await childService.list()
  assert.strictEqual(initialChildren.length, 2)
  assert.strictEqual(initialChildren[0].id, fixtureIds.nethmi)
  assert.strictEqual(initialChildren[0].name, "Nethmi")
  assert.strictEqual(initialChildren[0].sex, "female")
  assert.strictEqual(initialChildren[1].id, fixtureIds.kavindu)
  assert.strictEqual(initialChildren[1].name, "Kavindu")
  assert.strictEqual(initialChildren[1].sex, "male")

  // 2. Get existing children
  const nethmi = await childService.get(fixtureIds.nethmi)
  assert.strictEqual(nethmi.name, "Nethmi")
  const kavindu = await childService.get(fixtureIds.kavindu)
  assert.strictEqual(kavindu.name, "Kavindu")

  // 3. Bogus ID produces safe not_found AppError (T-05, never returns another child)
  await assert.rejects(
    async () => {
      await childService.get("bogus-child-id-999")
    },
    (err: unknown) => {
      return (
        err instanceof AppError &&
        err.code === "not_found" &&
        err.message.includes("was not found")
      )
    },
  )

  // 4. Create a new fictional child (Add Child)
  const created = await childService.create({
    name: "Aruni",
    dateOfBirth: "2025-08-10",
    sex: "female",
    birthWeightKg: 3.2,
    clinicName: "Colombo MOH Clinic",
  })
  assert.ok(created.id.startsWith("child_aruni_"))
  assert.strictEqual(created.name, "Aruni")
  assert.strictEqual(created.dateOfBirth, "2025-08-10")
  assert.strictEqual(created.sex, "female")
  assert.strictEqual(created.birthWeightKg, 3.2)

  // List now contains 3 children
  const childrenAfterAdd = await childService.list()
  assert.strictEqual(childrenAfterAdd.length, 3)

  // 5. Update child demographic fields (Edit Profile)
  const updated = await childService.update(created.id, {
    name: "Aruni Kumari",
    birthWeightKg: 3.3,
  })
  assert.strictEqual(updated.name, "Aruni Kumari")
  assert.strictEqual(updated.birthWeightKg, 3.3)
  assert.strictEqual(updated.dateOfBirth, "2025-08-10") // Preserved

  // Verify fetch returns updated profile
  const fetchedUpdated = await childService.get(created.id)
  assert.strictEqual(fetchedUpdated.name, "Aruni Kumari")
  assert.strictEqual(fetchedUpdated.birthWeightKg, 3.3)

  // 6. Persistence across page reload (re-instantiated service reads storage)
  const freshServiceInstance = new MockChildService()
  const reloadedList = await freshServiceInstance.list()
  assert.strictEqual(reloadedList.length, 3)
  assert.strictEqual(reloadedList[2].name, "Aruni Kumari")
})
