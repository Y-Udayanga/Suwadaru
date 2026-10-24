/**
 * Fictional growth mock data for Frontend B health pages.
 *
 * All measurements are synthetic demo records. They are explicitly labeled
 * "demo" and do not constitute a clinical assessment. Clinical status is
 * hard-coded `not_assessed` as required by BRD FR-035 and BR-04/BR-05.
 *
 * Reference curves: provenance is `synthetic_demo` because official WHO
 * numerical tables have not been verified and pinned for F0.
 * Prominent disclaimer is required (BRD T-10).
 *
 * INTEGRATION NOTE FOR FRONTEND A:
 *   When `growthService` from `@/services/contracts` is wired, replace
 *   the mock adapter in `./growthService.ts` with the real import.
 */

import type { GrowthMeasurement, GrowthReferenceSeries } from "@/types"

// ---------------------------------------------------------------------------
// Fictional growth measurements — Nethmi (female, DOB 2025-04-15).
// Source: demo. Not verified. Age-appropriate ranges are plausible but
// must not be interpreted as clinically meaningful without WHO validation.
// ---------------------------------------------------------------------------
export const NETHMI_MEASUREMENTS: GrowthMeasurement[] = [
  {
    id: "gm_nethmi_01",
    childId: "child_nethmi_demo",
    measuredOn: "2025-04-15",
    weightKg: 3.1,
    lengthHeightCm: 50.0,
    headCircumferenceCm: 34.0,
    source: "demo",
  },
  {
    id: "gm_nethmi_02",
    childId: "child_nethmi_demo",
    measuredOn: "2025-06-18",
    weightKg: 5.2,
    lengthHeightCm: 58.0,
    headCircumferenceCm: 38.5,
    source: "demo",
  },
  {
    id: "gm_nethmi_03",
    childId: "child_nethmi_demo",
    measuredOn: "2025-08-20",
    weightKg: 6.8,
    lengthHeightCm: 64.0,
    headCircumferenceCm: 41.0,
    source: "demo",
  },
  {
    id: "gm_nethmi_04",
    childId: "child_nethmi_demo",
    measuredOn: "2025-11-10",
    weightKg: 8.1,
    lengthHeightCm: 70.0,
    headCircumferenceCm: 43.5,
    source: "demo",
  },
  {
    id: "gm_nethmi_05",
    childId: "child_nethmi_demo",
    measuredOn: "2026-03-05",
    weightKg: 9.4,
    lengthHeightCm: 76.5,
    headCircumferenceCm: 45.5,
    source: "demo",
  },
]

// ---------------------------------------------------------------------------
// Fictional growth measurements — Kavindu (male, DOB 2026-02-28).
// ---------------------------------------------------------------------------
export const KAVINDU_MEASUREMENTS: GrowthMeasurement[] = [
  {
    id: "gm_kavindu_01",
    childId: "child_kavindu_demo",
    measuredOn: "2026-02-28",
    weightKg: 2.9,
    lengthHeightCm: 49.5,
    headCircumferenceCm: 33.5,
    source: "demo",
  },
  {
    id: "gm_kavindu_02",
    childId: "child_kavindu_demo",
    measuredOn: "2026-05-02",
    weightKg: 5.0,
    lengthHeightCm: 57.5,
    headCircumferenceCm: 38.0,
    source: "demo",
  },
  {
    id: "gm_kavindu_03",
    childId: "child_kavindu_demo",
    measuredOn: "2026-07-15",
    weightKg: 6.5,
    lengthHeightCm: 63.0,
    headCircumferenceCm: 40.5,
    source: "demo",
  },
  {
    id: "gm_kavindu_04",
    childId: "child_kavindu_demo",
    measuredOn: "2026-10-01",
    weightKg: 7.8,
    lengthHeightCm: 69.0,
    source: "demo",
  },
]

export const MOCK_MEASUREMENTS: Record<string, GrowthMeasurement[]> = {
  child_nethmi_demo: NETHMI_MEASUREMENTS,
  child_kavindu_demo: KAVINDU_MEASUREMENTS,
}

