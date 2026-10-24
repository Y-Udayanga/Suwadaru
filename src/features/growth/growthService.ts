/**
 * Mock growth service adapter for Feature B — Growth Monitoring.
 *
 * Promise-based adapter satisfying `GrowthService` from `@/services/contracts`.
 *
 * SAFETY & GOVERNANCE:
 *   - Strictly non-future measurement dates (BR-01, FR-033).
 *   - Strictly positive numeric weight in kilograms (FR-033, T-09).
 *   - Measurement provenance defaults to "parent_reported" (FR-034).
 *   - Clinical status is always "not_assessed" (FR-035, BR-04, BR-05).
 *   - Separate child session isolation (Nethmi vs Kavindu).
 */

import type { GrowthService } from "@/services/contracts"
import { AppError } from "@/services/contracts"
import type { AddMeasurementInput, GrowthMeasurement } from "@/types"
import { demoChildren } from "@/data/mock"
import {
  MOCK_MEASUREMENTS,
  getSyntheticReferenceSeries,
} from "./mockData"

const DEMO_CHILD_SEX: Record<string, "male" | "female"> = {
  child_nethmi_demo: "female",
  child_kavindu_demo: "male",
}

// In-memory isolated copy keyed by childId
const sessionMeasurements: Record<string, GrowthMeasurement[]> =
  Object.fromEntries(
    Object.entries(MOCK_MEASUREMENTS).map(([k, v]) => [k, [...v]]),
  )

const MOCK_DELAY = 300

function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const growthService: GrowthService = {
  async list(childId) {
    await delay()
    return sessionMeasurements[childId] ?? []
  },

  async addMeasurement(input: AddMeasurementInput) {
    await delay()
    const today = new Date().toISOString().slice(0, 10)

    // Validate: date required and not in future (BR-01, FR-033)
    if (!input.measuredOn || input.measuredOn.trim() === "") {
      throw new AppError("validation", "Measurement date is required.")
    }
    if (input.measuredOn > today) {
      throw new AppError(
        "validation",
        "Measurement date may not be in the future.",
      )
    }

    // Validate: date cannot be before child DOB
    const match = demoChildren.find((c) => c.id === input.childId)
    if (match && input.measuredOn < match.dateOfBirth) {
      throw new AppError(
        "validation",
        `Measurement date cannot be before the child's birth date (${match.dateOfBirth}).`,
      )
    }

    // Validate: weight must be positive numeric (FR-033, T-09)
    if (
      input.weightKg === undefined ||
      input.weightKg === null ||
      isNaN(input.weightKg) ||
      input.weightKg <= 0
    ) {
      throw new AppError(
        "validation",
        "Weight must be a positive number greater than 0 kg.",
      )
    }

    // Validate: optional length/height must be positive
    if (
      input.lengthHeightCm !== undefined &&
      (isNaN(input.lengthHeightCm) || input.lengthHeightCm <= 0)
    ) {
      throw new AppError(
        "validation",
        "Length/height must be a positive number in centimetres.",
      )
    }

    // Validate: optional head circumference must be positive
    if (
      input.headCircumferenceCm !== undefined &&
      (isNaN(input.headCircumferenceCm) || input.headCircumferenceCm <= 0)
    ) {
      throw new AppError(
        "validation",
        "Head circumference must be a positive number in centimetres.",
      )
    }

    const measurement: GrowthMeasurement = {
      id: `gm_${input.childId}_${Date.now()}`,
      childId: input.childId,
      measuredOn: input.measuredOn,
      weightKg: input.weightKg,
      lengthHeightCm: input.lengthHeightCm,
      headCircumferenceCm: input.headCircumferenceCm,
      source: "parent_reported",
    }

    const existing = sessionMeasurements[input.childId] ?? []
    sessionMeasurements[input.childId] = [...existing, measurement].sort(
      (a, b) => a.measuredOn.localeCompare(b.measuredOn),
    )
    return measurement
  },

  async getReferenceSeries(childId) {
    await delay()
    let sex = DEMO_CHILD_SEX[childId]
    if (!sex) {
      const match = demoChildren.find((c) => c.id === childId)
      if (match) sex = match.sex
    }
    return getSyntheticReferenceSeries(childId, sex ?? "female")
  },
}
