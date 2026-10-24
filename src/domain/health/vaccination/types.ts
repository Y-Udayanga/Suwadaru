import type { IsoDate, RecordSource } from "../../../types/common.ts"
import type {
  VaccinationMilestone,
  VaccinationRecord,
  VaccinationStatus,
} from "../../../types/vaccination.ts"

/**
 * Engine status.
 * `needs_verification` is a parent-reported or demo administration.
 * `completed` is only a health-worker-verified administration.
 * These map onto the shared `VaccinationStatus` names the UI already uses.
 */
export type EngineDoseStatus =
  | "upcoming"
  | "due"
  | "overdue"
  | "needs_verification"
  | "completed"

/**
 * Age rule for one dose. The engine turns this into a due date.
 * No calendar date is stored on the schedule definition.
 */
export type ScheduledAge =
  | { kind: "birth_window"; completedMonths: null }
  | { kind: "completed_months"; completedMonths: number }

export interface ScheduleDoseDefinition {
  vaccineCode: string
  /** Short dose label, such as "Penta 1". */
  doseName: string
  vaccineName: string
  scheduledAge: ScheduledAge
}

/**
 * Provenance for a schedule definition.
 * The shipped configuration uses the literal labels below so a caller cannot
 * describe it as clinically approved without changing this type.
 */
export interface ScheduleProvenance {
  scheduleVersion: string
  sourceName: string
  sourceUrl: string
  /** Set only after a named reviewer checks the rows against the source. */
  validatedOn: IsoDate | null
  /** Set only when the effective circular date is known. A publication year is not enough. */
  effectiveDate: IsoDate | null
  /** Year cited by the BRD for the research PDF. Not an effective date. */
  citedPublicationYear: number | null
  usageLabel: "DEMONSTRATION_ONLY"
  endorsement: "none"
  reviewStatus: "unreviewed_research_baseline"
  disclaimer: string
}

export interface ScheduleDefinitionSet {
  provenance: ScheduleProvenance
  doses: readonly ScheduleDoseDefinition[]
}

/** A recorded administration matched to one scheduled dose. Not a clinic appointment. */
export interface AdministeredMatch {
  recordId: string
  administeredOn: IsoDate
  source: RecordSource
  verifiedBy?: string
}

/**
 * One calculated dose for one child.
 * `dueDate` is the milestone date. It is not `administeredOn` and not an appointment time.
 */
export interface ScheduledDose {
  id: string
  childId: string
  vaccineCode: string
  doseName: string
  vaccineName: string
  scheduledAge: ScheduledAge
  dueDate: IsoDate
  scheduleVersion: string
  sourceUrl: string
  usageLabel: "DEMONSTRATION_ONLY"
  endorsement: "none"
  status: EngineDoseStatus
  /** Shared UI status for the same facts. */
  sharedStatus: VaccinationStatus
  administration: AdministeredMatch | null
}

export interface ChildVaccinationSchedule {
  childId: string
  dateOfBirth: IsoDate
  scheduleVersion: string
  sourceName: string
  sourceUrl: string
  validatedOn: IsoDate | null
  effectiveDate: IsoDate | null
  usageLabel: "DEMONSTRATION_ONLY"
  endorsement: "none"
  reviewStatus: "unreviewed_research_baseline"
  disclaimer: string
  /** True only when every dose was calculated, never when a schedule is officially approved. */
  clinicallyApproved: false
  doses: readonly ScheduledDose[]
  /** Records that did not match a scheduled dose for this child. */
  unmatchedRecords: readonly VaccinationRecord[]
}

export interface BuildScheduleInput {
  childId: string
  dateOfBirth: IsoDate
  /** Calendar date used for future-birth checks. Pass Colombo's date in production. */
  today: IsoDate
  schedule: ScheduleDefinitionSet
}

export interface BuildChildScheduleInput extends BuildScheduleInput {
  records: readonly VaccinationRecord[]
  /**
   * Days before the due date, including the due date, that display as `due`.
   * This is a SuwaDaru presentation window, not an Epidemiology Unit rule.
   * The current health screen uses 14.
   */
  dueWindowDays?: number
}

/** Milestone shape already consumed by the vaccination page. */
export type { VaccinationMilestone, VaccinationRecord, VaccinationStatus }
