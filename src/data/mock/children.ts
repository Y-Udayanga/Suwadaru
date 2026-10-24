import type { Child } from "@/types"

/**
 * Stable fictional ids. These are not medical-record numbers.
 * Nethmi and Kavindu are the sample caregiver profiles from BRD Appendix A.
 */
export const fixtureIds = {
  caregiver: "caregiver_demo_parent",
  nethmi: "child_nethmi_demo",
  kavindu: "child_kavindu_demo",
} as const

export const demoCaregiver = {
  id: fixtureIds.caregiver,
  displayName: "Demo Parent",
} as const

/** Two fictional child profiles. No contact details, addresses, or identifiers. */
export const demoChildren = [
  {
    id: fixtureIds.nethmi,
    name: "Nethmi",
    dateOfBirth: "2025-04-15",
    sex: "female",
    birthWeightKg: 3.1,
    clinicName: "Sample Clinic",
  },
  {
    id: fixtureIds.kavindu,
    name: "Kavindu",
    dateOfBirth: "2026-02-28",
    sex: "male",
    birthWeightKg: 2.9,
    clinicName: "Sample Clinic",
  },
] as const satisfies readonly Child[]
