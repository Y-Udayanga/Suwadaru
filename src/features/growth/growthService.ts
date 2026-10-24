/**
 * Mock growth service adapter for Feature B — Growth Monitoring.
 *
 * Promise-based adapter satisfying `GrowthService` from `@/services/contracts`.
 *
 * BOUNDARY DOCUMENTATION:
 *   - Imports the contract interface (read-only; do NOT modify it here).
 *   - Reference series provenance is always `synthetic_demo` until official
 *     WHO tables are verified and pinned (BRD FR-031, T-10).
 *   - `clinicalStatus` is hard-coded `"not_assessed"` (FR-035, BR-04, BR-05).
 *
 * INTEGRATION IMPORTS NEEDED FROM FRONTEND A (when B1 lands):
 *   import type { GrowthService } from "@/services/contracts"
 *   import { AppError } from "@/services/contracts"
 *   — Already imported below.
 *
 * CHILD SEX LOOKUP:
 *   This adapter needs the child's sex to pick the reference series. Currently
 *   it reads from a local map of demo children (no circular dependency on
 *   Frontend A's childService). When the real childService lands, replace the
 *   local lookup with: `const child = await childService.get(childId)`.
 */

import type { GrowthService } from "@/services/contracts"
import { AppError } from "@/services/contracts"
import type { AddMeasurementInput, GrowthMeasurement } from "@/types"
import {
  MOCK_MEASUREMENTS,
  getSyntheticReferenceSeries,
} from "./mockData"

// Local lookup for demo child sex (avoids coupling to childService).
// Replace with childService.get(childId).sex when B1 is integrated.
const DEMO_CHILD_SEX: Record<string, "male" | "female"> = {
  child_nethmi_demo: "female",
  child_kavindu_demo: "male",
}

const sessionMeasurements: Record<string, GrowthMeasurement[]> =
  Object.fromEntries(
    Object.entries(MOCK_MEASUREMENTS).map(([k, v]) => [k, [...v]]),
  )

const MOCK_DELAY = 450

function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const growthService: GrowthService = {
  async list(childId) {
    await delay()
    // Unknown child returns empty array; component decides whether to show CTA.
    return sessionMeasurements[childId] ?? []
  },

  async addMeasurement(input: AddMeasurementInput) {
    await delay()
    // Validate: date must not be in the future (BR-01, FR-033).
    const today = new Date().toISOString().slice(0, 10)
    if (input.measuredOn > today) {
      throw new AppError(
        "validation",
        "Measurement date may not be in the future.",
      )
    }
    // Validate: weight must be positive when provided (FR-033, T-09).
    if (input.weightKg !== undefined && input.weightKg <= 0) {
      throw new AppError(
        "validation",
        "Weight must be a positive number in kilograms.",
      )
    }
    if (
      input.lengthHeightCm !== undefined &&
      input.lengthHeightCm <= 0
    ) {
      throw new AppError(
        "validation",
        "Length/height must be a positive number in centimetres.",
      )
    }
    if (
      input.headCircumferenceCm !== undefined &&
      input.headCircumferenceCm <= 0
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
    const sex = DEMO_CHILD_SEX[childId]
    // Unknown child defaults to a female reference; this is arbitrary for
    // demo purposes and will be replaced when childService provides sex.
    return getSyntheticReferenceSeries(childId, sex ?? "female")
  },
}
