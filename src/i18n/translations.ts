/**
 * SuwaDaru Bilingual Translation Dictionary (English & Sinhala)
 * Specially curated for Sri Lankan maternal and child healthcare.
 */

export type Language = "en" | "si"

export const translations = {
  // Navigation
  "nav.home": { en: "Home", si: "මුල් පිටුව" },
  "nav.signIn": { en: "Sign in", si: "ඇතුල් වන්න" },
  "nav.register": { en: "Register", si: "ලියාපදිංචිය" },
  "nav.recovery": { en: "Reset password", si: "මුරපද ප්‍රතිසාධනය" },
  "nav.dashboard": { en: "Dashboard", si: "ප්‍රධාන පුවරුව" },
  "nav.addChild": { en: "Add Child", si: "දරුවෙකු එක් කරන්න" },
  "nav.overview": { en: "Overview", si: "දළ විශ්ලේෂණය" },
  "nav.vaccinations": { en: "Vaccinations", si: "එන්නත් සටහන්" },
  "nav.growth": { en: "Growth", si: "වර්ධන සටහන්" },
  "nav.nutrition": { en: "Nutrition", si: "පෝෂණ උපදෙස්" },
  "nav.appointments": { en: "Appointments", si: "සායන හමුවීම්" },
  "nav.signOut": { en: "Sign out", si: "ඉවත් වන්න" },
  "nav.general": { en: "General", si: "පොදු" },
  "nav.records": { en: "Records", si: "වාර්තා" },

  // Common UI Actions & Badges
  "common.save": { en: "Save", si: "සුරකින්න" },
  "common.cancel": { en: "Cancel", si: "අවලංගු කරන්න" },
  "common.edit": { en: "Edit", si: "සංස්කරණය" },
  "common.delete": { en: "Delete", si: "මකන්න" },
  "common.markCompleted": { en: "Mark completed", si: "සම්පූර්ණයි" },
  "common.scheduled": { en: "Scheduled", si: "නියමිතයි" },
  "common.completed": { en: "Completed", si: "සම්පූර්ණයි" },
  "common.cancelled": { en: "Cancelled", si: "අවලංගුයි" },
  "common.overdue": { en: "Overdue", si: "ප්‍රමාදයි" },
  "common.upcoming": { en: "Upcoming", si: "ඉදිරියට" },
  "common.past": { en: "Past", si: "පසුගිය" },
  "common.loading": { en: "Loading...", si: "පූරණය වෙමින්..." },
  "common.dob": { en: "Date of Birth", si: "උපන් දිනය" },
  "common.age": { en: "Age", si: "වයස" },
  "common.months": { en: "months", si: "මාස" },
  "common.years": { en: "years", si: "අවුරුදු" },
  "common.sex": { en: "Sex", si: "ස්ත්‍රී / පුරුෂ" },
  "common.male": { en: "Male", si: "පිරිමි" },
  "common.female": { en: "Female", si: "ගැහැණු" },
  "common.birthWeight": { en: "Birth Weight", si: "උපත් බර" },
  "common.clinic": { en: "Clinic", si: "සායනය" },
  "common.switchChild": { en: "Switch child", si: "දරුවා මාරු කරන්න" },
  "common.chdrReport": { en: "CHDR Report (PDF)", si: "සෞඛ්‍ය වාර්තාව (PDF/Print)" },
  "common.printReport": { en: "Download / Print CHDR Report (PDF)", si: "CHDR වාර්තාව බාගත කරන්න / මුද්‍රණය (PDF)" },
  "common.reportPreview": { en: "Digital CHDR Report Preview", si: "ඩිජිටල් CHDR වාර්තා පෙරදසුන" },
  "common.print": { en: "Print / Save PDF", si: "මුද්‍රණය / PDF සුරකින්න" },
  "common.close": { en: "Close", si: "වසන්න" },
  "common.demoNotice": {
    en: "Demonstration preview only. Always verify with physical CHDR and your Public Health Midwife (PHM).",
    si: "නිරූපණ පෙරදසුනක් පමණි. සෑම විටම භෞතික ළමා සෞඛ්‍ය සංවර්ධන සටහන් පොත (CHDR) සහ ප්‍රදේශයේ පවුල් සෞඛ්‍ය සේවා නිලධාරිනිය (PHM) සමඟ තහවුරු කරගන්න.",
  },

  // Feature specific
  "report.title": {
    en: "Child Health & Development Summary Report",
    si: "ළමා සෞඛ්‍ය සහ සංවර්ධන සාරාංශ වාර්තාව",
  },
  "report.subtitle": {
    en: "Official Companion to Sri Lanka Child Health Development Record (CHDR)",
    si: "ශ්‍රී ලංකා ළමා සෞඛ්‍ය සංවර්ධන වාර්තාවේ (CHDR) ඩිජිටල් සහකාර සටහන",
  },
  "report.vaccineSection": { en: "Immunization Milestones & Records", si: "ප්‍රතිශක්තිකරණ එන්නත් සටහන්" },
  "report.growthSection": { en: "Growth Monitoring Measurements", si: "වර්ධන මිනුම් සටහන් (බර, උස, හිසේ වටප්‍රමාණය)" },
  "report.appointmentsSection": { en: "Clinic Visits & Appointments", si: "සායන හමුවීම් සහ පැමිණීම්" },
  "report.generatedOn": { en: "Generated On", si: "වාර්තාව සකස් කළ දිනය" },
  "report.parentReported": { en: "Parent reported", si: "දෙමාපියන් සටහන් කළ" },
  "report.verified": { en: "Verified", si: "තහවුරු කළ" },
} as const

export type TranslationKey = keyof typeof translations
