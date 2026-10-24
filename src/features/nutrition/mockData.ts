/**
 * SuwaDaru AI (සුවදරු AI) — Pediatric Nutrition & Feeding Companion
 *
 * Friendly, trustworthy educational assistant inside the SuwaDaru app
 * for parents and caregivers in Sri Lanka (children birth to 5 years).
 *
 * STRICT SAFETY RULES & GOVERNANCE (BRD §7.5, §14, BR-06, BR-07, T-11):
 *   1. NEVER diagnose any illness or condition.
 *   2. NEVER prescribe or recommend medicines, supplements, or doses.
 *   3. NEVER decide vaccine doses or schedules. Refer to official app schedule or PHM.
 *   4. Single growth measurement is not a diagnosis.
 *   5. EMERGENCY: Danger signs (difficulty breathing, seizures, unconsciousness,
 *      persistent vomiting/diarrhea, high fever in infant, blood in stool, choking)
 *      → STOP normal advice. Call 1990 Suwa Seriya ambulance or go to ETU immediately.
 *   6. Multi-lingual: Replies in the language of the user (Sinhala, Tamil, or English).
 *   7. Local Sri Lankan foods: Rice, dhal (parippu), mung beans (mun), eggs, boneless fish,
 *      gotukola, mukunuwenna, murunga leaves, wattakka, sweet potato, manioc, bananas, papaya, coconut.
 *   8. Always include food safety & choking precautions: No whole nuts, whole grapes;
 *      no honey under 12 months; no added salt/sugar.
 *   9. Mandatory disclaimer closing on all educational responses.
 */

export interface ScriptedNutritionResponse {
  readonly keywords: readonly string[]
  readonly category:
    | "emergency_referral"
    | "medication_referral"
    | "medication_refusal"
    | "breastfeeding"
    | "complementary_feeding"
    | "local_foods"
    | "hygiene_safety"
    | "meal_planner"
    | "kitchen_ideas"
    | "learning_cards"
    | "general_education"
  readonly text: string
}

// ── Standard Educational Closing Reminders ─────────────────────────────────
const DISCLAIMER_EN = `\n\n📌 Note: This is general educational information, not a personal medical or diet plan. Please check with your PHM or doctor for your child's needs.\n[Demo response — SuwaDaru AI educational simulator]`
const DISCLAIMER_SI = `\n\n📌 සටහන: මෙය සාමාන්‍ය අධ්‍යාපනික තොරතුරු පමණි. ඔබේ දරුවාගේ පෞද්ගලික අවශ්‍යතා සඳහා කරුණාකර ප්‍රදේශයේ පවුල් සෞඛ්‍ය සේවා නිලධාරිනිය (PHM) හෝ වෛද්‍යවරයා හමුවන්න.\n[ආදර්ශන පිළිතුරකි — සුවදරු AI අධ්‍යාපනික සේවාව]`
const DISCLAIMER_TA = `\n\n📌 குறிப்பு: இது பொதுவான கல்வி வழிகாட்டல் மட்டுமே. உங்கள் குழந்தையின் தனிப்பட்ட தேவைகளுக்கு உங்கள் PHM அல்லது மருத்துவரை அணுகவும்.\n[மாதிரி பதில் — SuwaDaru AI]`

