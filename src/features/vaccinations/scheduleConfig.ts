/**
 * Versioned Sri Lanka National Immunization Schedule (EPI) Configuration.
 *
 * SOURCING & GOVERNANCE (BRD §7.3, FR-020, FR-023, NFR-09, R-01):
 *   Baseline: Published 2023 Sri Lanka National Immunization Schedule PDF.
 *   Source: https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf
 *   Attribution: Epidemiology Unit, Ministry of Health, Sri Lanka.
 *
 * SAFETY DISCLAIMER (MANDATORY LABEL):
 *   "For demonstration — verify the latest official EPI schedule before clinical use"
 *   This file serves as a software engineering baseline. It is versioned and
 *   swappable, and MUST NOT be treated as timeless clinical truth or a replacement
 *   for clinical circulars issued by the Ministry of Health.
 */

export interface ScheduleMetadata {
  readonly scheduleId: string
  readonly version: string
  readonly title: string
  readonly effectiveYear: number
  readonly lastReviewedDate: string
  readonly mandatoryDisclaimer: string
  readonly sourceAttribution: string
  readonly sourceUrl: string
  readonly isDemonstrationOnly: true
}

export interface VaccineScheduleDefinition {
  readonly vaccineCode: string
  readonly vaccineName: string
  readonly shortName: string
  readonly doseNumber: string
  readonly ageMonths: number | null
  readonly birthWindow: boolean
  readonly ageMilestoneLabel: string
  readonly targetDiseases: string[]
  readonly administrationRoute: string
  readonly recommendedSite: string
  readonly contextNote: string
  readonly expectedReactionNotice: string
  readonly missedDoseGuidance: string
}

export const EPI_SCHEDULE_METADATA: ScheduleMetadata = {
  scheduleId: "LK-EPI-2023-BASELINE",
  version: "LK-EPI-2023.v1-research-baseline",
  title: "Sri Lanka National Immunization Schedule (Baseline)",
  effectiveYear: 2023,
  lastReviewedDate: "2026-10-24",
  mandatoryDisclaimer:
    "For demonstration — verify the latest official EPI schedule before clinical use",
  sourceAttribution: "Epidemiology Unit, Ministry of Health, Sri Lanka",
  sourceUrl:
    "https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf",
  isDemonstrationOnly: true,
}

