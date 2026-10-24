import type { SupabaseClient } from "@supabase/supabase-js"
import {
  buildVaccinationSchedule,
  calendarDateInColombo,
  getDemonstrationEpiSchedule,
  validateReportedDose,
} from "@/domain/health/vaccination"
import { AppError } from "@/services/contracts"
import type { AddReportedDoseInput, VaccinationMilestone, VaccinationRecord } from "@/types"
import { requireChild } from "./child-access.ts"
import { toVaccinationRecord, type VaccinationRecordRow } from "./mappers.ts"
import { assertUuid, throwHealthResult, throwSupabaseError } from "./supabase-error.ts"

const RECORD_COLUMNS =
  "id, child_id, vaccine_code, administered_on, source, verified_by"

/**
 * Calculated demonstration milestones for a child the caregiver can read.
 * Due dates come from the vaccination engine. They are not stored.
 */
export async function getVaccineSchedule(
  supabase: SupabaseClient,
  childId: string,
): Promise<VaccinationMilestone[]> {
  const child = await requireChild(supabase, childId)
  const built = buildVaccinationSchedule({
    childId: child.id,
    dateOfBirth: child.dateOfBirth,
    today: calendarDateInColombo(new Date()),
    schedule: getDemonstrationEpiSchedule(),
  })
  if (!built.ok) throwHealthResult(built.error.code, built.error.message)
  return [...built.value]
}

/** Saved administrations. An empty list means none are stored, not that the child is hidden. */
export async function getVaccinationRecords(
  supabase: SupabaseClient,
  childId: string,
): Promise<VaccinationRecord[]> {
  const child = await requireChild(supabase, childId)
  const { data, error } = await supabase
    .from("vaccination_records")
    .select(RECORD_COLUMNS)
    .eq("child_id", child.id)
    .order("administered_on", { ascending: true })

  if (error) throwSupabaseError(error)
  return ((data ?? []) as VaccinationRecordRow[]).map(toVaccinationRecord)
}

/**
 * Stores a caregiver report. The database trigger keeps source as parent_reported
 * and verified_by empty. A second dose for the same code must be an update.
 */
export async function addVaccinationRecord(
  supabase: SupabaseClient,
  input: AddReportedDoseInput,
): Promise<VaccinationRecord> {
  const child = await requireChild(supabase, input.childId)
  const checked = checkedDose(child.dateOfBirth, input.vaccineCode, input.administeredOn)
  const { data, error } = await supabase
    .from("vaccination_records")
    .insert({
      child_id: child.id,
      vaccine_code: input.vaccineCode,
      administered_on: checked.administeredOn,
    })
    .select(RECORD_COLUMNS)
    .single()

  if (error) throwSupabaseError(error)
  return toVaccinationRecord(data as VaccinationRecordRow)
}

export async function updateVaccinationRecord(
  supabase: SupabaseClient,
  recordId: string,
  input: { administeredOn: string },
): Promise<VaccinationRecord> {
  assertUuid(recordId, "Vaccination record id")
  const existing = await loadVaccinationRecord(supabase, recordId)
  const child = await requireChild(supabase, existing.child_id)
  const checked = checkedDose(child.dateOfBirth, existing.vaccine_code, input.administeredOn)
  const { data, error } = await supabase
    .from("vaccination_records")
    .update({ administered_on: checked.administeredOn })
    .eq("id", recordId)
    .select(RECORD_COLUMNS)
    .maybeSingle()

  if (error) throwSupabaseError(error)
  if (!data) throw new AppError("not_found", "The vaccination record was not found.")
  return toVaccinationRecord(data as VaccinationRecordRow)
}

function checkedDose(dateOfBirth: string, vaccineCode: string, administeredOn: string) {
  const schedule = getDemonstrationEpiSchedule()
  const checked = validateReportedDose({
    dateOfBirth,
    vaccineCode,
    administeredOn,
    knownVaccineCodes: schedule.doses.map((dose) => dose.vaccineCode),
    today: calendarDateInColombo(new Date()),
  })
  if (!checked.ok) throwHealthResult(checked.error.code, checked.error.message)
  return checked.value
}

async function loadVaccinationRecord(
  supabase: SupabaseClient,
  recordId: string,
): Promise<VaccinationRecordRow> {
  const { data, error } = await supabase
    .from("vaccination_records")
    .select(RECORD_COLUMNS)
    .eq("id", recordId)
    .maybeSingle()

  if (error) throwSupabaseError(error)
  if (!data) throw new AppError("not_found", "The vaccination record was not found.")
  return data as VaccinationRecordRow
}
