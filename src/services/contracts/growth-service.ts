import type {
  AddMeasurementInput,
  GrowthMeasurement,
  GrowthReferenceSeries,
} from "@/types"

/**
 * Growth boundary. Weights are kilograms and lengths are centimetres.
 * Throw AppError for expected failures. Reference series must name their
 * provenance and must not invent a clinical category.
 */
export interface GrowthService {
  list(childId: string): Promise<GrowthMeasurement[]>
  addMeasurement(input: AddMeasurementInput): Promise<GrowthMeasurement>
  getReferenceSeries(childId: string): Promise<GrowthReferenceSeries>
}
