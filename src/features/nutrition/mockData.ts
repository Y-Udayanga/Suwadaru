/**
 * Scripted nutrition mock responses for Frontend B.
 *
 * All responses are pre-written educational examples. No Gemini request is
 * made from the browser (BRD FR-042, BR-06). Responses are marked isDemo=true.
 * Emergency-style questions receive a safe professional-care referral (FR-043).
 *
 * INTEGRATION NOTE FOR FRONTEND A:
 *   When `nutritionService` from `@/services/contracts` is wired (B1 backend
 *   Gemini Edge Function), replace the mock adapter in `./nutritionService.ts`
 *   with the real service. This module may be removed at that point.
 */

export type NutritionResponseCategory =
  | "breastfeeding"
  | "complementary"
  | "local_foods"
  | "meal_planner"
  | "safe_referral"
  | "general"

type ScriptedResponse = {
  keywords: string[]
  category: NutritionResponseCategory
  text: string
}

const SCRIPTED_RESPONSES: ScriptedResponse[] = [
  // Emergency / unsafe topics → safe referral (FR-043)
  {
    keywords: [
      "emergency",
      "choking",
      "not breathing",
      "unconscious",
      "seizure",
      "vomiting blood",
      "diarrhea blood",
      "severe",
      "hospital",
      "poison",
    ],
    category: "safe_referral",
    text: "⚠️ This sounds like it may need urgent medical attention. Please contact your nearest clinic, hospital, or call emergency services immediately. SuwaDaru is an educational companion and cannot provide emergency guidance. Always consult a doctor, nurse, or Public Health Midwife (PHM) for any health concern.\n\n[Demo response — no request was sent to any AI service]",
  },
  {
    keywords: ["medicine", "medication", "dose", "drug", "paracetamol", "antibiotic", "prescription"],
    category: "safe_referral",
    text: "Medication dosing and prescriptions must only be recommended by a qualified healthcare professional. SuwaDaru does not provide medication advice. Please consult your child's doctor or PHM.\n\n[Demo response — no request was sent to any AI service]",
  },
  // Breastfeeding
  {
    keywords: ["breastfeed", "breast milk", "latch", "nursing", "breastmilk"],
    category: "breastfeeding",
    text: "Breast milk is the ideal food for infants up to 6 months and provides important nutrients and immunity. The World Health Organization recommends exclusive breastfeeding for the first 6 months, then continuing alongside complementary foods up to 2 years and beyond.\n\nIf you have concerns about latch or supply, your Public Health Midwife (PHM) can offer hands-on support during home visits.\n\n[Demo response — educational example only, not clinical advice]",
  },
  {
    keywords: ["formula", "bottle", "top feed"],
    category: "breastfeeding",
    text: "If breastfeeding is not possible or supplemented with formula, your PHM or doctor can guide you on age-appropriate formula options and safe preparation — including using boiled water and sterilised bottles. SuwaDaru does not recommend specific commercial brands.\n\n[Demo response — educational example only, not clinical advice]",
  },
  // Complementary feeding age
  {
    keywords: ["start food", "solid", "when to introduce", "first food", "6 month"],
    category: "complementary",
    text: "Complementary foods are typically introduced around 6 months when the child shows developmental readiness — sitting with support, showing interest in food, and reduced tongue-thrust reflex. Begin with soft, smooth purees and progress to mashed and then soft lumps.\n\nIn Sri Lanka, traditional first foods often include well-cooked, mashed rice congee (kenda) with vegetables. Avoid salt, sugar, honey (under 1 year), and whole nuts. Your PHM can provide a personalised feeding guide.\n\n[Demo response — educational example only, not clinical advice]",
  },
  {
    keywords: ["9 month", "8 month", "7 month"],
    category: "complementary",
    text: "At 7–9 months, most babies can manage soft mashed textures — mashed rice, well-cooked dhal, soft steamed vegetables like carrot or pumpkin, and mashed banana or papaya. Introduce one new food at a time and watch for reactions. Offer water in a cup.\n\n[Demo response — educational example only, not clinical advice]",
  },
  {
    keywords: ["1 year", "12 month", "toddler"],
    category: "complementary",
    text: "By 12 months, most toddlers can join family meals with soft, finely cut portions. Avoid whole nuts, hard raw vegetables, large chunks, and foods with added salt and sugar. Sri Lankan family foods such as well-cooked rice, dhal, soft vegetables, and fish (bones removed) are generally suitable when prepared fresh and hygienic.\n\n[Demo response — educational example only, not clinical advice]",
  },
  // Local Sri Lankan foods
  {
    keywords: ["sri lanka", "local food", "dhal", "kenda", "rice", "jak fruit", "jackfruit", "gotukola", "murunga", "drumstick"],
    category: "local_foods",
    text: "Many traditional Sri Lankan foods are excellent for young children:\n\n• **Kenda (rice congee):** Easy-to-digest, ideal as a first food. Add well-cooked vegetables for nutrition.\n• **Dhal (parippu):** High in protein and iron; can be mashed smooth for young infants.\n• **Gotukola:** Rich in folate; serve finely chopped and cooked for older babies.\n• **Murunga (drumstick leaves):** Nutritious; cook leaves and add to rice or soup.\n• **Jak fruit (kos):** Soft ripe jak is sweet and suitable as a finger food for older babies.\n• **Fish:** An excellent protein source; ensure all bones are carefully removed.\n\n[Demo response — educational food information only, not a prescribed diet plan]",
  },
  // Allergies
  {
    keywords: ["allergy", "allergic", "rash", "hives", "swelling"],
    category: "safe_referral",
    text: "If you notice a rash, swelling, or difficulty breathing after introducing a new food, stop offering that food and consult your doctor or PHM promptly. Allergy assessment should always be done by a qualified professional.\n\n[Demo response — no request was sent to any AI service]",
  },
  // Iron / protein
  {
    keywords: ["iron", "anaemia", "protein", "fish", "egg", "chicken"],
    category: "local_foods",
    text: "Iron-rich foods are important for growing children. Good local sources include dhal, green leafy vegetables (like gotukola), small dried fish (Maldive fish in small amounts), egg yolk, and soft cooked chicken or fish (bones removed). Pairing iron-rich foods with vitamin C sources (like a small piece of papaya or tomato) can help absorption.\n\n[Demo response — educational food information only, not a prescribed diet plan]",
  },
  // Meal planner suggestion
  {
    keywords: ["meal plan", "weekly", "what to feed", "daily", "schedule"],
    category: "meal_planner",
    text: "Here is a simple illustrative example for a 9-month-old (fictional demonstration only):\n\n**Morning:** Soft rice porridge with mashed carrot and a little dhal\n**Mid-morning snack:** Mashed ripe banana\n**Lunch:** Well-mashed rice, dhal, finely chopped cooked spinach\n**Afternoon snack:** Small piece of soft papaya\n**Evening:** Rice porridge with small amount of flaked fish (bones completely removed)\n\nAlways offer water. Adjust textures for your child's readiness. Your PHM can create a real feeding plan based on your child's needs.\n\n[Demo example — not a prescription or clinical guidance]",
  },
]

const GENERAL_FALLBACK =
  "SuwaDaru provides general educational nutrition information for Sri Lankan caregivers. For personalised guidance on your child's feeding, please consult your Public Health Midwife (PHM) or doctor.\n\n[Demo response — educational example only, not clinical advice]"

export function findScriptedResponse(userText: string): {
  text: string
  category: NutritionResponseCategory
} {
  const lower = userText.toLowerCase()
  for (const response of SCRIPTED_RESPONSES) {
    if (response.keywords.some((kw) => lower.includes(kw))) {
      return { text: response.text, category: response.category }
    }
  }
  return { text: GENERAL_FALLBACK, category: "general" }
}

// Suggested prompts shown on first-use / empty state (FR-040).
export const SUGGESTED_PROMPTS: string[] = [
  "What are good first foods for a 6-month-old?",
  "Which local Sri Lankan foods are good for babies?",
  "How long should I breastfeed?",
  "What can I give a 9-month-old for lunch?",
  "What are iron-rich foods for toddlers?",
  "When can I introduce eggs?",
  "Sample weekly meal plan for a 1-year-old",
]
