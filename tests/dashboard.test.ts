import test from "node:test"
import assert from "node:assert/strict"

import {
  getCaregiverGreeting,
  getNextEpiMilestone,
  addMonthsToDate,
  getNutritionPromptTeaser,
  getSampleChildActivity,
} from "../src/features/dashboard/dashboard-helpers.ts"
import type { Child } from "../src/types/child.ts"

test("Caregiver Greeting (FR-013)", () => {
  const greeting = getCaregiverGreeting("Priyantha")
  assert.ok(
    greeting.startsWith("Good morning, Priyantha") ||
      greeting.startsWith("Good afternoon, Priyantha") ||
      greeting.startsWith("Good evening, Priyantha"),
  )
})

test("Calendar Month Arithmetic without Timezone Drift (FR-026)", () => {
  // Adding 2 months to January 15 -> March 15
  assert.strictEqual(addMonthsToDate("2025-01-15", 2), "2025-03-15")

  // Adding 1 month to January 31 -> February 28 (non-leap 2025)
  assert.strictEqual(addMonthsToDate("2025-01-31", 1), "2025-02-28")

  // Adding 1 month to January 31 in leap year 2024 -> February 29
  assert.strictEqual(addMonthsToDate("2024-01-31", 1), "2024-02-29")

  // Month-end rollover to 30-day month (e.g. March 31 + 1 month -> April 30)
  assert.strictEqual(addMonthsToDate("2025-03-31", 1), "2025-04-30")
})

test("Next Scheduled EPI Milestone Calculation (FR-013, FR-020)", () => {
  // Newborn (DOB today or yesterday)
  const today = new Date().toISOString().slice(0, 10)
  const milestone = getNextEpiMilestone(today)
  assert.ok(milestone)
  assert.strictEqual(milestone.ageMonths, 0)
  assert.strictEqual(milestone.code, "BCG")

  // For a child born 2 months ago, should project subsequent milestone
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  const twoMonthsAgoIso = twoMonthsAgo.toISOString().slice(0, 10)
  const milestone2 = getNextEpiMilestone(twoMonthsAgoIso)
  assert.ok(milestone2)
  assert.ok(milestone2.dueDate >= today)
})

test("Nutrition Guidance Prompts by Age Bracket (FR-040, FR-041)", () => {
  // Under 6 months: Exclusive breastfeeding
  const infantPrompt = getNutritionPromptTeaser(3)
  assert.ok(infantPrompt.title.includes("Breastfeeding"))

  // 6-8 months: Complementary feeding start
  const weaningPrompt = getNutritionPromptTeaser(7)
  assert.ok(weaningPrompt.title.includes("Complementary Foods"))

  // 9-11 months: Texture and protein diversity
  const fingerFoodPrompt = getNutritionPromptTeaser(10)
  assert.ok(fingerFoodPrompt.title.includes("Finger Foods"))

  // 1+ years: Family meals
  const toddlerPrompt = getNutritionPromptTeaser(18)
  assert.ok(tldr => typeof tldr.title === "string")
  assert.ok(toddlerPrompt.title.includes("Family Meals"))
})

test("Recent Activity Log Attribution (FR-015)", () => {
  const child: Child = {
    id: "child_nethmi_demo",
    name: "Nethmi",
    dateOfBirth: "2025-04-15",
    sex: "female",
    birthWeightKg: 3.1,
    clinicName: "Maharagama MOH Clinic",
  }

  const activities = getSampleChildActivity(child)
  assert.ok(activities.length >= 3)

  // Verify all activities have attribution and non-empty metadata
  for (const act of activities) {
    assert.ok(act.title.length > 0)
    assert.ok(act.detail.length > 0)
    assert.ok(act.source.length > 0, "Activity must have an attributed source")
    assert.ok(act.timestamp.length > 0)
  }

  // Check specific event types
  assert.ok(activities.some((a) => a.type === "growth"))
  assert.ok(activities.some((a) => a.type === "vaccine"))
  assert.ok(activities.some((a) => a.type === "appointment"))
})
