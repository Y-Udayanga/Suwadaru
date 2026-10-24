/**
 * Curated Sri Lankan Pediatric Nutrition Educational Content & Scripted Responses.
 *
 * SAFETY & GOVERNANCE CONSTRAINTS (BRD §7.5, §14, BR-06, BR-07, T-11):
 *   - Educational examples only; no child-specific medical diagnoses, medication
 *     prescriptions, or clinical therapeutic diet plans.
 *   - For emergency or alarming symptoms, return respectful urgent professional-care
 *     referral instead of feeding advice.
 *   - Local-food guidance: well-cooked red rice, dhal (parippu), soft vegetables
 *     (pumpkin/wattakka, carrots, gotukola), boneless fish (sprats/thalapath with
 *     bones rigorously removed).
 *   - Hygiene precautions: Hand washing with soap before feeding, boiled cooled
 *     water, clean utensils, and covered food storage.
 *   - Age-appropriate food texture and choking risk precautions:
 *     No whole nuts, round grapes, hard seeds, or sharp fish bones.
 *   - Mandatory disclaimer: "Demo responses — no Gemini API connected".
 */

export interface ScriptedNutritionResponse {
  readonly keywords: readonly string[]
  readonly category:
    | "emergency_referral"
    | "medication_refusal"
    | "breastfeeding"
    | "complementary_feeding"
    | "local_foods"
    | "hygiene_safety"
    | "meal_planner"
    | "general_education"
  readonly text: string
}

