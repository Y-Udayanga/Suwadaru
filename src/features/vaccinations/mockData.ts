/**
 * Fictional vaccination mock data for Frontend B health pages.
 *
 * All records are synthetic demo data. They do not represent actual immunisation
 * history, do not constitute clinical verification, and must never be treated as
 * PHM-confirmed or health-worker-verified records.
 *
 * Schedule baseline: Sri Lanka EPI 2023 PDF (research reference only; verify
 * latest effective circular before any live deployment).
 * Source: https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf
 *
 * INTEGRATION NOTE FOR FRONTEND A:
 *   When `vaccinationService` from `@/services/contracts` is wired, replace
 *   the mock adapter in `./vaccinationService.ts` with the real import.
 *   Do NOT modify `@/types` or `@/services/contracts` from this module.
 */

import type { VaccinationMilestone, VaccinationRecord } from "@/types"

const SCHEDULE_VERSION = "LK-EPI-2023-baseline-research-only"
const SOURCE_URL =
  "https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf"

// ---------------------------------------------------------------------------
// Helper: add calendar months to a date, respecting end-of-month (BR-01).
// ---------------------------------------------------------------------------
function addCalendarMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  let targetYear = y + Math.floor((m - 1 + months) / 12)
  let targetMonth = ((m - 1 + months) % 12) + 1
  // Clamp to last day of target month (BR-01 end-of-month rule).
  const maxDay = new Date(targetYear, targetMonth, 0).getDate()
  const targetDay = Math.min(d, maxDay)
  return [
    String(targetYear).padStart(4, "0"),
    String(targetMonth).padStart(2, "0"),
    String(targetDay).padStart(2, "0"),
  ].join("-")
}

// ---------------------------------------------------------------------------
// EPI schedule definitions (age in completed calendar months).
// 0 = birth window vaccines.
// ---------------------------------------------------------------------------
type ScheduleEntry = {
  vaccineCode: string
  vaccineName: string
  ageMonths: number | null
  birthWindow?: boolean
}

export const EPI_SCHEDULE_ENTRIES: ScheduleEntry[] = [
  {
    vaccineCode: "BCG",
    vaccineName: "BCG",
    ageMonths: null,
    birthWindow: true,
  },
  {
    vaccineCode: "PENTA1",
    vaccineName: "Pentavalent 1",
    ageMonths: 2,
  },
  {
    vaccineCode: "OPV1",
    vaccineName: "OPV 1",
    ageMonths: 2,
  },
  {
    vaccineCode: "fIPV1",
    vaccineName: "fIPV 1",
    ageMonths: 2,
  },
  {
    vaccineCode: "PENTA2",
    vaccineName: "Pentavalent 2",
    ageMonths: 4,
  },
  {
    vaccineCode: "OPV2",
    vaccineName: "OPV 2",
    ageMonths: 4,
  },
  {
    vaccineCode: "fIPV2",
    vaccineName: "fIPV 2",
    ageMonths: 4,
  },
  {
    vaccineCode: "PENTA3",
    vaccineName: "Pentavalent 3",
    ageMonths: 6,
  },
  {
    vaccineCode: "OPV3",
    vaccineName: "OPV 3",
    ageMonths: 6,
  },
  {
    vaccineCode: "MMR1",
    vaccineName: "MMR 1",
    ageMonths: 9,
  },
  {
    vaccineCode: "JE",
    vaccineName: "Japanese Encephalitis",
    ageMonths: 12,
  },
  {
    vaccineCode: "DTP_BOOST",
    vaccineName: "DTP Booster",
    ageMonths: 18,
  },
  {
    vaccineCode: "OPV4",
    vaccineName: "OPV 4",
    ageMonths: 18,
  },
  {
    vaccineCode: "MMR2",
    vaccineName: "MMR 2",
    ageMonths: 36,
  },
  {
    vaccineCode: "DT_BOOST",
    vaccineName: "DT Booster",
    ageMonths: 60,
  },
  {
    vaccineCode: "OPV5",
    vaccineName: "OPV 5",
    ageMonths: 60,
  },
]

/** Build a dated schedule from a child's date-of-birth string. */
export function buildSchedule(
  childId: string,
  dateOfBirth: string,
): VaccinationMilestone[] {
  return EPI_SCHEDULE_ENTRIES.map((entry, i) => {
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
      scheduleVersion: SCHEDULE_VERSION,
      sourceUrl: SOURCE_URL,
    }
  })
}

// ---------------------------------------------------------------------------
// Seeded fictional records — Nethmi (female, DOB 2025-04-15).
// Status: demo; not verified by any health worker.
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
