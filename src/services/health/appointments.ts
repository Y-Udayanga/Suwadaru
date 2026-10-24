import type { SupabaseClient } from "@supabase/supabase-js"
import { AppError } from "@/services/contracts"
import type {
  ClinicAppointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "@/types"
import { requireChild } from "./child-access.ts"
import {
  assertOffsetDateTime,
  toClinicAppointment,
  type ClinicAppointmentRow,
} from "./mappers.ts"
import { assertUuid, throwSupabaseError } from "./supabase-error.ts"

const APPOINTMENT_COLUMNS =
  "id, child_id, scheduled_at, clinic_name, purpose, status"

export async function getClinicAppointments(
  supabase: SupabaseClient,
  childId: string,
): Promise<ClinicAppointment[]> {
  const child = await requireChild(supabase, childId)
  const { data, error } = await supabase
    .from("clinic_appointments")
    .select(APPOINTMENT_COLUMNS)
    .eq("child_id", child.id)
    .order("scheduled_at", { ascending: true })

  if (error) throwSupabaseError(error)
  return ((data ?? []) as ClinicAppointmentRow[]).map(toClinicAppointment)
}

export async function createClinicAppointment(
  supabase: SupabaseClient,
  input: CreateAppointmentInput,
): Promise<ClinicAppointment> {
  const child = await requireChild(supabase, input.childId)
  const scheduledAt = assertOffsetDateTime(input.scheduledAt)
  const clinicName = requiredText(input.clinicName, "Clinic name")
  const row: Record<string, string | null> = {
    child_id: child.id,
    scheduled_at: scheduledAt,
    clinic_name: clinicName,
  }
  if (input.purpose !== undefined) row.purpose = requiredText(input.purpose, "Purpose")

  const { data, error } = await supabase
    .from("clinic_appointments")
    .insert(row)
    .select(APPOINTMENT_COLUMNS)
    .single()

  if (error) throwSupabaseError(error)
  return toClinicAppointment(data as ClinicAppointmentRow)
}

export async function updateClinicAppointment(
  supabase: SupabaseClient,
  appointmentId: string,
  input: UpdateAppointmentInput,
): Promise<ClinicAppointment> {
  assertUuid(appointmentId, "Appointment id")
  const patch: Record<string, string> = {}
  if (input.scheduledAt !== undefined) {
    patch.scheduled_at = assertOffsetDateTime(input.scheduledAt)
  }
  if (input.clinicName !== undefined) {
    patch.clinic_name = requiredText(input.clinicName, "Clinic name")
  }
  if (input.purpose !== undefined) {
    patch.purpose = requiredText(input.purpose, "Purpose")
  }
  if (input.status !== undefined) patch.status = input.status
  if (Object.keys(patch).length === 0) {
    throw new AppError("validation", "No appointment changes were provided.")
  }

  return writeAppointment(supabase, appointmentId, patch)
}

export async function cancelClinicAppointment(
  supabase: SupabaseClient,
  appointmentId: string,
): Promise<ClinicAppointment> {
  assertUuid(appointmentId, "Appointment id")
  return writeAppointment(supabase, appointmentId, { status: "cancelled" })
}

async function writeAppointment(
  supabase: SupabaseClient,
  appointmentId: string,
  patch: Record<string, string>,
): Promise<ClinicAppointment> {
  const { data, error } = await supabase
    .from("clinic_appointments")
    .update(patch)
    .eq("id", appointmentId)
    .select(APPOINTMENT_COLUMNS)
    .maybeSingle()

  if (error) throwSupabaseError(error)
  if (!data) throw new AppError("not_found", "The appointment was not found.")
  return toClinicAppointment(data as ClinicAppointmentRow)
}

function requiredText(value: string, label: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new AppError("validation", `${label} is required.`)
  return trimmed
}