export const SCRIPTED_RESPONSES: readonly ScriptedNutritionResponse[] = [
  // ── 1. Emergency & Alarming Symptoms → Immediate Urgent Care Referral (FR-043, T-11)
  {
    keywords: [
      "emergency",
      "choking on",
      "is choking",
      "not breathing",
      "unconscious",
      "seizure",
      "convulsion",
      "vomiting blood",
      "blood in stool",
      "diarrhea blood",
      "high fever",
      "severe fever",
      "lethargic",
      "blue lips",
      "cyanosis",
      "poison",
      "swallowed coin",
      "dehydrated",
      "sunken eyes",
      "refusing all fluids",
    ],
    category: "emergency_referral",
    text: `⚠️ URGENT MEDICAL ADVICE:
This sounds like an alarming symptom that requires immediate, in-person medical evaluation.

• Please take your child to the nearest hospital Emergency Treatment Unit (ETU) or consult an on-duty pediatrician/doctor immediately.
• If your child is having difficulty breathing or choking, seek emergency assistance immediately.
• SuwaDaru is strictly an educational tool and does not provide emergency triage or medical diagnoses.

[Demo response — no request was sent to Gemini or any external AI]`,
  },

  // ── 2. Medication & Dosing Refusal (BR-06) ──────────────────────────────
  {
    keywords: [
      "medicine",
      "medication",
      "dose",
      "dosage",
      "drug",
      "paracetamol",
      "panadol",
      "antibiotic",
      "cough syrup",
      "prescription",
    ],
    category: "medication_refusal",
    text: `Medication dosages, prescriptions, and pharmaceutical treatments must only be directed by a qualified physician, pediatrician, or Public Health Midwife (PHM).

SuwaDaru strictly withholds all drug dosage guidance to ensure child safety (BR-06). Please consult your clinic or healthcare provider with your child's exact weight for proper clinical dosing.

[Demo response — educational simulator only; no AI connected]`,
  },

  // ── 3. Breastfeeding & Infant Feeding (<6 Months) ───────────────────────
  {
    keywords: [
      "breastfeed",
      "breast milk",
      "breastmilk",
      "latch",
      "nursing",
      "exclusive breastfeeding",
      "supply",
      "colostrum",
    ],
    category: "breastfeeding",
    text: `Breast milk is the ideal nutrition for infants. World Health Organization (WHO) and Sri Lankan Ministry of Health guidelines recommend:

• Exclusive breastfeeding for the first 6 completed months (no water, formula, or herbal teas needed).
• Continued breastfeeding on demand alongside nutrient-dense complementary foods up to 2 years and beyond.
• Frequent feeds (8–12 times per 24 hours) support robust milk production.
• For latch difficulties or nipple soreness, your area Public Health Midwife (PHM) provides free, hands-on support during clinic and home visits.

[Demo response — general educational information; not a clinical consultation]`,
  },

  // ── 4. Introduction of Complementary Foods (6–8 Months) ─────────────────
  {
    keywords: [
      "start food",
      "solid",
      "first food",
      "weaning",
      "complementary",
      "6 month",
      "six month",
    ],
    category: "complementary_feeding",
    text: `Introducing Complementary Foods at 6 Completed Months:

• Developmental Readiness: Baby sits with support, has steady head control, and shows active interest in food.
• Starting Consistency: Begin with smooth, thick porridge (not watery). Traditional rice congee (kenda) made with red or white rice is a gentle starter.
• Nutritional Enrichment: Add well-cooked, mashed dhal (parippu) and pureed orange/yellow vegetables like pumpkin (wattakka) or carrot.
• Hygiene: Wash hands thoroughly with soap before preparation. Use freshly boiled, cooled water.
• Precautions: Do NOT add salt, sugar, honey (risk of infant botulism under 1 year), or artificial flavor enhancers.

[Demo response — general educational guidance; consult your PHM for personalized feeding plans]`,
  },

  // ── 5. Local Sri Lankan Foods & Preparation ─────────────────────────────
  {
    keywords: [
      "local food",
      "sri lanka",
      "rice",
      "dhal",
      "parippu",
      "pumpkin",
      "wattakka",
      "gotukola",
      "murunga",
      "vegetable",
      "congee",
      "kenda",
    ],
    category: "local_foods",
    text: `Nutritious Sri Lankan Foods for Growing Children:

• Red Rice & Porridge (Kenda): Excellent energy base. Cook till very soft and mash with a fork.
• Dhal (Parippu): Rich in plant protein and iron. Cook thoroughly with mild cumin or turmeric; mash smoothly for infants.
• Pumpkin (Wattakka) & Carrots: Packed with Vitamin A for vision and immune health. Steam and mash.
• Green Leafy Vegetables (Gotukola, Murunga leaves): Excellent sources of folate, iron, and minerals. Wash thoroughly, cook well, and chop very finely before mixing with rice.
• Preparation Tip: Adding a tiny drop of coconut oil or butter aids absorption of fat-soluble vitamins (A, D, E).

[Demo response — educational food guidance; no AI request made]`,
  },

  // ── 6. Animal Proteins & Boneless Fish Preparation ──────────────────────
  {
    keywords: [
      "fish",
      "sprats",
      "thalapath",
      "egg",
      "egg yolk",
      "chicken",
      "protein",
      "iron",
      "meat",
    ],
    category: "local_foods",
    text: `Animal Protein & Choking Prevention (Fish & Eggs):

• Fish: High-quality protein and Omega-3 fatty acids. White fish or fresh sprats (heads/insides removed) are wonderful.
  ⚠️ CRITICAL CHOKING PRECAUTION: Always flake fish carefully with clean fingers to verify all bones are 100% removed before feeding.
• Egg: Start with well-cooked hard-boiled egg yolk from 6–7 months. Introduce egg white around 8–9 months and monitor for allergic reactions.
• Chicken: Soft minced or shredded chicken cooked in a mild vegetable stew.
• Iron Pairing: Pair protein meals with a small piece of ripe papaya or mashed banana to promote iron absorption.

[Demo response — educational food safety information; no AI connected]`,
  },

  // ── 7. Food Texture Progression & Choking Hazards ──────────────────────
  {
    keywords: [
      "texture",
      "choking",
      "lumps",
      "finger food",
      "hazard",
      "chewing",
      "gagging",
    ],
    category: "hygiene_safety",
    text: `Texture Progression & Choking Safety:

• 6–7 Months: Smooth, thick purees and thick mashes without hard chunks.
• 8–9 Months: Mashed foods with soft small lumps; encourages chewing and jaw muscle development.
• 10–12 Months: Soft finger foods (steamed carrot batons, soft ripe banana pieces, soft sweet potato).
• Choking Hazards to AVOID completely:
  ❌ Whole nuts (peanuts, cashews)
  ❌ Round uncut grapes or berries (must be quartered lengthwise)
  ❌ Raw hard carrots or apple wedges (must be grated or steamed soft)
  ❌ Fish bones and uninspected seafood

Always supervise your child during all meals; never leave a child eating unattended.

[Demo response — educational hygiene and safety guidelines; no AI connected]`,
  },

  // ── 8. Water, Fluids & Hygiene Precautions ──────────────────────────────
  {
    keywords: [
      "water",
      "fluids",
      "cup",
      "hygiene",
      "clean",
      "wash",
      "storage",
      "diarrhea",
      "vomiting",
    ],
    category: "hygiene_safety",
    text: `Hydration and Food Hygiene Precautions:

• Under 6 months: Exclusive breast milk supplies all necessary hydration.
• 6+ months: Offer small sips of boiled, cooled drinking water in a cup with or after meals.
• Handwashing: Always wash caregiver hands and child's hands with soap and water before meal preparation and feeding.
• Storage: Prepare infant foods fresh whenever possible. Store leftovers covered in a cool place or refrigerator and discard food left at room temperature for over 2 hours.

[Demo response — educational hygiene guidance; no AI connected]`,
  },

  // ── 9. Illustrative Meal Planner (9–12 Months Demo) ─────────────────────
  {
    keywords: [
      "meal plan",
      "menu",
      "sample day",
      "routine",
      "what to feed today",
      "schedule",
    ],
    category: "meal_planner",
    text: `Sample 1-Day Complementary Feeding Outline (9–12 Months Demo):

• Morning: Soft red rice porridge mashed with steamed pumpkin and a teaspoon of cooked dhal.
• Mid-morning: Sliced soft ripe banana or mashed papaya.
• Lunch: Well-mashed rice with stewed gotukola, dhal, and flaked boneless fish (thoroughly checked for bones).
• Afternoon: Small portion of curd with a touch of fruit mash.
• Evening: Warm mashed sweet potato with cooked egg yolk or soft vegetable congee.
• Fluids: Breastfeed on demand; offer small sips of boiled, cooled water.

* Note: Every child progresses at their own pace. Consult your PHM for personalized growth-monitored meal planning.

[Demo response — illustrative example only; not a therapeutic diet plan]`,
  },
] as const

