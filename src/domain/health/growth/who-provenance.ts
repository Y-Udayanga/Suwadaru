import type { WhoWeightForAgeProvenance } from "./types.ts"

/**
 * Workbooks retrieved on 2026-10-24 from the WHO weight-for-age page.
 * The bytes live beside this module. Checksums are of those files.
 * Retrieval is not a clinical review and is not WHO endorsement of SuwaDaru.
 */
export const WHO_WFA_PROVENANCE: WhoWeightForAgeProvenance = {
  indicator: "weight_for_age",
  sourceName: "World Health Organization",
  sourceTitle:
    "WHO Child Growth Standards, weight-for-age z-scores, expanded tables, birth to 5 years",
  sourcePageUrl:
    "https://www.who.int/tools/child-growth-standards/standards/weight-for-age",
  ageUnit: "completed_days",
  ageMinDays: 0,
  ageMaxDays: 1856,
  method: "lms_exact_completed_day",
  interpolation: "none",
  endorsement: "none",
  clinicallyApproved: false,
  files: [
    {
      sex: "male",
      fileName: "wfa-boys-zscore-expanded-tables.xlsx",
      sourceUrl:
        "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-boys-zscore-expanded-tables.xlsx",
      sha256: "b5b4748c6bfa5230e2eddafa1767629c349178b08d457f400b59422b8bfef86c",
      retrievedOn: "2026-10-24",
    },
    {
      sex: "female",
      fileName: "wfa-girls-zscore-expanded-tables.xlsx",
      sourceUrl:
        "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-girls-zscore-expanded-tables.xlsx",
      sha256: "ee3ae12cb96c6c5541cdf43665c03ce6c984f877859a183a5f6104eb06a49a6e",
      retrievedOn: "2026-10-24",
    },
  ],
}

export const PROFESSIONAL_GUIDANCE =
  "Discuss concerning results with a qualified healthcare professional, such as a Public Health Midwife or doctor. Weight-for-age alone does not diagnose malnutrition, overweight, or any other condition."

export const SCORE_UNAVAILABLE_MESSAGE =
  "A weight-for-age z-score was not calculated. The figure below is not a growth assessment."

export const SCORE_AVAILABLE_MESSAGE =
  "The z-score is an objective comparison with the WHO Child Growth Standards table for this sex and completed day. It is not a diagnosis."
