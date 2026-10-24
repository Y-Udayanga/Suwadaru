/**
 * Fictional vaccination mock data for Frontend B health pages.
 *
 * All records are synthetic demo data. They do not represent actual immunisation
 * history, do not constitute clinical verification, and must never be treated as
 * PHM-confirmed or health-worker-verified records.
 *
 * SOURCING & BASELINE:
 *   EPI Schedule versioned in `./scheduleConfig.ts`.
 *   Baseline: Published Sri Lanka EPI 2023 PDF (research reference only; verify
 *   latest effective circular before any live deployment).
 *   Source: https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf
 *
 * INTEGRATION NOTE FOR FRONTEND A:
 *   When `vaccinationService` from `@/services/contracts` is wired, replace
 *   the mock adapter in `./vaccinationService.ts` with the real import.
 *   Do NOT modify `@/types` or `@/services/contracts` from this module.
 */

import type { VaccinationMilestone, VaccinationRecord } from "@/types"
import { addCalendarMonths } from "./calendarDate"
import {
  EPI_SCHEDULE_DEFINITIONS,
  EPI_SCHEDULE_METADATA,
} from "./scheduleConfig"

/** Build a dated schedule from a child's date-of-birth string using calendar-month arithmetic. */
export function buildSchedule(
  childId: string,
  dateOfBirth: string,
): VaccinationMilestone[] {
  return EPI_SCHEDULE_DEFINITIONS.map((entry, i) => {
    const dueDate = entry.birthWindow
      ? dateOfBirth
      : addCalendarMonths(dateOfBirth, entry.ageMonths as number)
    return {
      id: `milestone_${childId}_${entry.vaccineCode}_${i}`,
      vaccineCode: entry.vaccineCode,
      vaccineName: entry.vaccineName,
      ageMonths: entry.ageMonths,
      birthWindow: entry.birthWindow,
      dueDate,
      scheduleVersion: EPI_SCHEDULE_METADATA.version,
      sourceUrl: EPI_SCHEDULE_METADATA.sourceUrl,
    }
  })
}

// ---------------------------------------------------------------------------
// Seeded fictional records — Nethmi (female, DOB 2025-04-15).
// Status: demo (synthetic parent_reported); not verified by any health worker.
// ---------------------------------------------------------------------------
export const NETHMI_VACCINATION_RECORDS: VaccinationRecord[] = [
  {
    id: "rec_nethmi_BCG",
    childId: "child_nethmi_demo",
    vaccineCode: "BCG",
    administeredOn: "2025-04-16",
    source: "demo",
  },
  {
    id: "rec_nethmi_PENTA1",
    childId: "child_nethmi_demo",
    vaccineCode: "PENTA1",
    administeredOn: "2025-06-18",
    source: "demo",
  },
  {
    id: "rec_nethmi_OPV1",
    childId: "child_nethmi_demo",
    vaccineCode: "OPV1",
    administeredOn: "2025-06-18",
    source: "demo",
  },
  {
    id: "rec_nethmi_fIPV1",
    childId: "child_nethmi_demo",
    vaccineCode: "fIPV1",
    administeredOn: "2025-06-18",
    source: "demo",
  },
  {
    id: "rec_nethmi_PENTA2",
    childId: "child_nethmi_demo",
    vaccineCode: "PENTA2",
    administeredOn: "2025-08-20",
    source: "demo",
  },
  {
    id: "rec_nethmi_OPV2",
    childId: "child_nethmi_demo",
    vaccineCode: "OPV2",
    administeredOn: "2025-08-20",
    source: "demo",
  },
  {
    id: "rec_nethmi_fIPV2",
    childId: "child_nethmi_demo",
    vaccineCode: "fIPV2",
    administeredOn: "2025-08-20",
    source: "demo",
  },
]

// ---------------------------------------------------------------------------
// Seeded fictional records — Kavindu (male, DOB 2026-02-28).
// Only birth-window BCG completed; rest are upcoming per today's date.
// ---------------------------------------------------------------------------
export const KAVINDU_VACCINATION_RECORDS: VaccinationRecord[] = [
  {
    id: "rec_kavindu_BCG",
    childId: "child_kavindu_demo",
    vaccineCode: "BCG",
    administeredOn: "2026-02-28",
    source: "demo",
  },
]

export const MOCK_VACCINATION_RECORDS: Record<string, VaccinationRecord[]> = {
  child_nethmi_demo: NETHMI_VACCINATION_RECORDS,
  child_kavindu_demo: KAVINDU_VACCINATION_RECORDS,
}

/** Child DOBs used to generate schedules. */
export const CHILD_DOBS: Record<string, string> = {
  child_nethmi_demo: "2025-04-15",
  child_kavindu_demo: "2026-02-28",
}
