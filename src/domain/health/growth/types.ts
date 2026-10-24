import type { ChildSex, IsoDate, Kilograms } from "../../../types/common.ts"

/** Weight-for-age only. Other WHO indicators are not scored here. */
export type GrowthIndicator = "weight_for_age"

export type WeightUnit = "kg" | "g" | "lb" | "oz"

export type GrowthDataReason =
  | "reference_dataset_missing"
  | "source_checksum_mismatch"
  | "measurement_missing_weight"
  | "measurement_before_birth"
  | "measurement_in_future"
  | "invalid_date"
  | "invalid_weight"
  | "invalid_unit"
  | "unsupported_age"
  | "synthetic_reference_cannot_be_scored"

export interface WeightInput {
  value: number
  /** Only kilograms are accepted. Other units are rejected and not converted. */
  unit: WeightUnit
}

/**
 * Objective LMS result. These numbers are not a diagnosis.
 * `clinicalCategory` stays `not_assessed` in the interpretation object.
 */
export interface WeightForAgeObjective {
  ageDays: number
  weightKg: Kilograms
  /** LMS z-score at the exact completed day. Not a malnutrition class. */
  zScore: number
  l: number
  m: number
  s: number
}

/** Published WHO SD columns at one exact day. Not values recomputed by this module. */
export interface WeightForAgeReferenceAtAge {
  ageDays: number
  sdMinus2Kg: Kilograms
  sdMinus1Kg: Kilograms
  medianKg: Kilograms
  sdPlus1Kg: Kilograms
  sdPlus2Kg: Kilograms
}

export interface GrowthInterpretation {
  clinicalCategory: "not_assessed"
  /** Separated from the z-score. It does not assign a diagnosis. */
  message: string
  professionalGuidance: string
}

export interface WhoDatasetFile {
  sex: ChildSex
  fileName: string
  sourceUrl: string
  sha256: string
  retrievedOn: IsoDate
}

export interface WhoWeightForAgeProvenance {
  indicator: GrowthIndicator
  sourceName: "World Health Organization"
  sourceTitle: string
  sourcePageUrl: string
  ageUnit: "completed_days"
  ageMinDays: 0
  ageMaxDays: 1856
  method: "lms_exact_completed_day"
  interpolation: "none"
  files: readonly WhoDatasetFile[]
  endorsement: "none"
  clinicallyApproved: false
}

export interface WeightForAgeAssessment {
  indicator: GrowthIndicator
  sex: ChildSex | null
  /**
   * True only when a z-score was calculated from the official day table.
   * False when the dataset, age, weight, or unit cannot support that calculation.
   */
  interpretationAvailable: boolean
  reason: GrowthDataReason | null
  objective: WeightForAgeObjective | null
  referenceAtAge: WeightForAgeReferenceAtAge | null
  interpretation: GrowthInterpretation
  provenance: WhoWeightForAgeProvenance | null
}

export interface WhoDayRow {
  ageDays: number
  l: number
  m: number
  s: number
  sdMinus2Kg: number
  sdMinus1Kg: number
  medianKg: number
  sdPlus1Kg: number
  sdPlus2Kg: number
}

export interface WhoSexTable {
  sex: ChildSex
  rows: readonly WhoDayRow[]
}

export interface WhoWeightForAgeDataset {
  provenance: WhoWeightForAgeProvenance
  male: WhoSexTable
  female: WhoSexTable
}

export interface WeightForAgeCurve {
  sex: ChildSex
  provenance: WhoWeightForAgeProvenance
  /** One published point per completed day from 0 through 1856. No interpolated days. */
  points: readonly WeightForAgeReferenceAtAge[]
}

export interface AssessWeightForAgeInput {
  sex: ChildSex
  dateOfBirth: IsoDate
  measuredOn: IsoDate
  /** Calendar date used to reject a future measurement. */
  today: IsoDate
  weight?: WeightInput
  /**
   * Pass `synthetic_demo` to refuse scoring. The engine never reads the
   * frontend demonstration curves.
   */
  referenceKind?: "who_table" | "synthetic_demo"
  /** `null` means the official files were not supplied. */
  dataset: WhoWeightForAgeDataset | null
}
