/**
 * Mock vaccination service adapter for Feature B — Vaccination Tracker.
 *
 * This module is an in-memory, Promise-based adapter that satisfies the
 * `VaccinationService` contract from `@/services/contracts`.
 *
 * BOUNDARY DOCUMENTATION:
 *   - Imports the contract interface (read-only; do NOT modify it here).
 *   - Imports mock data local to this feature folder.
 *   - Throws `AppError` with appropriate codes for expected failures.
 *   - No store state outside this module. The in-memory record array is
 *     module-level to simulate session persistence (Q-01: in-memory state).
 *
 * INTEGRATION IMPORTS NEEDED FROM FRONTEND A (when B1 lands):
 *   import type { VaccinationService } from "@/services/contracts"
 *   import { AppError } from "@/services/contracts"
 *   — Already imported below; no changes needed at that boundary.
 *
 * Replace the function bodies with Supabase calls to integrate B1 backend.
 */

import type { VaccinationService } from "@/services/contracts"
import { AppError } from "@/services/contracts"
import type { AddReportedDoseInput, VaccinationRecord } from "@/types"
import {
  CHILD_DOBS,
  MOCK_VACCINATION_RECORDS,
  buildSchedule,
} from "./mockData"

// In-memory mutable copy so parent-reported doses persist during the session.
const sessionRecords: Record<string, VaccinationRecord[]> = Object.fromEntries(
  Object.entries(MOCK_VACCINATION_RECORDS).map(([k, v]) => [k, [...v]]),
)

/** Simulated async delay (ms). */
const MOCK_DELAY = 400

function delay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const vaccinationService: VaccinationService = {
  async getSchedule(childId) {
    await delay()
    const dob = CHILD_DOBS[childId]
    if (!dob) {
      throw new AppError("not_found", `No schedule data for child "${childId}"`)
    }
    return buildSchedule(childId, dob)
  },

  async getRecords(childId) {
    await delay()
    // Unknown child still returns an empty array; do not throw — the child
    // might exist without records (handled by the caller).
    return sessionRecords[childId] ?? []
  },

  async addReportedDose(input: AddReportedDoseInput) {
    await delay()
    // Validate: date must not be in the future (BR-01).
    const today = new Date().toISOString().slice(0, 10)
    if (input.administeredOn > today) {
      throw new AppError(
        "validation",
        "Administered date may not be in the future.",
      )
    }
    const record: VaccinationRecord = {
      id: `rec_${input.childId}_${input.vaccineCode}_${Date.now()}`,
      childId: input.childId,
      vaccineCode: input.vaccineCode,
      administeredOn: input.administeredOn,
      // BR-02: user-entered completion is always parent_reported; never verified.
      source: "parent_reported",
    }
    const existing = sessionRecords[input.childId] ?? []
    sessionRecords[input.childId] = [...existing, record]
    return record
  },
}
