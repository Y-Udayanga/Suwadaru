import { fail, ok, type HealthResult } from "../result.ts"
import type { IsoDate } from "../../../types/common.ts"
import type {
  VaccinationMilestone,
  VaccinationRecord,
  VaccinationStatus,
} from "../../../types/vaccination.ts"
import { addCalendarMonths, daysBetween, validateIsoDate } from "./calendar.ts"
import type {
  AdministeredMatch,
  BuildChildScheduleInput,
  BuildScheduleInput,
  ChildVaccinationSchedule,
  EngineDoseStatus,
  ScheduledDose,
  ScheduleDefinitionSet,
  ScheduleDoseDefinition,
} from "./types.ts"

/**
 * Presentation window used by the current vaccination screen.
 * Not an Epidemiology Unit interval and not a catch-up rule.
 */
export const PRESENTATION_DUE_WINDOW_DAYS = 14

/**
 * The shipped engine has no reviewed official pin.
 * This stays false so a schedule cannot be described as clinically approved.
 */
export function isClinicallyApprovedSchedule(
  schedule: ScheduleDefinitionSet,
): false {
  switch (schedule.provenance.usageLabel) {
    case "DEMONSTRATION_ONLY":
      return false
  }
}

/**
 * Calculate milestone dates for one child. Does not read administration records.
 * Due dates are computed from the date of birth and the dose age. None are hardcoded.
 */
export function buildVaccinationSchedule(
  input: BuildScheduleInput,
): HealthResult<VaccinationMilestone[]> {
  const built = buildChildVaccinationSchedule({ ...input, records: [] })
  if (!built.ok) return built
  return ok(built.value.doses.map(toVaccinationMilestone))
}

/**
 * Full service output: calculated doses, derived status, and matched administrations.
 * Clinic appointment instants are not accepted and are not returned.
 */
export function buildChildVaccinationSchedule(
  input: BuildChildScheduleInput,
): HealthResult<ChildVaccinationSchedule> {
  const checked = validateBuildInput(input)
  if (!checked.ok) return checked
  const { childId, dateOfBirth, today, schedule, records, dueWindowDays } =
    checked.value

  const doses: ScheduledDose[] = []
  for (const definition of schedule.doses) {
    const due = dueDateFor(dateOfBirth, definition)
    if (!due.ok) return due
    const match = matchAdministration(childId, definition.vaccineCode, dateOfBirth, today, records)
    const status = deriveDoseStatus(due.value, today, dueWindowDays, match)
    doses.push({
      id: `milestone_${childId}_${definition.vaccineCode}`,
      childId,
      vaccineCode: definition.vaccineCode,
      doseName: definition.doseName,
      vaccineName: definition.vaccineName,
      scheduledAge: definition.scheduledAge,
      dueDate: due.value,
      scheduleVersion: schedule.provenance.scheduleVersion,
      sourceUrl: schedule.provenance.sourceUrl,
      usageLabel: "DEMONSTRATION_ONLY",
      endorsement: "none",
      status,
      sharedStatus: toSharedVaccinationStatus(status),
      administration: match,
    })
  }

  return ok({
    childId,
    dateOfBirth,
    scheduleVersion: schedule.provenance.scheduleVersion,
    sourceName: schedule.provenance.sourceName,
    sourceUrl: schedule.provenance.sourceUrl,
    validatedOn: schedule.provenance.validatedOn,
    effectiveDate: schedule.provenance.effectiveDate,
    usageLabel: "DEMONSTRATION_ONLY",
    endorsement: "none",
    reviewStatus: "unreviewed_research_baseline",
    disclaimer: schedule.provenance.disclaimer,
    clinicallyApproved: false,
    doses,
    unmatchedRecords: records.filter(
      (record) => !doses.some((dose) => dose.administration?.recordId === record.id),
    ),
  })
}