export const SCRIPTED_RESPONSES: readonly ScriptedNutritionResponse[] = [
  // ── 1. EMERGENCY & ALARMING SYMPTOMS (Rule 5 & 6, T-11) ───────────────────
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
      "1990",
      "අසාධ්‍ය",
      "හුස්ම",
      "හිරවෙලා",
      "පිටගැස්ම",
      "ලේ",
      "කாய்ச்சல்",
      "மூச்சு",
    ],
    category: "emergency_referral",
    text: `🚨 URGENT MEDICAL ADVICE:
This sounds like an alarming symptom that requires immediate, in-person emergency medical evaluation!

• Please take your child to the nearest hospital Emergency Treatment Unit (ETU) immediately.
• In Sri Lanka, call the 1990 Suwa Seriya Free Ambulance Service immediately.
• If your child is choking or having difficulty breathing, seek emergency assistance on the spot.
• Do not attempt to give home remedies or force food or liquids.

SuwaDaru strictly does not provide emergency triage or medical diagnoses. Seek professional medical help now.
[Demo response — no request was sent to Gemini or any external AI]`,
  },

  // ── 2. MEDICATION & DOSING REFUSAL (Rule 2 & 7, BR-06) ─────────────────────
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
      "බෙහෙත්",
      "පැරසිටමෝල්",
      "මාත්‍රාව",
      "மருந்து",
    ],
    category: "medication_refusal",
    text: `Medication dosages, prescriptions, and pharmaceutical treatments must only be directed by a qualified physician, pediatrician, or Public Health Midwife (PHM).

SuwaDaru strictly withholds all drug dosage guidance to ensure child safety (BR-06). Please consult your clinic or healthcare provider with your child's exact weight for proper clinical dosing.
[Demo response — educational simulator only; no AI connected]`,
  },

  // ── 3. SINHALA 8-MONTH BUDGET COMPLEMENTARY FEEDING (User Example) ────────
  {
    keywords: [
      "මාස 8",
      "මාස අට",
      "අඩු වියදම",
      "වියදමකින්",
      "කෑම",
      "ආහාර මොනවාද",
      "බබාට කෑම",
    ],
    category: "local_foods",
    text: `ආයුබෝවන්! මාස 8ක් වන ඔබේ බබාට අඩු වියදමකින් ගෙදරදීම පිළියෙල කරගත හැකි ඉතා පෝෂ්‍යදායී ආහාර කිහිපයක් මෙන්න:

1. මව්කිරි දීම: දරුවාට අවශ්‍ය පරිදි දිගටම මව්කිරි ලබාදීම අත්‍යවශ්‍යයි.
2. බත් සහ පරිප්පු: හොඳින් තැම්බූ රතු කැකුළු බත්, පරිප්පු හෝ මුං ඇට සමඟ පොඩි කර ලබා දෙන්න (යකඩ සහ ප්‍රෝටීන් බහුලයි).
3. දේශීය එළවළු: වට්ටක්කා, කැරට් හෝ බතල තම්බා පොඩි කර එකතු කරන්න.
4. ප්‍රෝටීන්: හොඳින් තැම්බූ බිත්තර කහ මදය හෝ කටු හොඳින් ඉවත් කළ මාළු කැබැල්ලක් පොඩි කර දෙන්න.
5. පලතුරු: හොඳින් ඉදුණු ආනමාලු කෙසෙල් හෝ පැපොල් පොඩි කර කෙටි වේලක් ලෙස දෙන්න.

⚠️ ආරක්ෂක උපදෙස්:
• මුළු රටකජු, ඇට වර්ග හෝ නොකැපූ මිදි ගෙඩි කිසිවිටෙක නොදෙන්න (හිරවීමේ අවදානම).
• අවුරුද්දට අඩු බබාලාට ලුණු, සීනි හෝ මී පැණි එකතු නොකරන්න.${DISCLAIMER_SI}`,
  },

  // ── 3B. TAMIL COMPLEMENTARY & LOCAL FOOD FEEDING ───────────────────────────
  {
    keywords: [
      "உணவு",
      "சாப்பாடு",
      "பருப்பு",
      "குழந்தைக்கு",
      "ஊட்டச்சத்து",
      "மாத குழந்தை",
    ],
    category: "local_foods",
    text: `வணக்கம்! உங்கள் குழந்தையின் ஆரோக்கியமான வளர்ச்சிக்கு எளிய, ஊட்டச்சத்து நிறைந்த உள்ளூர் உணவுகள்:

1. தாய்ப்பால்: தேவைப்படும் வரை தொடர்ந்து தாய்ப்பால் கொடுப்பது அவசியம்.
2. சிவப்பு அரிசி & பருப்பு: நன்கு வேகவைத்த சிவப்பு அரிசியுடன் பருப்பு அல்லது பயறு சேர்த்து மசித்து கொடுங்கள் (இரும்புச்சத்து மற்றும் புரதம் நிறைந்தது).
3. உள்ளூர் காய்கறிகள்: பூசணிக்காய், கேரட் அல்லது சர்க்கரைவள்ளிக் கிழங்கு நன்கு வேகவைத்து மசித்து சேர்க்கவும்.
4. புரதம்: நன்கு வெந்த முட்டை மஞ்சள் கரு அல்லது முள் முழுமையாக நீக்கப்பட்ட மீன் மசித்து கொடுக்கலாம்.
5. பழங்கள்: நன்கு பழுத்த வாழைப்பழம் அல்லது பப்பாளி மசித்து சிற்றுண்டியாக வழங்கலாம்.

⚠️ பாதுகாப்பு வழிகாட்டல்:
• முழு கொட்டைகள், திராட்சை பழங்களை ஒருபோதும் முழுதாக கொடுக்க வேண்டாம்.
• 1 வயதுக்குட்பட்ட குழந்தைகளுக்கு உப்பு, சர்க்கரை அல்லது தேன் சேர்க்காதீர்கள்.${DISCLAIMER_TA}`,
  },

  // ── 4. WHAT'S IN MY KITCHEN? (Sri Lankan Staples) ─────────────────────────
  {
    keywords: [
      "what's in my kitchen",
      "whats in my kitchen",
      "kitchen idea",
      "fridge",
      "available at home",
      "කුස්සියේ",
      "ගෙදර තියෙන",
    ],
    category: "kitchen_ideas",
    text: `👩‍🍳 "What's in My Kitchen?" — Quick Healthy Sri Lankan Ideas:

• Got Rice + Dhal (Parippu)?
  → Mash well-cooked red rice with thick dhal and a drop of coconut milk for gentle, high-protein energy.

• Got Pumpkin (Wattakka) + Egg?
  → Steam pumpkin with a pinch of turmeric, mash with a hard-boiled egg yolk. Rich in Vitamin A and healthy fats.

• Got Sweet Potato (Bathala) or Manioc?
  → Boil until fork-soft. Mash with a teaspoon of boiled water or expressed breastmilk for an easy afternoon snack.

• Got Murunga Leaves or Gotukola?
  → Cook well, chop very finely into soft dhal rice. Excellent natural source of iron and folate!

Safety reminder: Always flake fish carefully to remove all bones, and never add salt or sugar under 12 months.${DISCLAIMER_EN}`,
  },

  // ── 5. 7-DAY NUTRITION PLAN (Budget-Friendly) ─────────────────────────────
  {
    keywords: [
      "7-day",
      "7 day",
      "seven day",
      "weekly plan",
      "budget meal planner",
      "budget planner",
      "සැලැස්ම",
      "සතියේ කෑම",
    ],
    category: "meal_planner",
    text: `📅 Sample 7-Day Sri Lankan Budget-Friendly Nutrition Plan:

• Day 1: Soft red rice congee with mashed dhal + pureed pumpkin (wattakka).
• Day 2: Mashed rice with boiled egg yolk and finely chopped gotukola.
• Day 3: Mashed sweet potato (bathala) with soft mung beans (mun ata).
• Day 4: Soft rice with flaked boneless fish (bones 100% removed) and carrot mash.
• Day 5: Dhal and rice mash with well-cooked spinach/mukunuwenna + ripe banana snack.
• Day 6: Steamed manioc or potato mash with shredded chicken broth or egg.
• Day 7: Soft mixed vegetable congee with coconut milk + ripe papaya puree.

💡 Budget Tip: Utilize green leaves grown in your garden (Gotukola, Murunga) and local legumes (Parippu, Mung beans) which provide superior nutrition at minimal cost.${DISCLAIMER_EN}`,
  },

  // ── 6. NUTRITION LEARNING CARDS (Texture & Safety) ────────────────────────
  {
    keywords: [
      "learning card",
      "learning cards",
      "cards",
      "food card",
      "කාඩ්පත්",
      "ඉගෙනුම්",
    ],
    category: "learning_cards",
    text: `💡 Nutrition Learning Cards (Birth to 5 Years):

📇 Card 1: Texture Progression
• 6–7 Months: Smooth, thick purees & thick congee.
• 8–9 Months: Mashed foods with soft small lumps (teaches chewing).
• 10–12 Months: Soft finger foods (steamed carrot sticks, soft banana slices).
• 12+ Months: Modified family pot foods.

📇 Card 2: Choking Hazard Red Flags
• Never give whole nuts, uncut grapes, or hard raw carrots.
• Always flake fish with clean fingers to verify zero bones remain.

📇 Card 3: The "No-No" List under 1 Year
• No added salt (protects baby's kidneys).
• No added sugar or artificial sweeteners.
• No honey (risk of infant botulism).${DISCLAIMER_EN}`,
  },

  // ── 7. FISH & PROTEIN PREPARATION (T-11 test constraint) ──────────────────
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
      "මාළු",
      "බිත්තර",
    ],
    category: "local_foods",
    text: `Animal Protein & Choking Prevention (Fish & Eggs):

• Fish: High-quality protein and Omega-3 fatty acids. White fish or fresh sprats (heads/insides removed) are wonderful.
  ⚠️ CRITICAL CHOKING PRECAUTION: Always flake fish carefully with clean fingers to verify all bones are 100% removed before feeding.
• Egg: Start with well-cooked hard-boiled egg yolk from 6–7 months. Introduce egg white around 8–9 months and monitor for allergic reactions.
• Chicken: Soft minced or shredded chicken cooked in a mild vegetable stew.
• Iron Pairing: Pair protein meals with a small piece of ripe papaya or mashed banana to promote iron absorption.

[Demo response — educational food safety information; no AI connected]${DISCLAIMER_EN}`,
  },

  // ── 8. TEXTURE & CHOKING HAZARDS (T-11 test constraint) ───────────────────
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

