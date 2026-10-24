/**
 * Vaccination status computation utility for Frontend B.
 *
 * Determines `VaccinationStatus` by comparing the milestone due date with
 * today and with any recorded dose. This logic is pure and independent of
 * any service or component.
 *
 * Rules (BRD FR-022, BR-02):
 *   - completed_verified: reserved for future health-worker flow; F0 never sets it.
 *   - completed_unverified: a parent_reported record exists for this vaccineCode.
 *   - overdue: dueDate is past today and no record exists.
 *   - due: dueDate is today or within the next 14 days.
 *   - upcoming: dueDate is more than 14 days from now.
 */

import type { VaccinationMilestone, VaccinationRecord, VaccinationStatus } from "@/types"

const DUE_WINDOW_DAYS = 14

export function computeVaccinationStatus(
  milestone: VaccinationMilestone,
  records: VaccinationRecord[],
  today: string = new Date().toISOString().slice(0, 10),
): VaccinationStatus {
  // Check if a record exists for this vaccineCode (regardless of who entered it).
  const record = records.find(
    (r) => r.vaccineCode === milestone.vaccineCode && r.administeredOn !== null,
  )
  if (record) {
    // B1 will check record.source === 'health_worker_verified'; F0 never does.
    return record.source === "health_worker_verified"
      ? "completed_verified"
      : "completed_unverified"
  }

  const due = milestone.dueDate
  if (due < today) return "overdue"

  // Days until due.
  const todayMs = new Date(today).getTime()
  const dueMs = new Date(due).getTime()
  const daysUntilDue = Math.round((dueMs - todayMs) / 86_400_000)
  return daysUntilDue <= DUE_WINDOW_DAYS ? "due" : "upcoming"
}

export const STATUS_LABELS: Record<VaccinationStatus, string> = {
  upcoming: "Upcoming",
  due: "Due soon",
  overdue: "Overdue",
  completed_unverified: "Recorded (unverified)",
  completed_verified: "Verified",
}

export const STATUS_COLORS: Record<VaccinationStatus, string> = {
  upcoming: "text-muted-foreground",
  due: "text-[#B45309]",            // amber — due attention
  overdue: "text-[#E27D72]",        // coral (brand warning color)
  completed_unverified: "text-[#0F766E]",  // teal
  completed_verified: "text-[#166534]",    // darker green (future)
}

export const STATUS_BG: Record<VaccinationStatus, string> = {
  upcoming: "bg-muted text-muted-foreground",
  due: "bg-amber-50 text-amber-800 border-amber-200",
  overdue: "bg-[#FFF1F0] text-[#E27D72] border-[#FECDCA]",
  completed_unverified: "bg-[#E8F7F3] text-[#0F766E] border-[#A7F3D0]",
  completed_verified: "bg-green-50 text-green-800 border-green-200",
}