export function toVaccinationMilestone(dose: ScheduledDose): VaccinationMilestone {
  return {
    id: dose.id,
    vaccineCode: dose.vaccineCode,
    vaccineName: dose.vaccineName,
    ageMonths:
      dose.scheduledAge.kind === "birth_window"
        ? null
        : dose.scheduledAge.completedMonths,
    birthWindow: dose.scheduledAge.kind === "birth_window",
    dueDate: dose.dueDate,
    scheduleVersion: dose.scheduleVersion,
    sourceUrl: dose.sourceUrl,
  }
}

export function toSharedVaccinationStatus(
  status: EngineDoseStatus,
): VaccinationStatus {
  switch (status) {
    case "upcoming":
      return "upcoming"
    case "due":
      return "due"
    case "overdue":
      return "overdue"
    case "needs_verification":
      return "completed_unverified"
    case "completed":
      return "completed_verified"
  }
}

export interface ReportedDoseFacts {
  dateOfBirth: IsoDate
  vaccineCode: string
  administeredOn: IsoDate
  knownVaccineCodes: readonly string[]
  today: IsoDate
}

/**
 * Checks a caregiver-reported dose. The returned source is always
 * `parent_reported`. A verified source cannot be produced here.
 */
export function validateReportedDose(
  facts: ReportedDoseFacts,
): HealthResult<{ administeredOn: IsoDate; source: "parent_reported" }> {
  const dob = validateIsoDate(facts.dateOfBirth)
  if (!dob.ok) return dob
  const given = validateIsoDate(facts.administeredOn)
  if (!given.ok) return given
  const today = validateIsoDate(facts.today)
  if (!today.ok) return today
  if (given.value > today.value) {
    return fail("validation", "Administered date may not be in the future.")
  }
  if (given.value < dob.value) {
    return fail(
      "validation",
      "Administered date cannot be before the child's date of birth.",
    )
  }
  const code = facts.vaccineCode.trim()
  if (!code || !facts.knownVaccineCodes.includes(facts.vaccineCode)) {
    return fail(
      "validation",
      `Vaccine code "${facts.vaccineCode}" is not in the active schedule version.`,
    )
  }
  return ok({ administeredOn: given.value, source: "parent_reported" })
}

interface CheckedBuild extends BuildChildScheduleInput {
  dueWindowDays: number
}

function validateBuildInput(
  input: BuildChildScheduleInput,
): HealthResult<CheckedBuild> {
  if (!input.childId || input.childId.trim() === "") {
    return fail("validation", "Child id is required.")
  }
  const dob = validateIsoDate(input.dateOfBirth)
  if (!dob.ok) return dob
  const today = validateIsoDate(input.today)
  if (!today.ok) return today
  if (dob.value > today.value) {
    return fail("validation", "Date of birth may not be in the future.")
  }
  const scheduleError = validateSchedule(input.schedule)
  if (scheduleError) return scheduleError
  const dueWindowDays = input.dueWindowDays ?? PRESENTATION_DUE_WINDOW_DAYS
  if (!Number.isInteger(dueWindowDays) || dueWindowDays < 0) {
    return fail("validation", "Due window must be a non-negative integer number of days.")
  }
  return ok({ ...input, dateOfBirth: dob.value, today: today.value, dueWindowDays })
}

function validateSchedule(
  schedule: ScheduleDefinitionSet,
): HealthResult<never> | null {
  const provenance = schedule.provenance
  if (provenance.usageLabel !== "DEMONSTRATION_ONLY") {
    return fail(
      "validation",
      "Schedule usage label must stay DEMONSTRATION_ONLY until a reviewed official pin exists.",
    )
  }
  if (provenance.endorsement !== "none") {
    return fail("validation", "This engine cannot mark a schedule as clinically approved.")
  }
  if (provenance.reviewStatus !== "unreviewed_research_baseline") {
    return fail(
      "validation",
      "A professionally reviewed schedule is not available. No official pin has been recorded.",
    )
  }
  if (!provenance.scheduleVersion.trim() || !provenance.sourceName.trim()) {
    return fail("validation", "Schedule version and source name are required.")
  }
  if (!provenance.sourceUrl.startsWith("https://")) {
    return fail("validation", "Schedule source URL must be an https URL.")
  }
  if (!provenance.disclaimer.includes("DEMONSTRATION_ONLY")) {
    return fail("validation", "Schedule disclaimer must state DEMONSTRATION_ONLY.")
  }
  const validated = optionalDate(provenance.validatedOn, "Validation date")
  if (!validated.ok) return validated
  const effective = optionalDate(provenance.effectiveDate, "Effective date")
  if (!effective.ok) return effective

  const seen = new Set<string>()
  if (schedule.doses.length === 0) return null
  for (const definition of schedule.doses) {
    const doseError = validateDoseDefinition(definition, seen)
    if (doseError) return doseError
  }
  return null
}