export const EPI_SCHEDULE_DEFINITIONS: readonly VaccineScheduleDefinition[] = [
  // ── Birth / 0–4 Weeks ─────────────────────────────────────────────────────
  {
    vaccineCode: "BCG",
    vaccineName: "BCG (Bacillus Calmette–Guérin)",
    shortName: "BCG",
    doseNumber: "Single dose",
    ageMonths: null,
    birthWindow: true,
    ageMilestoneLabel: "At Birth (0–4 weeks)",
    targetDiseases: ["Tuberculosis (TB)", "TB Meningitis", "Miliary TB"],
    administrationRoute: "Intradermal (0.05 ml)",
    recommendedSite: "Left upper arm (deltoid insertion)",
    contextNote:
      "Administered prior to hospital discharge or at the nearest child health clinic within 4 weeks of birth.",
    expectedReactionNotice:
      "A small red papule normally develops after 2–4 weeks, softens, and may form a small ulcer that heals leaving a tiny scar. Do not squeeze or apply lotions.",
    missedDoseGuidance:
      "If not received at birth, contact your Public Health Midwife (PHM) or Medical Officer of Health (MOH) clinic promptly for advice.",
  },

  // ── 2 Completed Months ────────────────────────────────────────────────────
  {
    vaccineCode: "PENTA1",
    vaccineName: "Pentavalent 1 (DTP-HepB-Hib)",
    shortName: "Penta 1",
    doseNumber: "Dose 1 of 3",
    ageMonths: 2,
    birthWindow: false,
    ageMilestoneLabel: "2 Completed Months",
    targetDiseases: [
      "Diphtheria",
      "Tetanus",
      "Pertussis (Whooping Cough)",
      "Hepatitis B",
      "Haemophilus influenzae type b",
    ],
    administrationRoute: "Intramuscular (0.5 ml)",
    recommendedSite: "Left anterolateral mid-thigh",
    contextNote:
      "First combination dose given at completion of 2 calendar months alongside OPV 1 and fIPV 1.",
    expectedReactionNotice:
      "Mild fever, fussiness, or slight soreness at the injection site is common for 24–48 hours.",
    missedDoseGuidance:
      "Contact your PHM or clinic to reschedule as soon as possible. Do not calculate a catch-up interval yourself (BR-03).",
  },
  {
    vaccineCode: "OPV1",
    vaccineName: "Oral Polio Vaccine 1 (bOPV)",
    shortName: "OPV 1",
    doseNumber: "Dose 1 of 5",
    ageMonths: 2,
    birthWindow: false,
    ageMilestoneLabel: "2 Completed Months",
    targetDiseases: ["Poliomyelitis (Infantile Paralysis)"],
    administrationRoute: "Oral (2 drops)",
    recommendedSite: "Mouth",
    contextNote: "Bivalent oral polio vaccine providing gut mucosal immunity.",
    expectedReactionNotice:
      "Usually well tolerated with no notable systemic symptoms.",
    missedDoseGuidance:
      "Contact your clinic to administer at the next available infant vaccination session.",
  },
  {
    vaccineCode: "fIPV1",
    vaccineName: "fractional Inactivated Polio Vaccine 1 (fIPV)",
    shortName: "fIPV 1",
    doseNumber: "Dose 1 of 2",
    ageMonths: 2,
    birthWindow: false,
    ageMilestoneLabel: "2 Completed Months",
    targetDiseases: ["Poliomyelitis (Types 1 & 3)"],
    administrationRoute: "Intradermal (0.1 ml)",
    recommendedSite: "Right upper arm",
    contextNote:
      "Provides systemic humoral immunity against poliovirus strains alongside OPV.",
    expectedReactionNotice:
      "Transient mild redness or swelling at the intradermal site.",
    missedDoseGuidance:
      "Consult your PHM for scheduling during the next local immunization clinic.",
  },

  // ── 4 Completed Months ────────────────────────────────────────────────────
  {
    vaccineCode: "PENTA2",
    vaccineName: "Pentavalent 2 (DTP-HepB-Hib)",
    shortName: "Penta 2",
    doseNumber: "Dose 2 of 3",
    ageMonths: 4,
    birthWindow: false,
    ageMilestoneLabel: "4 Completed Months",
    targetDiseases: [
      "Diphtheria",
      "Tetanus",
      "Pertussis",
      "Hepatitis B",
      "Haemophilus influenzae type b",
    ],
    administrationRoute: "Intramuscular (0.5 ml)",
    recommendedSite: "Left anterolateral mid-thigh",
    contextNote: "Second primary dose; scheduled 2 calendar months after Penta 1.",
    expectedReactionNotice:
      "Mild temperature elevation or local sensitivity for 1–2 days.",
    missedDoseGuidance:
      "Speak to your PHM or MOH clinic. Resumption continues without restarting the entire primary series.",
  },
  {
    vaccineCode: "OPV2",
    vaccineName: "Oral Polio Vaccine 2 (bOPV)",
    shortName: "OPV 2",
    doseNumber: "Dose 2 of 5",
    ageMonths: 4,
    birthWindow: false,
    ageMilestoneLabel: "4 Completed Months",
    targetDiseases: ["Poliomyelitis"],
    administrationRoute: "Oral (2 drops)",
    recommendedSite: "Mouth",
    contextNote: "Second oral polio dose.",
    expectedReactionNotice: "Generally well tolerated.",
    missedDoseGuidance: "Coordinate with your local clinic for administration.",
  },
  {
    vaccineCode: "fIPV2",
    vaccineName: "fractional Inactivated Polio Vaccine 2 (fIPV)",
    shortName: "fIPV 2",
    doseNumber: "Dose 2 of 2",
    ageMonths: 4,
    birthWindow: false,
    ageMilestoneLabel: "4 Completed Months",
    targetDiseases: ["Poliomyelitis"],
    administrationRoute: "Intradermal (0.1 ml)",
    recommendedSite: "Right upper arm",
    contextNote: "Completes the fractional IPV primary series.",
    expectedReactionNotice: "Mild local reaction may occur.",
    missedDoseGuidance: "Seek PHM guidance on the next child clinic session date.",
  },

  // ── 6 Completed Months ────────────────────────────────────────────────────
  {
    vaccineCode: "PENTA3",
    vaccineName: "Pentavalent 3 (DTP-HepB-Hib)",
    shortName: "Penta 3",
    doseNumber: "Dose 3 of 3",
    ageMonths: 6,
    birthWindow: false,
    ageMilestoneLabel: "6 Completed Months",
    targetDiseases: [
      "Diphtheria",
      "Tetanus",
      "Pertussis",
      "Hepatitis B",
      "Haemophilus influenzae type b",
    ],
    administrationRoute: "Intramuscular (0.5 ml)",
    recommendedSite: "Left anterolateral mid-thigh",
    contextNote:
      "Completes infant primary 3-dose series for Pentavalent protection.",
    expectedReactionNotice:
      "Temporary localized tenderness, low-grade pyrexia.",
    missedDoseGuidance:
      "Contact your MOH clinic to ensure primary immunization is brought up to date.",
  },
  {
    vaccineCode: "OPV3",
    vaccineName: "Oral Polio Vaccine 3 (bOPV)",
    shortName: "OPV 3",
    doseNumber: "Dose 3 of 5",
    ageMonths: 6,
    birthWindow: false,
    ageMilestoneLabel: "6 Completed Months",
    targetDiseases: ["Poliomyelitis"],
    administrationRoute: "Oral (2 drops)",
    recommendedSite: "Mouth",
    contextNote: "Third oral polio dose.",
    expectedReactionNotice: "Usually symptom-free.",
    missedDoseGuidance: "Consult your PHM for clinic dates.",
  },

  // ── 9 Completed Months ────────────────────────────────────────────────────
  {
    vaccineCode: "MMR1",
    vaccineName: "Measles, Mumps, Rubella 1 (MMR)",
    shortName: "MMR 1",
    doseNumber: "Dose 1 of 2",
    ageMonths: 9,
    birthWindow: false,
    ageMilestoneLabel: "9 Completed Months",
    targetDiseases: ["Measles", "Mumps", "Rubella (German Measles)"],
    administrationRoute: "Subcutaneous (0.5 ml)",
    recommendedSite: "Left upper arm",
    contextNote:
      "Administered at 9 completed calendar months. Critical for measles prevention.",
    expectedReactionNotice:
      "A delayed mild rash or low-grade fever may occur 5–12 days post-vaccination. This is normal and non-contagious.",
    missedDoseGuidance:
      "Prioritize contacting your PHM or health center immediately if 9 months has passed.",
  },

  // ── 12 Completed Months ───────────────────────────────────────────────────
  {
    vaccineCode: "JE",
    vaccineName: "Japanese Encephalitis (Live Attenuated)",
    shortName: "JE",
    doseNumber: "Single dose",
    ageMonths: 12,
    birthWindow: false,
    ageMilestoneLabel: "12 Completed Months (1 Year)",
    targetDiseases: ["Japanese Encephalitis"],
    administrationRoute: "Subcutaneous (0.5 ml)",
    recommendedSite: "Right upper arm",
    contextNote:
      "Administered at 1 year of age to protect against mosquito-borne encephalitis.",
    expectedReactionNotice:
      "Transient mild fever or irritability in a small percentage of children.",
    missedDoseGuidance:
      "Discuss with your local MOH doctor or PHM on upcoming clinic days.",
  },

  // ── 18 Completed Months ───────────────────────────────────────────────────
  {
    vaccineCode: "DTP_BOOST",
    vaccineName: "DTP Booster",
    shortName: "DTP Boost",
    doseNumber: "Booster 1",
    ageMonths: 18,
    birthWindow: false,
    ageMilestoneLabel: "18 Completed Months (1½ Years)",
    targetDiseases: ["Diphtheria", "Tetanus", "Pertussis"],
    administrationRoute: "Intramuscular (0.5 ml)",
    recommendedSite: "Left upper arm (deltoid) or anterolateral thigh",
    contextNote:
      "Booster dose to reinforce waning primary immunity established in infancy.",
    expectedReactionNotice:
      "Local swelling, redness, and mild fever are relatively common.",
    missedDoseGuidance:
      "Book an appointment with your child health clinic as soon as feasible.",
  },
  {
    vaccineCode: "OPV4",
    vaccineName: "Oral Polio Vaccine 4 (bOPV)",
    shortName: "OPV 4",
    doseNumber: "Dose 4 of 5",
    ageMonths: 18,
    birthWindow: false,
    ageMilestoneLabel: "18 Completed Months (1½ Years)",
    targetDiseases: ["Poliomyelitis"],
    administrationRoute: "Oral (2 drops)",
    recommendedSite: "Mouth",
    contextNote: "Booster dose of oral polio vaccine.",
    expectedReactionNotice: "Generally no symptoms.",
    missedDoseGuidance: "Consult your PHM on the next routine session.",
  },

  // ── 3 Years (36 Months) ───────────────────────────────────────────────────
  {
    vaccineCode: "MMR2",
    vaccineName: "Measles, Mumps, Rubella 2 (MMR)",
    shortName: "MMR 2",
    doseNumber: "Dose 2 of 2",
    ageMonths: 36,
    birthWindow: false,
    ageMilestoneLabel: "3 Completed Years (36 Months)",
    targetDiseases: ["Measles", "Mumps", "Rubella"],
    administrationRoute: "Subcutaneous (0.5 ml)",
    recommendedSite: "Right upper arm",
    contextNote:
      "Second dose ensuring long-term immunity against measles, mumps, and rubella.",
    expectedReactionNotice:
      "Mild fever or faint rash may occasionally appear 1–2 weeks later.",
    missedDoseGuidance:
      "If 3 years has elapsed, visit your MOH clinic to update protection before preschool.",
  },

  // ── 5 Years (60 Months) ───────────────────────────────────────────────────
  {
    vaccineCode: "DT_BOOST",
    vaccineName: "DT Booster (School Entry)",
    shortName: "DT Boost",
    doseNumber: "Booster 2",
    ageMonths: 60,
    birthWindow: false,
    ageMilestoneLabel: "5 Completed Years (School Entry)",
    targetDiseases: ["Diphtheria", "Tetanus"],
    administrationRoute: "Intramuscular (0.5 ml)",
    recommendedSite: "Left upper arm (deltoid)",
    contextNote:
      "Administered prior to primary school entry to ensure sustained tetanus and diphtheria coverage.",
    expectedReactionNotice: "Local arm soreness or stiffness for 1–2 days.",
    missedDoseGuidance:
      "Check with your school medical inspection team or local MOH clinic.",
  },
  {
    vaccineCode: "OPV5",
    vaccineName: "Oral Polio Vaccine 5 (bOPV)",
    shortName: "OPV 5",
    doseNumber: "Dose 5 of 5",
    ageMonths: 60,
    birthWindow: false,
    ageMilestoneLabel: "5 Completed Years (School Entry)",
    targetDiseases: ["Poliomyelitis"],
    administrationRoute: "Oral (2 drops)",
    recommendedSite: "Mouth",
    contextNote: "Final routine childhood oral polio booster.",
    expectedReactionNotice: "Generally well tolerated.",
    missedDoseGuidance: "Contact PHM or school health officer.",
  },
] as const

/** Look up detailed definition by vaccine code. */
export function getVaccineDefinition(
  vaccineCode: string,
): VaccineScheduleDefinition | undefined {
  return EPI_SCHEDULE_DEFINITIONS.find((def) => def.vaccineCode === vaccineCode)
}