[Demo response — educational hygiene and safety guidelines; no AI connected]${DISCLAIMER_EN}`,
  },

  // ── 9. WATER & HYGIENE PRECAUTIONS (T-11 test constraint) ─────────────────
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
      "වතුර",
      "පිරිසිදු",
    ],
    category: "hygiene_safety",
    text: `Hydration and Food Hygiene Precautions:

• Under 6 months: Exclusive breast milk supplies all necessary hydration.
• 6+ months: Offer small sips of boiled, cooled drinking water in a cup with or after meals.
• Handwashing: Always wash caregiver hands and child's hands with soap and water before meal preparation and feeding.
• Storage: Prepare infant foods fresh whenever possible. Store leftovers covered in a cool place or refrigerator and discard food left at room temperature for over 2 hours.

[Demo response — educational hygiene guidance; no AI connected]${DISCLAIMER_EN}`,
  },

  // ── 10. COMPLEMENTARY FEEDING INTRODUCTION (T-11 test constraint) ─────────
  {
    keywords: [
      "start food",
      "solid",
      "first food",
      "weaning",
      "complementary",
      "6 month",
      "six month",
      "මාස හය",
    ],
    category: "complementary_feeding",
    text: `Introducing Complementary Foods at 6 Completed Months:

• Developmental Readiness: Baby sits with support, has steady head control, and shows active interest in food.
• Starting Consistency: Begin with smooth, thick porridge (not watery). Traditional rice congee (kenda) made with red or white rice is a gentle starter.
• Nutritional Enrichment: Add well-cooked, mashed dhal (parippu) and pureed orange/yellow vegetables like pumpkin (wattakka) or carrot.
• Hygiene: Wash hands thoroughly with soap before preparation. Use freshly boiled, cooled water.
• Precautions: Do NOT add salt, sugar, honey (risk of infant botulism under 1 year), or artificial flavor enhancers.