function optionalDate(
  value: IsoDate | null,
  label: string,
): HealthResult<IsoDate | null> {
  if (value === null) return ok(null)
  const parsed = validateIsoDate(value)
  if (!parsed.ok) {
    return fail("validation", `${label} must be YYYY-MM-DD or null.`)
  }
  return ok(parsed.value)
}

function validateDoseDefinition(
  definition: ScheduleDoseDefinition,
  seen: Set<string>,
): HealthResult<never> | null {
  if (!definition.vaccineCode.trim() || !definition.doseName.trim()) {
    return fail("validation", "Each dose needs a vaccine code and a dose name.")
  }
  if (seen.has(definition.vaccineCode)) {
    return fail(
      "validation",
      `Vaccine code "${definition.vaccineCode}" is repeated in this schedule version.`,
    )
  }
  seen.add(definition.vaccineCode)
  const age = definition.scheduledAge
  if (age.kind === "birth_window") {
    if (age.completedMonths !== null) {
      return fail("validation", "A birth-window dose has no completed-month age.")
    }
    return null
  }
  if (!Number.isInteger(age.completedMonths) || age.completedMonths < 0) {
    return fail(
      "validation",
      `Scheduled age for "${definition.vaccineCode}" must be a non-negative whole number of months.`,
    )
  }
  return null
}

function dueDateFor(
  dateOfBirth: IsoDate,
  definition: ScheduleDoseDefinition,
): HealthResult<IsoDate> {
  if (definition.scheduledAge.kind === "birth_window") return ok(dateOfBirth)
  return addCalendarMonths(dateOfBirth, definition.scheduledAge.completedMonths)
}

function deriveDoseStatus(
  dueDate: IsoDate,
  today: IsoDate,
  dueWindowDays: number,
  match: AdministeredMatch | null,
): EngineDoseStatus {
  if (match) {
    return match.source === "health_worker_verified"
      ? "completed"
      : "needs_verification"
  }
  if (dueDate < today) return "overdue"
  const daysUntil = daysBetween(today, dueDate)
  return daysUntil <= dueWindowDays ? "due" : "upcoming"
}

function matchAdministration(
  childId: string,
  vaccineCode: string,
  dateOfBirth: IsoDate,
  today: IsoDate,
  records: readonly VaccinationRecord[],
): AdministeredMatch | null {
  const candidates = records.filter((record) => {
    if (record.childId !== childId || record.vaccineCode !== vaccineCode) return false
    if (record.administeredOn === null) return false
    const given = validateIsoDate(record.administeredOn)
    if (!given.ok) return false
    if (given.value < dateOfBirth || given.value > today) return false
    return record.source === "health_worker_verified" ||
      record.source === "parent_reported" ||
      record.source === "demo"
  })
  const verified = candidates.find((record) => record.source === "health_worker_verified")
  const chosen = verified ?? latestByDate(candidates)
  if (!chosen || chosen.administeredOn === null) return null
  return {
    recordId: chosen.id,
    administeredOn: chosen.administeredOn,
    source: chosen.source,
    ...(chosen.verifiedBy ? { verifiedBy: chosen.verifiedBy } : {}),
  }
}

function latestByDate(records: VaccinationRecord[]): VaccinationRecord | undefined {
  return [...records].sort((left, right) => {
    const leftDate = left.administeredOn ?? ""
    const rightDate = right.administeredOn ?? ""
    return rightDate.localeCompare(leftDate)
  })[0]
}

