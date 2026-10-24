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
  "common.backToProfile": { en: "Back to profile", si: "දරුවාගේ තොරතුරු වෙත" },
  "common.demoNotice": {
    en: "Demonstration preview only. Always verify with physical CHDR and your Public Health Midwife (PHM).",
    si: "නිරූපණ පෙරදසුනක් පමණි. සෑම විටම භෞතික ළමා සෞඛ්‍ය සංවර්ධන සටහන් පොත (CHDR) සහ ප්‍රදේශයේ පවුල් සෞඛ්‍ය සේවා නිලධාරිනිය (PHM) සමඟ තහවුරු කරගන්න.",
  },

  // Landing Page
  "landing.hero.badge": {
    en: "Caregiver Health Companion • Prototype Demonstration",
    si: "සත්කාරක ළමා සෞඛ්‍ය සහකාර • ආදර්ශන නිරූපණය",
  },
  "landing.hero.title1": {
    en: "Every Child. Every Milestone.",
    si: "සෑම දරුවෙක්ම. සෑම සන්ධිස්ථානයක්ම.",
  },
  "landing.hero.title2": {
    en: "A Healthier, Brighter Tomorrow.",
    si: "නීරෝගී, දීප්තිමත් හෙට දවසක්.",
  },
  "landing.hero.description": {
    en: "A digital companion for caregivers in Sri Lanka alongside the physical Child Health Development Record (CHDR). View EPI immunization schedules, track WHO growth standards, organize MOH clinic visits, and explore practical child nutrition guidance.",
    si: "ශ්‍රී ලංකාවේ දෙමාපියන් සහ රැකබලා ගන්නන් සඳහා ළමා සෞඛ්‍ය සංවර්ධන වාර්තාවට (CHDR) අත්වැලක් වන ඩිජිටල් සහකාර සේවාව. EPI ජාතික එන්නත් කාලසටහන, WHO වර්ධන ප්‍රමිතීන්, MOH සායන හමුවීම් සහ ප්‍රායෝගික පෝෂණ මගපෙන්වීම් එක්තැන්ව.",
  },
  "landing.hero.explore": {
    en: "Explore Demo",
    si: "ආදර්ශනය අත්හදා බලන්න",
  },
  "landing.hero.signIn": {
    en: "Sign In to Demo",
    si: "ඇතුල් වන්න",
  },
  "landing.hero.zeroPii": {
    en: "Zero real PII collected",
    si: "පෞද්ගලික රහස්‍යතා සුරක්ෂිතයි",
  },
  "landing.hero.mobileDesktop": {
    en: "Works on mobile & desktop",
    si: "ජංගම දුරකථන සහ පරිගණක සඳහා",
  },
  "landing.hero.epiSchedule": {
    en: "EPI 2023 baseline schedule",
    si: "ජාතික එන්නත් කාලසටහනට අනුකූලයි",
  },
  "landing.stats.milestones": {
    en: "12+ Milestones",
    si: "එන්නත් සන්ධිස්ථාන 12+",
  },
  "landing.stats.milestonesSub": {
    en: "Automated EPI Schedule from birth",
    si: "උපතේ සිට ස්වයංක්‍රීය කාලසටහන",
  },
  "landing.stats.growth": {
    en: "WHO Z-Scores",
    si: "WHO වර්ධන ප්‍රමිතීන්",
  },
  "landing.stats.growthSub": {
    en: "Sex-specific Growth Curves",
    si: "ස්ත්‍රී / පුරුෂ වර්ධන වක්‍ර",
  },
  "landing.stats.ai": {
    en: "3 Languages",
    si: "භාෂා 3 කින්",
  },
  "landing.stats.aiSub": {
    en: "Sinhala, Tamil & English AI",
    si: "සිංහල, දෙමළ සහ ඉංග්‍රීසි AI සහකාර",
  },
  "landing.stats.clinics": {
    en: "MOH Clinics",
    si: "MOH සායන හමුවීම්",
  },
  "landing.stats.clinicsSub": {
    en: "Organized visit timelines",
    si: "සායන හමුවීම් පහසුවෙන්",
  },
  "landing.showcase.badge": {
    en: "Interactive Experience",
    si: "අන්තර්ක්‍රියාකාරී පෙරදසුන",
  },
  "landing.showcase.title": {
    en: "Explore How SuwaDaru Cares",
    si: "සුවදරු ක්‍රියාත්මක වන අයුරු බලන්න",
  },
  "landing.showcase.subtitle": {
    en: "Click across the core modules below to preview how caregivers experience the platform.",
    si: "මව්වරුන් සහ පියවරුන් වේදිකාව භාවිතා කරන ආකාරය පෙරදසුන් කිරීමට පහත අංශ මත ක්ලික් කරන්න.",
  },
  "landing.why.title": {
    en: "Why We Are Building SuwaDaru",
    si: "අප සුවදරු ගොඩනගන්නේ ඇයි?",
  },
  "landing.why.subtitle": {
    en: "Sri Lanka's physical CHDR is vital, but paper records face everyday challenges over five years of active handling.",
    si: "ශ්‍රී ලංකාවේ භෞතික CHDR පොත අතිශය වැදගත් වුවත්, වසර පහක් පුරා කඩදාසි සටහන් පොත් නිතර භාවිතා කිරීමේදී අභියෝග රැසකට මුහුණ දෙයි.",
  },
  "landing.modules.title": {
    en: "Core Companion Modules",
    si: "ප්‍රධාන සේවා මොඩියුල",
  },
  "landing.modules.subtitle": {
    en: "Designed for simplicity, clear attribution, and zero medical guesswork.",
    si: "පහසුවෙන් භාවිත කළ හැකි පරිදි, වෛද්‍යමය අනුමානවලින් තොරව නිර්මාණය කර ඇත.",
  },
  "landing.steps.title": {
    en: "How SuwaDaru Works in 3 Steps",
    si: "සුවදරු පියවර 3 කින් ක්‍රියාත්මක වන ආකාරය",
  },

  // Dashboard Page
  "dashboard.welcome": { en: "Welcome,", si: "ආයුබෝවන්," },
  "dashboard.caregiver": { en: "Caregiver", si: "සත්කාරක" },
  "dashboard.summary": { en: "Child Profile Summary", si: "දරුවාගේ තොරතුරු සාරාංශය" },
  "dashboard.nextMilestone": { en: "Next Vaccine Milestone", si: "මීළඟ එන්නත් සන්ධිස්ථානය" },
  "dashboard.lastWeight": { en: "Last Measured Weight", si: "නවතම සටහන් වූ බර" },
  "dashboard.nextClinic": { en: "Next Clinic Appointment", si: "මීළඟ සායන හමුවීම" },
  "dashboard.recentActivity": { en: "Recent Activity Log", si: "මෑත කාලීන ක්‍රියාකාරකම්" },
  "dashboard.noActivity": { en: "No recent activity recorded yet.", si: "තවමත් මෑත ක්‍රියාකාරකම් සටහන් වී නොමැත." },
  "dashboard.actionVaccines": { en: "Review EPI Schedule", si: "එන්නත් කාලසටහන බලන්න" },
  "dashboard.actionGrowth": { en: "Track WHO Curves", si: "වර්ධන වක්‍ර බලන්න" },
  "dashboard.actionNutrition": { en: "Ask Food Assistant", si: "පෝෂණ උපදෙස් විමසන්න" },
  "dashboard.actionAppointments": { en: "View Clinic Visits", si: "සායන හමුවීම් බලන්න" },

  // Feature specific: Report
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

  // Vaccinations Page
  "vaccines.title": { en: "EPI Immunization Timeline", si: "ජාතික ප්‍රතිශක්තිකරණ කාලසටහන (EPI)" },
  "vaccines.subtitle": { en: "Automated milestones calculated from child's birth date", si: "දරුවාගේ උපන් දිනය අනුව ගණනය කළ නිල එන්නත් සන්ධිස්ථාන" },
  "vaccines.recordDose": { en: "Record Dose", si: "එන්නතක් සටහන් කරන්න" },
  "vaccines.filterAll": { en: "All Milestones", si: "සියලු එන්නත්" },
  "vaccines.filterDue": { en: "Due Now", si: "ලබා දිය යුතු" },
  "vaccines.filterUpcoming": { en: "Upcoming", si: "ඉදිරියට නියමිත" },
  "vaccines.filterReported": { en: "Reported", si: "සටහන් කළ" },
  "vaccines.filterCompleted": { en: "Completed", si: "සම්පූර්ණයි" },

  // Growth Page
  "growth.title": { en: "WHO Growth Standards", si: "WHO ළමා වර්ධන ප්‍රමිතීන්" },
  "growth.subtitle": { en: "Weight-for-age trajectory against WHO sex-specific standards", si: "ලෝක සෞඛ්‍ය සංවිධානයේ ස්ත්‍රී/පුරුෂ ප්‍රමිතීන්ට අදාළ බර වර්ධන වක්‍රය" },
  "growth.addMeasurement": { en: "Add Measurement", si: "නව මිනුමක් එක් කරන්න" },
  "growth.weightKg": { en: "Weight (kg)", si: "බර (කි.ග්‍රෑ)" },
  "growth.heightCm": { en: "Length / Height (cm)", si: "උස (සෙ.මී)" },
  "growth.headCm": { en: "Head Circumference (cm)", si: "හිසේ වටප්‍රමාණය (සෙ.මී)" },
  "growth.measuredOn": { en: "Measured On", si: "මැන බැලූ දිනය" },
  "growth.history": { en: "Measurement History", si: "මිනුම් ඉතිහාසය" },

  // Nutrition Page
  "nutrition.title": { en: "Food & Feeding Assistant", si: "පෝෂණ සහ ආහාර සහකාර" },
  "nutrition.badge": { en: "SuwaDaru AI (සුවදරු AI) • Pediatric Companion", si: "සුවදරු AI (SuwaDaru AI) • ළමා පෝෂණ සහකාර" },
  "nutrition.suggestions": { en: "Suggestions:", si: "යෝජනා:" },
  "nutrition.placeholder": { en: "Ask SuwaDaru AI in Sinhala, Tamil, or English...", si: "ආහාර, පරිප්පු, මාළු, ඝනත්වය හෝ ජල ආරක්ෂාව ගැන විමසන්න..." },

  // Appointments Page
  "appointments.title": { en: "MOH Clinic Visits", si: "MOH සායන හමුවීම්" },
  "appointments.subtitle": { en: "Manage scheduled clinic dates and locations", si: "සායන හමුවීම් සහ පැමිණීම් පහසුවෙන් කළමනාකරණය කරන්න" },
  "appointments.new": { en: "Schedule New Appointment", si: "නව සායන හමුවීමක් එක් කරන්න" },
  "appointments.upcoming": { en: "Upcoming Appointments", si: "ඉදිරි සායන හමුවීම්" },
  "appointments.past": { en: "Past Visits", si: "පසුගිය සායන හමුවීම්" },

  // Auth Pages
  "auth.signInTitle": { en: "Sign in to SuwaDaru", si: "සුවදරු වෙත ඇතුල් වන්න" },
  "auth.registerTitle": { en: "Create Demo Account", si: "නව ආදර්ශන ගිණුමක් සාදන්න" },
  "auth.forgotTitle": { en: "Reset Password Preview", si: "මුරපද ප්‍රතිසාධන පෙරදසුන" },
  "auth.email": { en: "Email address", si: "විද්‍යුත් තැපෑල (Email)" },
  "auth.password": { en: "Password", si: "මුරපදය (Password)" },
  "auth.confirmPassword": { en: "Confirm password", si: "මුරපදය තහවුරු කරන්න" },
  "auth.name": { en: "Caregiver display name", si: "සත්කාරකගේ නම" },
  "auth.demoBanner": { en: "Demo Mode — no real account is created", si: "ආදර්ශන මාදිලිය — සැබෑ ගිණුමක් නිර්මාණය නොවේ" },
  "auth.noAccount": { en: "Don't have an account?", si: "ගිණුමක් නැද්ද?" },
  "auth.haveAccount": { en: "Already have an account?", si: "දැනටමත් ගිණුමක් තිබේද?" },
} as const

export type TranslationKey = keyof typeof translations