// ---------------------------------------------------------------------------
// Synthetic reference series.
// `provenance: "synthetic_demo"` — these are NOT official WHO values.
// They are illustrative curves only. A clinical z-score is not calculated
// and `clinicalStatus` remains `"not_assessed"` as required by BRD FR-035.
// ---------------------------------------------------------------------------
const SYNTHETIC_FEMALE_SERIES: GrowthReferenceSeries = {
  childId: "", // stamped at call time
  indicator: "weight_for_age",
  sex: "female",
  provenance: "synthetic_demo",
  sourceLabel:
    "DEMONSTRATION ONLY — not official WHO data. Do not use for clinical assessment.",
  sourceVersion: "synthetic-demo-v1",
  clinicalStatus: "not_assessed",
  points: [
    { ageMonths: 0, sdMinus2Kg: 2.3, sdMinus1Kg: 2.8, medianKg: 3.3, sdPlus1Kg: 3.9, sdPlus2Kg: 4.5 },
    { ageMonths: 1, sdMinus2Kg: 3.1, sdMinus1Kg: 3.8, medianKg: 4.5, sdPlus1Kg: 5.2, sdPlus2Kg: 6.0 },
    { ageMonths: 2, sdMinus2Kg: 3.9, sdMinus1Kg: 4.7, medianKg: 5.5, sdPlus1Kg: 6.4, sdPlus2Kg: 7.3 },
    { ageMonths: 3, sdMinus2Kg: 4.5, sdMinus1Kg: 5.4, medianKg: 6.3, sdPlus1Kg: 7.2, sdPlus2Kg: 8.2 },
    { ageMonths: 4, sdMinus2Kg: 5.0, sdMinus1Kg: 5.9, medianKg: 6.9, sdPlus1Kg: 8.0, sdPlus2Kg: 9.1 },
    { ageMonths: 6, sdMinus2Kg: 5.8, sdMinus1Kg: 6.8, medianKg: 7.9, sdPlus1Kg: 9.1, sdPlus2Kg: 10.4 },
    { ageMonths: 9, sdMinus2Kg: 6.6, sdMinus1Kg: 7.7, medianKg: 8.9, sdPlus1Kg: 10.2, sdPlus2Kg: 11.7 },
    { ageMonths: 12, sdMinus2Kg: 7.1, sdMinus1Kg: 8.3, medianKg: 9.6, sdPlus1Kg: 11.0, sdPlus2Kg: 12.6 },
    { ageMonths: 18, sdMinus2Kg: 8.1, sdMinus1Kg: 9.4, medianKg: 10.9, sdPlus1Kg: 12.5, sdPlus2Kg: 14.3 },
    { ageMonths: 24, sdMinus2Kg: 9.0, sdMinus1Kg: 10.5, medianKg: 12.1, sdPlus1Kg: 14.0, sdPlus2Kg: 16.1 },
    { ageMonths: 36, sdMinus2Kg: 10.5, sdMinus1Kg: 12.2, medianKg: 14.3, sdPlus1Kg: 16.5, sdPlus2Kg: 19.2 },
    { ageMonths: 48, sdMinus2Kg: 12.0, sdMinus1Kg: 14.0, medianKg: 16.4, sdPlus1Kg: 19.1, sdPlus2Kg: 22.4 },
    { ageMonths: 60, sdMinus2Kg: 13.5, sdMinus1Kg: 15.8, medianKg: 18.5, sdPlus1Kg: 21.8, sdPlus2Kg: 25.9 },
  ],
}

const SYNTHETIC_MALE_SERIES: GrowthReferenceSeries = {
  childId: "",
  indicator: "weight_for_age",
  sex: "male",
  provenance: "synthetic_demo",
  sourceLabel:
    "DEMONSTRATION ONLY — not official WHO data. Do not use for clinical assessment.",
  sourceVersion: "synthetic-demo-v1",
  clinicalStatus: "not_assessed",
  points: [
    { ageMonths: 0, sdMinus2Kg: 2.5, sdMinus1Kg: 3.0, medianKg: 3.5, sdPlus1Kg: 4.1, sdPlus2Kg: 4.7 },
    { ageMonths: 1, sdMinus2Kg: 3.4, sdMinus1Kg: 4.1, medianKg: 4.9, sdPlus1Kg: 5.7, sdPlus2Kg: 6.5 },
    { ageMonths: 2, sdMinus2Kg: 4.2, sdMinus1Kg: 5.1, medianKg: 6.0, sdPlus1Kg: 7.0, sdPlus2Kg: 8.1 },
    { ageMonths: 3, sdMinus2Kg: 4.9, sdMinus1Kg: 5.9, medianKg: 6.9, sdPlus1Kg: 8.0, sdPlus2Kg: 9.3 },
    { ageMonths: 4, sdMinus2Kg: 5.5, sdMinus1Kg: 6.5, medianKg: 7.6, sdPlus1Kg: 8.8, sdPlus2Kg: 10.2 },
    { ageMonths: 6, sdMinus2Kg: 6.3, sdMinus1Kg: 7.4, medianKg: 8.6, sdPlus1Kg: 10.0, sdPlus2Kg: 11.5 },
    { ageMonths: 9, sdMinus2Kg: 7.2, sdMinus1Kg: 8.4, medianKg: 9.7, sdPlus1Kg: 11.2, sdPlus2Kg: 13.0 },
    { ageMonths: 12, sdMinus2Kg: 7.8, sdMinus1Kg: 9.0, medianKg: 10.5, sdPlus1Kg: 12.1, sdPlus2Kg: 14.0 },
    { ageMonths: 18, sdMinus2Kg: 8.9, sdMinus1Kg: 10.3, medianKg: 11.9, sdPlus1Kg: 13.8, sdPlus2Kg: 16.0 },
    { ageMonths: 24, sdMinus2Kg: 9.9, sdMinus1Kg: 11.4, medianKg: 13.2, sdPlus1Kg: 15.4, sdPlus2Kg: 17.9 },
    { ageMonths: 36, sdMinus2Kg: 11.5, sdMinus1Kg: 13.4, medianKg: 15.6, sdPlus1Kg: 18.2, sdPlus2Kg: 21.5 },
    { ageMonths: 48, sdMinus2Kg: 13.1, sdMinus1Kg: 15.3, medianKg: 17.9, sdPlus1Kg: 21.1, sdPlus2Kg: 25.2 },
    { ageMonths: 60, sdMinus2Kg: 14.6, sdMinus1Kg: 17.1, medianKg: 20.1, sdPlus1Kg: 23.9, sdPlus2Kg: 28.8 },
  ],
}

export function getSyntheticReferenceSeries(
  childId: string,
  sex: "male" | "female",
): GrowthReferenceSeries {
  const base = sex === "female" ? SYNTHETIC_FEMALE_SERIES : SYNTHETIC_MALE_SERIES
  return { ...base, childId }
}
