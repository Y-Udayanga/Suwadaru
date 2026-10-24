import type { IsoDate, RecordSource } from "./common"

export type VaccinationStatus =
  | "upcoming"
  | "due"
  | "overdue"
  | "completed_unverified"
  | "completed_verified"

/**
 * A scheduled milestone. This is not evidence that a vaccine was given.
 * `dueDate` is calculated from the child's birthday and the schedule version.
 */
export interface VaccinationMilestone {
  id: string
  vaccineCode: string
  vaccineName: string
  /** Age in completed calendar months. Null when the milestone is a birth window. */
  ageMonths: number | null
  birthWindow?: boolean
  /** ISO 8601 date-only (`YYYY-MM-DD`). */
  dueDate: IsoDate
  scheduleVersion: string
  sourceUrl: string
}

/**
 * A reported dose. `administeredOn` is separate from the milestone due date
 * and from any clinic appointment.
 */
export interface VaccinationRecord {
  id: string
  childId: string
  vaccineCode: string
  /** ISO 8601 date-only, or null when no dose date has been reported. */
  administeredOn: IsoDate | null
  source: RecordSource
  /** Future health-worker identity. F0 must leave this unset. */
  verifiedBy?: string
}

export interface AddReportedDoseInput {
  childId: string
  vaccineCode: string
  /** Date the caregiver reports. Adapters store this as parent_reported. */
  administeredOn: IsoDate
}