[Demo response — general educational guidance; consult your PHM for personalized feeding plans]${DISCLAIMER_EN}`,
  },

  // ── 11. LOCAL SRI LANKAN FOODS (T-11 test constraint) ─────────────────────
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

[Demo response — educational food guidance; no AI request made]${DISCLAIMER_EN}`,
  },

  // ── 12. BREASTFEEDING GUIDANCE ────────────────────────────────────────────
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
      "මව්කිරි",
      "தாய்ப்பால்",
    ],
    category: "breastfeeding",
    text: `Breast milk is the ideal nutrition for infants. World Health Organization (WHO) and Sri Lankan Ministry of Health guidelines recommend:

• Exclusive breastfeeding for the first 6 completed months (no water, formula, or herbal teas needed).
• Continued breastfeeding on demand alongside nutrient-dense complementary foods up to 2 years and beyond.
• Frequent feeds (8–12 times per 24 hours) support robust milk production.
• For latch difficulties or nipple soreness, your area Public Health Midwife (PHM) provides free, hands-on support during clinic and home visits.

[Demo response — general educational information; not a clinical consultation]${DISCLAIMER_EN}`,
  },

  // ── 13. VACCINATION QUESTIONS IN CHAT (Rule 3 & 4) ────────────────────────
  {
    keywords: [
      "vaccine",
      "vaccination",
      "epi schedule",
      "immunization",
      "mmr",
      "pentavalent",
      "bcg",
      "එන්නත්",
      "තடுப்பூசி",
    ],
    category: "general_education",
    text: `Sri Lanka has a world-class National Immunization Programme (EPI) providing free vaccinations for children from birth to 5 years.

• To view your child's scheduled milestone due dates, open the "Vaccinations" tab in SuwaDaru.
• For any missed or delayed doses, do not attempt to guess or reschedule yourself. Always consult your area Public Health Midwife (PHM) or visit your local MOH clinic.
• Your child's official physical Child Health Development Record (CHDR) is the sole authoritative clinical record.${DISCLAIMER_EN}`,
  },

  // ── 14. GROWTH CHART QUESTIONS IN CHAT (Rule 5) ───────────────────────────
  {
    keywords: [
      "growth chart",
      "weight",
      "height",
      "malnourished",
      "underweight",
      "stunted",
      "බර",
      "උස",
      "எடை",
    ],
    category: "general_education",
    text: `Monitoring your child's growth is an important part of well-child care.

• In SuwaDaru, you can track weight-for-age trajectory on the "Growth" tab alongside official WHO reference standards.
• Remember: A single growth measurement is not a diagnosis. Normal, healthy children come in various shapes and sizes.
• If your child's weight or height seems low, high, or is not increasing across clinic visits, please discuss this growth chart with your PHM or a health professional.${DISCLAIMER_EN}`,
  },
] as const