const GENERAL_EDUCATIONAL_FALLBACK = `SuwaDaru Nutrition provides general educational guidance based on standard Sri Lankan pediatric recommendations:

• Promote age-appropriate textures (thick porridge at 6 mo, mashed lumps at 8 mo, family foods at 12 mo).
• Emphasize diverse local foods: red rice, dhal, pumpkin, gotukola, well-cooked egg, and bone-inspected fish.
• Observe strict hygiene (handwashing, boiled water) and avoid choking hazards.
• For tailored dietary advice or weight concerns, please consult your Public Health Midwife (PHM) or pediatrician.

[Demo responses — no Gemini API connected]`;

/**
 * Pure response selector for nutrition queries.
 */
export function findNutritionResponse(userQuery: string): {
  text: string
  category: ScriptedNutritionResponse["category"]
} {
  const normalized = userQuery.toLowerCase().trim()
  for (const item of SCRIPTED_RESPONSES) {
    if (item.keywords.some((kw) => normalized.includes(kw))) {
      return { text: item.text, category: item.category }
    }
  }
  return { text: GENERAL_EDUCATIONAL_FALLBACK, category: "general_education" }
}

/** Suggested prompt chips adapted to age contexts (FR-040). */
export const SUGGESTED_NUTRITION_PROMPTS = [
  "What are healthy first foods for a 6-month-old?",
  "How to prepare dhal and vegetables safely?",
  "How do I prepare fish without choking risk?",
  "What textures are safe for an 8-month-old?",
  "Sample daily meal plan for a 1-year-old",
  "Food hygiene and safe water guidelines",
  "When should I introduce eggs?",
] as const
