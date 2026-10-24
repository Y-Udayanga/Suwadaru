/**
 * Pure vaccination status computation and presentation helper for Frontend B.
 *
 * Rules (BRD FR-022, BR-02, BR-03):
 *   - completed_verified: reserved for future health-worker flow; F0 never sets it.
 *   - completed_unverified: a parent_reported (or demo) record exists.
 *   - overdue: dueDate is past today and no record exists.
 *   - due: dueDate is today or within the next 14 days.
 *   - upcoming: dueDate is more than 14 days from now.
 *
 * ACCESSIBILITY & DESIGN (BRD §12, NFR-05):
 *   Statuses must NEVER be conveyed by color alone. Every badge pairs a unique
 *   semantic icon, explicit readable status text, and assistive aria text.
 */

import type {
  VaccinationMilestone,
  VaccinationRecord,
  VaccinationStatus,
} from "@/types"

export const DUE_WINDOW_DAYS = 14

export function computeVaccinationStatus(
  milestone: VaccinationMilestone,
  records: VaccinationRecord[],
  today: string = new Date().toISOString().slice(0, 10),
): VaccinationStatus {
  // Check if a record exists for this vaccineCode
  const record = records.find(
    (r) => r.vaccineCode === milestone.vaccineCode && r.administeredOn !== null,
  )
  if (record) {
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
  completed_unverified: "Reported (unverified)",
  completed_verified: "Verified by clinic",
}

export const STATUS_ACCESSIBILITY_DESCRIPTIONS: Record<VaccinationStatus, string> = {
  upcoming: "Scheduled for a future milestone date. No immediate action required.",
  due: "Due within the next 14 days. Recommended to plan a clinic visit.",
  overdue: "Past the scheduled milestone date with no reported record. Contact PHM or MOH clinic.",
  completed_unverified: "Parent-reported dose. Self-reported records are not clinically verified.",
  completed_verified: "Clinically verified by authorized healthcare personnel.",
}

export const STATUS_BADGE_CLASSES: Record<VaccinationStatus, string> = {
  upcoming: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  due: "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800",
  overdue: "bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800",
  completed_unverified: "bg-teal-50 text-teal-900 border-teal-300 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800",
  completed_verified: "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800",
}

export type StatusFilterKey = "all" | "due_overdue" | "upcoming" | "reported"

export function matchesFilter(
  status: VaccinationStatus,
  filter: StatusFilterKey,
): boolean {
  switch (filter) {
    case "all":
      return true
    case "due_overdue":
      return status === "due" || status === "overdue"
    case "upcoming":
      return status === "upcoming"
    case "reported":
      return status === "completed_unverified" || status === "completed_verified"
  }
}

export interface VaccinationSummary {
  readonly total: number
  readonly completed: number
  readonly due: number
  readonly overdue: number
  readonly upcoming: number
  readonly progressPercentage: number
  readonly nextMilestone: VaccinationMilestone | null
  readonly nextMilestoneStatus: VaccinationStatus | null
}

export function computeScheduleSummary(
  milestones: VaccinationMilestone[],
  records: VaccinationRecord[],
  today: string,
): VaccinationSummary {
  let completed = 0
  let due = 0
  let overdue = 0
  let upcoming = 0

  let nextMilestone: VaccinationMilestone | null = null
  let nextMilestoneStatus: VaccinationStatus | null = null

  // Process in chronological order
  for (const m of milestones) {
    const status = computeVaccinationStatus(m, records, today)
    if (status === "completed_unverified" || status === "completed_verified") {
      completed++
    } else if (status === "overdue") {
      overdue++
      if (!nextMilestone) {
        nextMilestone = m
        nextMilestoneStatus = status
      }
    } else if (status === "due") {
      due++
      if (!nextMilestone || nextMilestoneStatus === "upcoming") {
        nextMilestone = m
        nextMilestoneStatus = status
      }
    } else if (status === "upcoming") {
      upcoming++
      if (!nextMilestone) {
        nextMilestone = m
        nextMilestoneStatus = status
      }
    }
  }

  const total = milestones.length
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    due,
    overdue,
    upcoming,
    progressPercentage,
    nextMilestone,
    nextMilestoneStatus,
  }
}