const GENERAL_EDUCATIONAL_FALLBACK_EN = `SuwaDaru AI (සුවදරු AI) provides educational guidance for Sri Lankan caregivers:

• Promote age-appropriate textures (thick porridge at 6 mo, mashed lumps at 8 mo, family foods at 12 mo).
• Emphasize diverse local foods: red rice, dhal (parippu), pumpkin (wattakka), gotukola, well-cooked egg, and bone-inspected fish.
• Observe strict hygiene (handwashing with soap, boiled water) and avoid choking hazards (no whole nuts or uncut grapes).
• Never give honey or added salt/sugar under 12 months.${DISCLAIMER_EN}`

const GENERAL_EDUCATIONAL_FALLBACK_SI = `සුවදරු AI වෙතින් ශ්‍රී ලාංකික දෙමාපියන් සඳහා අධ්‍යාපනික මගපෙන්වීම්:

• වයසට ගැළපෙන ඝනත්වයෙන් ආහාර සකස් කරන්න (මාස 6දී ඝන කැඳ, මාස 8දී පොඩි කළ කෑම, අවුරුද්දෙන් පසු පවුලේ කෑම).
• දේශීය පෝෂ්‍යදායී ආහාර ලබා දෙන්න: රතු කැකුළු බත්, පරිප්පු, වට්ටක්කා, ගොටුකොළ, බිත්තර සහ කටු ඉවත් කළ මාළු.
• සනීපාරක්ෂාව සුරකින්න (සබන් යොදා අත් සේදීම, උණුකර නිවාගත් ජලය).
• හිරවීමේ අවදානම් වළක්වන්න (මුළු රටකජු, ඇට වර්ග නොදෙන්න).${DISCLAIMER_SI}`

