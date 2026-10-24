export type NutritionSafetyCategory =
  | "emergency_referral"
  | "medication_refusal"
  | "educational"

export type SafetyDecision =
  | { action: "refer"; category: "emergency_referral"; text: string }
  | { action: "refuse"; category: "medication_refusal"; text: string }
  | { action: "allow_education"; category: "educational" }

const EMERGENCY =
  /\b(emergenc(?:y|ies)|chok(?:e|ing|ed)|not breathing|cannot breathe|difficulty breathing|unconscious|unresponsive|seizure|convulsion|vomiting blood|blood in (?:the )?stool|blood in (?:the )?vomit|blue lips|cyanosis|poison(?:ed|ing)?|swallowed (?:a )?(?:coin|battery|chemical)|dehydrated|sunken eyes|refusing all fluids)\b/i

const MEDICATION =
  /\b(medicines?|medications?|dosages?|doses?|drugs?|paracetamol|panadol|ibuprofen|antibiotic|antibiotics|cough syrup|syrups?|prescriptions?|milligrams?|micrograms?|\d+(?:\.\d+)?\s?(?:mg|ml|mcg))\b/i

const REFERRAL = `This needs in-person care, not feeding advice.

Please take the child to the nearest hospital emergency unit or contact the on-duty doctor now if breathing, alertness, bleeding, poisoning, or dehydration is a concern. SuwaDaru does not triage emergencies and does not diagnose illness.

No request was sent to Gemini.`

const MEDICATION_REFUSAL = `SuwaDaru does not recommend medicines or dosages.

A doctor, pediatrician, or Public Health Midwife must give any medicine advice for this child. Please ask the clinic and take the child's weight record with you.

No medicine guidance was generated.`

export function classifyNutritionSafety(text: string): SafetyDecision {
  if (EMERGENCY.test(text)) {
    return { action: "refer", category: "emergency_referral", text: REFERRAL }
  }
  if (MEDICATION.test(text)) {
    return { action: "refuse", category: "medication_refusal", text: MEDICATION_REFUSAL }
  }
  return { action: "allow_education", category: "educational" }
}

export function modelTextGivesMedicine(text: string): boolean {
  return MEDICATION.test(text)
}

export const EDUCATION_DISCLAIMER =
  "This is general feeding education for families in Sri Lanka. It is not a diagnosis, a medicine recommendation, or a personal treatment plan. Ask your Public Health Midwife or clinic if you need advice for this child."

export const UNAVAILABLE_MESSAGE =
  "Nutrition education is temporarily unavailable. Please try again later or ask your Public Health Midwife. This message was not produced by Gemini and is not a feeding plan."
