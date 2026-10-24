import type {
  Centimetres,
  ChildSex,
  IsoDate,
  Kilograms,
  RecordSource,
} from "./common"

/** One plotted measurement. Quantities are numbers with explicit units. */
export interface GrowthMeasurement {
  id: string
  childId: string
  /** ISO 8601 date-only (`YYYY-MM-DD`). Must not be in the future. */
  measuredOn: IsoDate
  /** Weight in kilograms. */
  weightKg?: Kilograms
  /** Length or height in centimetres. */
  lengthHeightCm?: Centimetres
  /** Head circumference in centimetres. */
  headCircumferenceCm?: Centimetres
  source: RecordSource
}

export interface AddMeasurementInput {
  childId: string
  measuredOn: IsoDate
  weightKg?: Kilograms
  lengthHeightCm?: Centimetres
  headCircumferenceCm?: Centimetres
}

/** Weight-for-age reference point. All weights are kilograms. */
export interface GrowthReferencePoint {
  ageMonths: number
  sdMinus2Kg: Kilograms
  sdMinus1Kg: Kilograms
  medianKg: Kilograms
  sdPlus1Kg: Kilograms
  sdPlus2Kg: Kilograms
}

/**
 * Reference curves for a chart. `provenance` must be `synthetic_demo` unless
 * the series is loaded from a pinned official WHO table. Clinical status stays
 * `not_assessed` until a validated calculation exists.
 */
export interface GrowthReferenceSeries {
  childId: string
  indicator: "weight_for_age"
  sex: ChildSex
  provenance: "who" | "synthetic_demo"
  sourceLabel: string
  sourceVersion: string
  clinicalStatus: "not_assessed"
  points: GrowthReferencePoint[]
}
