import type { ScheduleDefinitionSet, ScheduleDoseDefinition } from "../../src/domain/health/vaccination/types.ts"

/**
 * Research baseline for software tests.
 *
 * The ages below follow the illustrative list in BRD §7.3 and the same codes
 * already used by `src/features/vaccinations/scheduleConfig.ts`. They are
 * completed calendar months (or a birth window), not calendar dates.
 *
 * This file does not record that those rows were checked against the
 * Epidemiology Unit PDF. `validatedOn` and `effectiveDate` stay null.
 * `usageLabel` is DEMONSTRATION_ONLY. `endorsement` is none.
 *
 * Source to verify before any non-demo use:
 * Epidemiology Unit, Ministry of Health, Sri Lanka.
 * https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf
 */

export const DEMONSTRATION_SCHEDULE_VERSION =
  "LK-EPI-2023.v1-demonstration" as const

export const EPI_SOURCE_NAME =
  "Epidemiology Unit, Ministry of Health, Sri Lanka" as const

export const EPI_SOURCE_URL =
  "https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf" as const

export const DEMONSTRATION_DISCLAIMER =
  "DEMONSTRATION_ONLY. Unverified research baseline for software tests. Not a clinically approved or current national immunization schedule. Verify the latest Epidemiology Unit circular before any clinical use."

const DOSES: readonly ScheduleDoseDefinition[] = [
  dose("BCG", "BCG", "BCG (Bacillus Calmette–Guérin)", { kind: "birth_window", completedMonths: null }),
  dose("PENTA1", "Penta 1", "Pentavalent 1 (DTP-HepB-Hib)", months(2)),
  dose("OPV1", "OPV 1", "Oral Polio Vaccine 1 (bOPV)", months(2)),
  dose("fIPV1", "fIPV 1", "fractional Inactivated Polio Vaccine 1 (fIPV)", months(2)),
  dose("PENTA2", "Penta 2", "Pentavalent 2 (DTP-HepB-Hib)", months(4)),
  dose("OPV2", "OPV 2", "Oral Polio Vaccine 2 (bOPV)", months(4)),
  dose("fIPV2", "fIPV 2", "fractional Inactivated Polio Vaccine 2 (fIPV)", months(4)),
  dose("PENTA3", "Penta 3", "Pentavalent 3 (DTP-HepB-Hib)", months(6)),
  dose("OPV3", "OPV 3", "Oral Polio Vaccine 3 (bOPV)", months(6)),
  dose("MMR1", "MMR 1", "Measles, Mumps, Rubella 1 (MMR)", months(9)),
  dose("JE", "JE", "Japanese Encephalitis (Live Attenuated)", months(12)),
  dose("DTP_BOOST", "DTP Boost", "DTP Booster", months(18)),
  dose("OPV4", "OPV 4", "Oral Polio Vaccine 4 (bOPV)", months(18)),
  dose("MMR2", "MMR 2", "Measles, Mumps, Rubella 2 (MMR)", months(36)),
  dose("DT_BOOST", "DT Boost", "DT Booster (School Entry)", months(60)),
  dose("OPV5", "OPV 5", "Oral Polio Vaccine 5 (bOPV)", months(60)),
]

function months(completedMonths: number): ScheduleDoseDefinition["scheduledAge"] {
  return { kind: "completed_months", completedMonths }
}

function dose(
  vaccineCode: string,
  doseName: string,
  vaccineName: string,
  scheduledAge: ScheduleDoseDefinition["scheduledAge"],
): ScheduleDoseDefinition {
  return { vaccineCode, doseName, vaccineName, scheduledAge }
}

export function getDemonstrationEpiSchedule(): ScheduleDefinitionSet {
  return {
    provenance: {
      scheduleVersion: DEMONSTRATION_SCHEDULE_VERSION,
      sourceName: EPI_SOURCE_NAME,
      sourceUrl: EPI_SOURCE_URL,
      validatedOn: null,
      effectiveDate: null,
      citedPublicationYear: 2023,
      usageLabel: "DEMONSTRATION_ONLY",
      endorsement: "none",
      reviewStatus: "unreviewed_research_baseline",
      disclaimer: DEMONSTRATION_DISCLAIMER,
    },
    doses: DOSES,
  }
}