const GENERAL_EDUCATIONAL_FALLBACK_TA = `SuwaDaru AI பெற்றோர்களுக்கான கல்வி வழிகாட்டல்:

• வயதுக்கு ஏற்ற உணவுகளை வழங்குங்கள் (6 மாதத்தில் கூழ், 8 மாதத்தில் மசித்த உணவு, 1 வயதில் குடும்ப உணவு).
• ஊட்டச்சத்து மிக்க உள்ளூர் உணவுகளைப் பயன்படுத்துங்கள்: சிவப்பு அரிசி, பருப்பு, பூசணிக்காய், முட்டை, முள் நீக்கப்பட்ட மீன்.
• உணவுப் பாதுகாப்பை உறுதி செய்யுங்கள் (கைகளை சோப்பால் கழுவுதல், கொதித்து ஆறிய நீர்).
• ஆபத்தான உணவுகளைத் தவிர்க்கவும் (முழு கொட்டைகள் கொடுக்க வேண்டாம்).${DISCLAIMER_TA}`

/**
 * Pure response selector for nutrition queries.
 * Detects language (Sinhala, Tamil, English) and returns appropriate localized guidance.
 */
export function findNutritionResponse(userQuery: string): {
  text: string
  category: ScriptedNutritionResponse["category"]
} {
  const normalized = userQuery.toLowerCase().trim()

  for (const item of SCRIPTED_RESPONSES) {
    if (item.keywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
      return { text: item.text, category: item.category }
    }
  }

  // Language-based fallback
  const hasSinhala = /[\u0D80-\u0DFF]/.test(userQuery)
  const hasTamil = /[\u0B80-\u0BFF]/.test(userQuery)

  if (hasSinhala) {
    return { text: GENERAL_EDUCATIONAL_FALLBACK_SI, category: "general_education" }
  }
  if (hasTamil) {
    return { text: GENERAL_EDUCATIONAL_FALLBACK_TA, category: "general_education" }
  }

  return { text: GENERAL_EDUCATIONAL_FALLBACK_EN, category: "general_education" }
}

/** Suggested prompt chips adapted to age contexts & SuwaDaru AI features. */
export const SUGGESTED_NUTRITION_PROMPTS = [
  "What are healthy first foods for a 6-month-old?",
  "What's in My Kitchen? Quick meal ideas",
  "Budget Meal Planner for Sri Lankan families",
  "7-Day Nutrition Plan",
  "Nutrition Learning Cards",
  "How do I prepare fish without choking risk?",
  "What textures are safe for an 8-month-old?",
  "Food hygiene and safe water guidelines",
  "What are good local Sri Lankan foods for lunch?",
  "When should complementary foods be introduced?",
  "මගේ දරුවාට මාස 8යි. අඩු වියදමකින් සකස් කළ හැකි ආහාර මොනවාද?",
  "குழந்தைக்கான ஆரோக்கியமான உணவு வழிகாட்டல்",
] as const
