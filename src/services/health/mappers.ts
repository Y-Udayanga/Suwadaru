import { AppError } from "@/services/contracts"
import type {
  ClinicAppointment,
  GrowthMeasurement,
  RecordSource,
  VaccinationRecord,
} from "@/types"

export interface VaccinationRecordRow {
  id: string
  child_id: string
  vaccine_code: string
  administered_on: string
  source: string
  verified_by?: string | null
}

export interface GrowthMeasurementRow {
  id: string
  child_id: string
  measured_on: string
  weight_kg: number | string | null
  length_height_cm: number | string | null
  head_circumference_cm: number | string | null
  source: string
}

export interface ClinicAppointmentRow {
  id: string
  child_id: string
  scheduled_at: string
  clinic_name: string
  purpose: string | null
  status: string
}

export interface ChildAccessRow {
  id: string
  date_of_birth: string
  sex: string
}

const COLOMBO_OFFSET_MS = (5 * 60 + 30) * 60 * 1000
const OFFSET_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/

export function toVaccinationRecord(row: VaccinationRecordRow): VaccinationRecord {
  return {
    id: row.id,
    childId: row.child_id,
    vaccineCode: row.vaccine_code,
    administeredOn: asIsoDate(row.administered_on),
    source: asRecordSource(row.source),
    ...(row.verified_by ? { verifiedBy: row.verified_by } : {}),
  }
}

export function toGrowthMeasurement(row: GrowthMeasurementRow): GrowthMeasurement {
  return {
    id: row.id,
    childId: row.child_id,
    measuredOn: asIsoDate(row.measured_on),
    ...(optionalNumber(row.weight_kg) !== undefined
      ? { weightKg: optionalNumber(row.weight_kg) }
      : {}),
    ...(optionalNumber(row.length_height_cm) !== undefined
      ? { lengthHeightCm: optionalNumber(row.length_height_cm) }
      : {}),
    ...(optionalNumber(row.head_circumference_cm) !== undefined
      ? { headCircumferenceCm: optionalNumber(row.head_circumference_cm) }
      : {}),
    source: asRecordSource(row.source),
  }
}

export function toClinicAppointment(row: ClinicAppointmentRow): ClinicAppointment {
  if (
    row.status !== "scheduled" &&
    row.status !== "completed" &&
    row.status !== "cancelled"
  ) {
    throw new AppError("unavailable", "Stored appointment status was not recognized.")
  }
  return {
    id: row.id,
    childId: row.child_id,
    scheduledAt: toColomboIsoDateTime(row.scheduled_at),
    clinicName: row.clinic_name,
    ...(row.purpose ? { purpose: row.purpose } : {}),
    status: row.status,
  }
}

export function assertOffsetDateTime(value: string): string {
  if (!OFFSET_INSTANT.test(value) || Number.isNaN(Date.parse(value))) {
    throw new AppError(
      "validation",
      "Appointment time must be an ISO 8601 instant with an explicit offset.",
    )
  }
  return value
}

export function asIsoDate(value: string): string {
  return value.slice(0, 10)
}

export function optionalNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined
  const numeric = typeof value === "string" ? Number(value) : value
  if (!Number.isFinite(numeric)) return undefined
  return numeric
}

function asRecordSource(value: string): RecordSource {
  if (
    value === "demo" ||
    value === "parent_reported" ||
    value === "health_worker_verified"
  ) {
    return value
  }
  throw new AppError("unavailable", "Stored record source was not recognized.")
}

function toColomboIsoDateTime(value: string): string {
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) {
    throw new AppError("unavailable", "Stored appointment time could not be read.")
  }
  const shifted = new Date(instant.getTime() + COLOMBO_OFFSET_MS)
  const year = shifted.getUTCFullYear()
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0")
  const day = String(shifted.getUTCDate()).padStart(2, "0")
  const hour = String(shifted.getUTCHours()).padStart(2, "0")
  const minute = String(shifted.getUTCMinutes()).padStart(2, "0")
  const second = String(shifted.getUTCSeconds()).padStart(2, "0")
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`
}
