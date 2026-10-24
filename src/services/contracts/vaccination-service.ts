import type {
  AddReportedDoseInput,
  VaccinationMilestone,
  VaccinationRecord,
} from "@/types"

/**
 * Immunization boundary. A milestone due date, a reported dose, and a clinic
 * appointment stay separate. Throw AppError for expected failures.
 * `addReportedDose` must store `parent_reported` and must not mark a dose verified.
 */
export interface VaccinationService {
  getSchedule(childId: string): Promise<VaccinationMilestone[]>
  getRecords(childId: string): Promise<VaccinationRecord[]>
  addReportedDose(input: AddReportedDoseInput): Promise<VaccinationRecord>
}
