import assert from "node:assert/strict"
import { test } from "node:test"
import { buildChartData, chartAgeMonths, resolveChartReference } from "../src/features/growth/chartData.ts"
import type { GrowthReferenceSeries } from "../src/types/growth.ts"

const reference: GrowthReferenceSeries = {
  childId: "child", indicator: "weight_for_age", sex: "male", provenance: "unavailable",
  sourceLabel: "Unavailable", sourceVersion: "", clinicalStatus: "not_assessed", points: [],
}

test("retains separate weights within the same month and at reference ages", () => {
  const points = buildChartData("2026-01-01", [
    { id: "1", childId: "child", measuredOn: "2026-02-01", weightKg: 4, source: "parent_reported" },
    { id: "2", childId: "child", measuredOn: "2026-02-15", weightKg: 4.5, source: "parent_reported" },
  ], resolveChartReference({ dateOfBirth: "2026-01-01", sex: "male" }, reference))
  const weights = points.filter(point => "weight" in point)
  assert.equal(weights.length, 2)
  assert.equal(weights[0].ageMonths, 1)
  assert.equal(weights[1].ageMonths, 1.5)
})

test("positions month-end birthdays consistently through leap February", () => {
  assert.equal(chartAgeMonths("2024-01-31", "2024-02-29"), 1)
  assert.equal(chartAgeMonths("2024-01-31", "2024-03-31"), 2)
})

test("uses bundled sex-specific WHO curves when references are empty", () => {
  const male = resolveChartReference({ dateOfBirth: "2024-01-01", sex: "male" }, reference)
  const female = resolveChartReference({ dateOfBirth: "2024-01-01", sex: "female" }, { ...reference, sex: "female" })
  assert.equal(male.provenance, "who")
  assert.ok(male.points.length > 1800)
  assert.notEqual(male.points[0].medianKg, female.points[0].medianKg)
  assert.equal(resolveChartReference({ dateOfBirth: "2024-01-01", sex: "male" }, male), male)
})

test("empty and single-observation states never fabricate a trend", () => {
  assert.equal(buildChartData("2026-01-01", [], reference).length, 0)
  assert.equal(buildChartData("2026-01-01", [
    { id: "1", childId: "child", measuredOn: "2026-02-01", weightKg: 4, source: "parent_reported" },
    { id: "2", childId: "child", measuredOn: "2026-02-15", weightKg: NaN, source: "parent_reported" },
  ], reference).length, 1)
})
