/**
 * Mock vaccination service adapter for Feature B — Vaccination Tracker.
 *
 * This module is an in-memory, Promise-based adapter that satisfies the
 * `VaccinationService` contract from `@/services/contracts`.
 *
 * SOURCING & CONSTRAINTS:
 *   - Follows BRD §7.3, FR-020–FR-026, BR-01, BR-02, BR-03.
 *   - Strictly non-future administered dates (BR-01, FR-026).
 *   - Stored provenance is always "parent_reported"; never "health_worker_verified" (BR-02).
 *   - No automated catch-up schedule generation (BR-03).
 */

import type { VaccinationService } from "@/services/contracts"
import { AppError } from "@/services/contracts"
import {
  addVaccinationRecord,
  getVaccinationRecords,
  getVaccineSchedule,
  isPersistedChildId,
  requireCaregiverSession,
  updateVaccinationRecord,
} from "@/services/health"
import { supabase } from "@/utils/supabase"
import type { AddReportedDoseInput, VaccinationRecord } from "@/types"
import { demoChildren } from "@/data/mock"
import {
  CHILD_DOBS,
  MOCK_VACCINATION_RECORDS,
  buildSchedule,
} from "./mockData"
import { isFutureDate } from "./calendarDate"

// In-memory mutable copy so parent-reported doses persist during the session.
const sessionRecords: Record<string, VaccinationRecord[]> = Object.fromEntries(
  Object.entries(MOCK_VACCINATION_RECORDS).map(([k, v]) => [k, [...v]]),
)

/** Simulated async delay (ms). */
const MOCK_DELAY = 300

function delay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const vaccinationService: VaccinationService = {
  async getSchedule(childId) {
    if (isPersistedChildId(childId)) {
      await requireCaregiverSession()
      return getVaccineSchedule(supabase, childId)
    }
    await delay()
    let dob = CHILD_DOBS[childId]
    if (!dob) {
      const match = demoChildren.find((c) => c.id === childId)
      if (match) {
        dob = match.dateOfBirth
      }
    }
    if (!dob) {
      throw new AppError(
        "not_found",
        `No schedule data could be generated for child "${childId}". Child not found.`,
      )
    }
    return buildSchedule(childId, dob)
  },

  async getRecords(childId) {
    if (isPersistedChildId(childId)) {
      await requireCaregiverSession()
      return getVaccinationRecords(supabase, childId)
    }
    await delay()
    // Unknown child returns an empty array; caller handles display safely.
    return sessionRecords[childId] ?? []
  },

  async addReportedDose(input: AddReportedDoseInput) {
    if (isPersistedChildId(input.childId)) {
      await requireCaregiverSession()
      const existing = await getVaccinationRecords(supabase, input.childId)
      const prior = existing.find((record) => record.vaccineCode === input.vaccineCode)
      if (prior) {
        return updateVaccinationRecord(supabase, prior.id, {
          administeredOn: input.administeredOn,
        })
      }
      return addVaccinationRecord(supabase, input)
    }
    await delay()
    const today = new Date().toISOString().slice(0, 10)

    // Validation: administered date required
    if (!input.administeredOn || input.administeredOn.trim() === "") {
      throw new AppError("validation", "Administered date is required.")
    }

    // Validation: date must not be in the future (BR-01, FR-026, T-09)
    if (isFutureDate(input.administeredOn, today)) {
      throw new AppError(
        "validation",
        "Administered date may not be in the future.",
      )
    }

    // Validation: check child DOB if available (cannot vaccinate before birth)
    const childMatch = demoChildren.find((c) => c.id === input.childId)
    const dob = CHILD_DOBS[input.childId] || childMatch?.dateOfBirth
    if (dob && input.administeredOn < dob) {
      throw new AppError(
        "validation",
        `Administered date cannot be before the child's birth date (${dob}).`,
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
    // Replace if same vaccineCode exists or append
    const filtered = existing.filter((r) => r.vaccineCode !== input.vaccineCode)
    sessionRecords[input.childId] = [...filtered, record]
    return record
  },
}
