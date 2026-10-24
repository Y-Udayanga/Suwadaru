import type { SupabaseClient } from "@supabase/supabase-js"
import { assessWeightForAge, officialWhoWeightForAgeDataset } from "@/domain/health/growth"
import type { WeightForAgeAssessment } from "@/domain/health/growth"
import { calendarDateInColombo, validateIsoDate } from "@/domain/health/vaccination"
import { AppError } from "@/services/contracts"
import type { AddMeasurementInput, GrowthMeasurement } from "@/types"
import { requireChild } from "./child-access.ts"
import {
  asIsoDate,
  optionalNumber,
  toGrowthMeasurement,
  type GrowthMeasurementRow,
} from "./mappers.ts"
import { throwHealthResult, throwSupabaseError } from "./supabase-error.ts"

const MEASUREMENT_COLUMNS =
  "id, child_id, measured_on, weight_kg, length_height_cm, head_circumference_cm, source"

export async function getGrowthMeasurements(
  supabase: SupabaseClient,
  childId: string,
): Promise<GrowthMeasurement[]> {
  const child = await requireChild(supabase, childId)
  const { data, error } = await supabase
    .from("growth_measurements")
    .select(MEASUREMENT_COLUMNS)
    .eq("child_id", child.id)
    .order("measured_on", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) throwSupabaseError(error)
  return ((data ?? []) as GrowthMeasurementRow[]).map(toGrowthMeasurement)
}

/** Append-only. The trigger stores source as parent_reported. */
export async function addGrowthMeasurement(
  supabase: SupabaseClient,
  input: AddMeasurementInput,
): Promise<GrowthMeasurement> {
  const child = await requireChild(supabase, input.childId)
  const measuredOn = checkedMeasurementDate(child.dateOfBirth, input.measuredOn)
  assertQuantities(input)

  const { data, error } = await supabase
    .from("growth_measurements")
    .insert({
      child_id: child.id,
      measured_on: measuredOn,
      weight_kg: input.weightKg ?? null,
      length_height_cm: input.lengthHeightCm ?? null,
      head_circumference_cm: input.headCircumferenceCm ?? null,
    })
    .select(MEASUREMENT_COLUMNS)
    .single()

  if (error) throwSupabaseError(error)
  return toGrowthMeasurement(data as GrowthMeasurementRow)
}

/**
 * Scores the latest stored kilogram weight with the WHO day table.
 * No weight returns interpretationAvailable false. This is not a diagnosis.
 */
export async function getGrowthAssessment(
  supabase: SupabaseClient,
  childId: string,
): Promise<WeightForAgeAssessment> {
  const child = await requireChild(supabase, childId)
  const { data, error } = await supabase
    .from("growth_measurements")
    .select(`${MEASUREMENT_COLUMNS}, created_at`)
    .eq("child_id", child.id)
    .order("measured_on", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throwSupabaseError(error)
  const rows = (data ?? []) as GrowthMeasurementRow[]
  const weighted = rows.find((row) => optionalNumber(row.weight_kg) !== undefined)
  const weightKg = weighted ? optionalNumber(weighted.weight_kg) : undefined
  const measuredOn = asIsoDate(
    (weighted ?? rows[0])?.measured_on ?? child.dateOfBirth,
  )

  return assessWeightForAge({
    sex: child.sex,
    dateOfBirth: child.dateOfBirth,
    measuredOn,
    today: calendarDateInColombo(new Date()),
    ...(weightKg !== undefined ? { weight: { value: weightKg, unit: "kg" as const } } : {}),
    referenceKind: "who_table",
    dataset: officialWhoWeightForAgeDataset(),
  })
}

function checkedMeasurementDate(dateOfBirth: string, measuredOn: string): string {
  const measured = validateIsoDate(measuredOn)
  if (!measured.ok) throwHealthResult(measured.error.code, measured.error.message)
  const born = validateIsoDate(dateOfBirth)
  if (!born.ok) throwHealthResult(born.error.code, born.error.message)
  const today = calendarDateInColombo(new Date())
  if (measured.value > today) {
    throw new AppError("validation", "Measurement date must not be in the future.")
  }
  if (measured.value < born.value) {
    throw new AppError(
      "validation",
      "Measurement date cannot be before the child's date of birth.",
    )
  }
  return measured.value
}

function assertQuantities(input: AddMeasurementInput): void {
  const quantities = [
    ["Weight", input.weightKg],
    ["Length or height", input.lengthHeightCm],
    ["Head circumference", input.headCircumferenceCm],
  ] as const
  const present = quantities.filter(([, value]) => value !== undefined)
  if (present.length === 0) {
    throw new AppError(
      "validation",
      "A measurement needs a weight, length, or head circumference.",
    )
  }
  for (const [label, value] of present) {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
      throw new AppError("validation", `${label} must be a positive finite number.`)
    }
  }
}
