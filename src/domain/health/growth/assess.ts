import { daysBetween, validateIsoDate } from "../vaccination/calendar.ts"
import { rowAtExactDay, sexTableFor } from "./dataset.ts"
import { lmsZScore } from "./lms.ts"
import type {
  AssessWeightForAgeInput,
  GrowthDataReason,
  WeightForAgeAssessment,
  WeightForAgeCurve,
  WeightForAgeReferenceAtAge,
  WhoDayRow,
} from "./types.ts"
import {
  PROFESSIONAL_GUIDANCE,
  SCORE_AVAILABLE_MESSAGE,
  SCORE_UNAVAILABLE_MESSAGE,
} from "./who-provenance.ts"

/**
 * Weight-for-age assessment from the official WHO day table.
 * Gemini is not called. Synthetic chart curves are not used as inputs.
 */
export function assessWeightForAge(
  input: AssessWeightForAgeInput,
): WeightForAgeAssessment {
  if (input.referenceKind === "synthetic_demo") {
    return unavailable(input, "synthetic_reference_cannot_be_scored")
  }
  if (!input.dataset) {
    return unavailable(input, "reference_dataset_missing")
  }

  const dateOfBirth = validateIsoDate(input.dateOfBirth)
  if (!dateOfBirth.ok) return unavailable(input, "invalid_date")
  const measuredOn = validateIsoDate(input.measuredOn)
  if (!measuredOn.ok) return unavailable(input, "invalid_date")
  const today = validateIsoDate(input.today)
  if (!today.ok) return unavailable(input, "invalid_date")
  if (measuredOn.value < dateOfBirth.value) {
    return unavailable(input, "measurement_before_birth")
  }
  if (measuredOn.value > today.value) {
    return unavailable(input, "measurement_in_future")
  }
  if (!input.weight) return unavailable(input, "measurement_missing_weight")
  if (input.weight.unit !== "kg") return unavailable(input, "invalid_unit")
  if (!Number.isFinite(input.weight.value) || input.weight.value <= 0) {
    return unavailable(input, "invalid_weight")
  }

  const ageDays = daysBetween(dateOfBirth.value, measuredOn.value)
  const row = rowAtExactDay(sexTableFor(input.dataset, input.sex), ageDays)
  if (!row) return unavailable(input, "unsupported_age")

  const zScore = lmsZScore(input.weight.value, row.l, row.m, row.s)
  if (zScore === null || !Number.isFinite(zScore)) {
    return unavailable(input, "invalid_weight")
  }

  return {
    indicator: "weight_for_age",
    sex: input.sex,
    interpretationAvailable: true,
    reason: null,
    objective: {
      ageDays,
      weightKg: input.weight.value,
      zScore,
      l: row.l,
      m: row.m,
      s: row.s,
    },
    referenceAtAge: curvePoint(row),
    interpretation: {
      clinicalCategory: "not_assessed",
      message: SCORE_AVAILABLE_MESSAGE,
      professionalGuidance: PROFESSIONAL_GUIDANCE,
    },
    provenance: input.dataset.provenance,
  }
}

/** Published −2, −1, median, +1, and +2 SD weights for every day in the table. */
export function weightForAgeReferenceCurve(
  input: Pick<AssessWeightForAgeInput, "dataset" | "sex">,
): WeightForAgeCurve | null {
  if (!input.dataset) return null
  const table = sexTableFor(input.dataset, input.sex)
  return {
    sex: input.sex,
    provenance: input.dataset.provenance,
    points: table.rows.map(curvePoint),
  }
}

function curvePoint(row: WhoDayRow): WeightForAgeReferenceAtAge {
  return {
    ageDays: row.ageDays,
    sdMinus2Kg: row.sdMinus2Kg,
    sdMinus1Kg: row.sdMinus1Kg,
    medianKg: row.medianKg,
    sdPlus1Kg: row.sdPlus1Kg,
    sdPlus2Kg: row.sdPlus2Kg,
  }
}

function unavailable(
  input: AssessWeightForAgeInput,
  reason: GrowthDataReason,
): WeightForAgeAssessment {
  return {
    indicator: "weight_for_age",
    sex: input.sex,
    interpretationAvailable: false,
    reason,
    objective: null,
    referenceAtAge: null,
    interpretation: {
      clinicalCategory: "not_assessed",
      message: SCORE_UNAVAILABLE_MESSAGE,
      professionalGuidance: PROFESSIONAL_GUIDANCE,
    },
    provenance: input.dataset?.provenance ?? null,
  }
}
