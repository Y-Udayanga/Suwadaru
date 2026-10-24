import type { Child } from "@/types"
import { getTodayIsoDate } from "@/features/children/validation"

/**
 * Returns a time-of-day greeting for the caregiver.
 */
export function getCaregiverGreeting(name: string): string {
  const hour = new Date().getHours()
  let timeOfDay = "Good morning"
  if (hour >= 12 && hour < 17) {
    timeOfDay = "Good afternoon"
  } else if (hour >= 17) {
    timeOfDay = "Good evening"
  }
  return `${timeOfDay}, ${name}`
}

/**
 * Illustrative baseline milestones from official Sri Lanka EPI 2023 schedule
 * (BRD §7.3 line 144) used for demonstration teaser calculations.
 */
export const EPI_MILESTONES = [
  { ageMonths: 0, code: "BCG", name: "BCG (Tuberculosis)", label: "At birth" },
  {
    ageMonths: 2,
    code: "PENTA1_OPV1",
    name: "Pentavalent 1 + OPV 1 + fIPV 1",
    label: "2 months",
  },
  {
    ageMonths: 4,
    code: "PENTA2_OPV2",
    name: "Pentavalent 2 + OPV 2 + fIPV 2",
    label: "4 months",
  },
  {
    ageMonths: 6,
    code: "PENTA3_OPV3",
    name: "Pentavalent 3 + OPV 3",
    label: "6 months",
  },
  { ageMonths: 9, code: "MMR1", name: "MMR 1 (Measles, Mumps, Rubella)", label: "9 months" },
  { ageMonths: 12, code: "JE", name: "Live JE (Japanese Encephalitis)", label: "12 months" },
  {
    ageMonths: 18,
    code: "DTP_OPV4",
    name: "DTP Booster + OPV 4",
    label: "18 months",
  },
  { ageMonths: 36, code: "MMR2", name: "MMR 2", label: "3 years" },
  { ageMonths: 60, code: "DT_OPV5", name: "DT Booster + OPV 5", label: "5 years" },
] as const

/**
 * Adds calendar months to an ISO date (YYYY-MM-DD) without timezone drift.
 */
export function addMonthsToDate(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const targetTotalMonths = y * 12 + (m - 1) + months
  const targetYear = Math.floor(targetTotalMonths / 12)
  const targetMonth = (targetTotalMonths % 12) + 1

  // Handle month end cap
  const maxDays = new Date(targetYear, targetMonth, 0).getDate()
  const targetDay = Math.min(d, maxDays)

  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`
}

export interface NextMilestoneTeaser {
  code: string
  name: string
  ageMonths: number
  ageLabel: string
  dueDate: string
  isOverdue: boolean
}

/**
 * Computes the next scheduled EPI milestone for a child based on birthdate.
 */
export function getNextEpiMilestone(dateOfBirth: string): NextMilestoneTeaser | null {
  if (!dateOfBirth) return null
  const today = getTodayIsoDate()

  for (const m of EPI_MILESTONES) {
    const dueDate = addMonthsToDate(dateOfBirth, m.ageMonths)
    // If the due date is upcoming (today or future), or the latest milestone
    if (dueDate >= today) {
      return {
        code: m.code,
        name: m.name,
        ageMonths: m.ageMonths,
        ageLabel: m.label,
        dueDate,
        isOverdue: false,
      }
    }
  }

  // If child is older than 5 years, return last milestone with overdue indicator
  const last = EPI_MILESTONES[EPI_MILESTONES.length - 1]
  return {
    code: last.code,
    name: last.name,
    ageMonths: last.ageMonths,
    ageLabel: last.label,
    dueDate: addMonthsToDate(dateOfBirth, last.ageMonths),
    isOverdue: true,
  }
}

/**
 * Computes nutrition guidance prompt teaser based on age in months.
 */
export function getNutritionPromptTeaser(ageMonths: number): {
  title: string
  description: string
  sampleQuestion: string
} {
  if (ageMonths < 6) {
    return {
      title: "Exclusive Breastfeeding Guidance",
      description: "WHO and Ministry of Health recommend exclusive breastfeeding for the first 6 months of life.",
      sampleQuestion: "How do I know my baby is getting enough milk?",
    }
  }
  if (ageMonths < 9) {
    return {
      title: "Starting Complementary Foods",
      description: "Transitioning to smooth mashed textures: local red rice porridge, mashed papaya, and carrots.",
      sampleQuestion: "What first foods should I prepare for a 6-month-old in Sri Lanka?",
    }
  }
  if (ageMonths < 12) {
    return {
      title: "Finger Foods & Protein Diversity",
      description: "Introducing mashed dhal, fish, soft boiled egg yolk, and finger foods.",
      sampleQuestion: "How much protein should my 10-month-old eat each day?",
    }
  }
  return {
    title: "Family Meals & Balanced Diet",
    description: "Participating in family meals with diverse nutrient-dense Sri Lankan food groups.",
    sampleQuestion: "What healthy local snacks are best for an active toddler?",
  }
}

export interface ActivityEvent {
  id: string
  title: string
  detail: string
  timestamp: string
  source: string
  type: "vaccine" | "growth" | "appointment" | "profile"
}

/**
 * Returns attributed recent sample activity for the child (FR-015).
 */
export function getSampleChildActivity(child: Child): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      id: "act-1",
      title: "Child Profile Loaded",
      detail: `${child.name}'s demo record synchronized with WHO ${child.sex} growth dataset.`,
      timestamp: "Today",
      source: "System Demo Record",
      type: "profile",
    },
  ]

  if (child.birthWeightKg) {
    events.push({
      id: "act-2",
      title: "Birth Weight Recorded",
      detail: `Initial measurement ${child.birthWeightKg} kg recorded for ${child.name}.`,
      timestamp: child.dateOfBirth,
      source: child.clinicName ? `${child.clinicName} (Sample)` : "Parent Reported",
      type: "growth",
    })
  }

  const milestone = getNextEpiMilestone(child.dateOfBirth)
  if (milestone) {
    events.push({
      id: "act-3",
      title: `EPI Milestone Projected: ${milestone.code}`,
      detail: `Calculated target date ${milestone.dueDate} based on Sri Lanka 2023 schedule.`,
      timestamp: "Automated schedule rule",
      source: "EPI Sri Lanka (2023 Baseline)",
      type: "vaccine",
    })
  }

  events.push({
    id: "act-4",
    title: "MOH Routine Clinic Visit",
    detail: `Sample well-child consultation scheduled at ${child.clinicName || "Local MOH Clinic"}.`,
    timestamp: "Upcoming schedule",
    source: "Clinic Appointment Preview",
    type: "appointment",
  })

  return events
}
