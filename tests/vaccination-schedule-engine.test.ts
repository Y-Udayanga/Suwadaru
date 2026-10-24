import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { addCalendarMonths } from "../src/domain/health/vaccination/calendar.ts"
import { getDemonstrationEpiSchedule } from "./fixtures/demonstration-schedule.ts"
import {
  PRESENTATION_DUE_WINDOW_DAYS,
  buildChildVaccinationSchedule,
  buildVaccinationSchedule,
  isClinicallyApprovedSchedule,
  validateReportedDose,
} from "../src/domain/health/vaccination/engine.ts"
import type {
  ScheduleDefinitionSet,
  ScheduleDoseDefinition,
} from "../src/domain/health/vaccination/types.ts"
import type { VaccinationRecord } from "../src/types/vaccination.ts"

const demo = getDemonstrationEpiSchedule()

function dose(
  vaccineCode: string,
  completedMonths: number | null,
  doseName = vaccineCode,
): ScheduleDoseDefinition {
  return {
    vaccineCode,
    doseName,
    vaccineName: doseName,
    scheduledAge:
      completedMonths === null
        ? { kind: "birth_window", completedMonths: null }
        : { kind: "completed_months", completedMonths },
  }
}

function schedule(
  version: string,
  doses: readonly ScheduleDoseDefinition[],
): ScheduleDefinitionSet {
  return {
    provenance: { ...demo.provenance, scheduleVersion: version },
    doses,
  }
}

function record(
  partial: Pick<VaccinationRecord, "vaccineCode" | "administeredOn" | "source"> &
    Partial<VaccinationRecord>,
): VaccinationRecord {
  return {
    id: partial.id ?? `rec_${partial.vaccineCode}`,
    childId: partial.childId ?? "child_test",
    vaccineCode: partial.vaccineCode,
    administeredOn: partial.administeredOn,
    source: partial.source,
    verifiedBy: partial.verifiedBy,
  }
}

function mustSchedule(input: {
  childId?: string
  dateOfBirth: string
  today: string
  schedule?: ScheduleDefinitionSet
  records?: readonly VaccinationRecord[]
  dueWindowDays?: number
}) {
  const result = buildChildVaccinationSchedule({
    childId: input.childId ?? "child_test",
    dateOfBirth: input.dateOfBirth,
    today: input.today,
    schedule: input.schedule ?? demo,
    records: input.records ?? [],
    dueWindowDays: input.dueWindowDays,
  })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error("expected a schedule")
  return result.value
}

describe("Sri Lanka EPI schedule engine", () => {
  it("labels the shipped configuration DEMONSTRATION_ONLY and not clinically approved", () => {
    assert.equal(demo.provenance.usageLabel, "DEMONSTRATION_ONLY")
    assert.equal(demo.provenance.endorsement, "none")
    assert.equal(demo.provenance.reviewStatus, "unreviewed_research_baseline")
    assert.equal(demo.provenance.validatedOn, null)
    assert.equal(demo.provenance.effectiveDate, null)
    assert.equal(demo.provenance.citedPublicationYear, 2023)
    assert.equal(
      demo.provenance.sourceName,
      "Epidemiology Unit, Ministry of Health, Sri Lanka",
    )
    assert.equal(
      demo.provenance.sourceUrl,
      "https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf",
    )
    assert.match(demo.provenance.disclaimer, /DEMONSTRATION_ONLY/)
    assert.equal(isClinicallyApprovedSchedule(demo), false)
    assert.equal(demo.doses.some((item) => "dueDate" in item), false)
  })

  it("uses completed months from the BRD research baseline, not fixed dates", () => {
    const ages = Object.fromEntries(
      demo.doses.map((item) => [
        item.vaccineCode,
        item.scheduledAge.kind === "birth_window"
          ? null
          : item.scheduledAge.completedMonths,
      ]),
    )
    assert.deepEqual(ages, {
      BCG: null,
      PENTA1: 2,
      OPV1: 2,
      fIPV1: 2,
      PENTA2: 4,
      OPV2: 4,
      fIPV2: 4,
      PENTA3: 6,
      OPV3: 6,
      MMR1: 9,
      JE: 12,
      DTP_BOOST: 18,
      OPV4: 18,
      MMR2: 36,
      DT_BOOST: 60,
      OPV5: 60,
    })
  })

  describe("calendar-month dates", () => {
    it("clamps 31 January without using a 30-day month", () => {
      assert.deepEqual(addCalendarMonths("2025-01-31", 1), {
        ok: true,
        value: "2025-02-28",
      })
      assert.deepEqual(addCalendarMonths("2024-01-31", 1), {
        ok: true,
        value: "2024-02-29",
      })
      const child = mustSchedule({
        dateOfBirth: "2025-01-31",
        today: "2025-01-31",
      })
      assert.equal(child.doses.find((item) => item.vaccineCode === "PENTA1")?.dueDate, "2025-03-31")
      assert.equal(child.doses.find((item) => item.vaccineCode === "JE")?.dueDate, "2026-01-31")
    })

    it("generates milestones for a child born on 1 January", () => {
      const child = mustSchedule({
        dateOfBirth: "2024-01-01",
        today: "2024-01-01",
      })
      assert.equal(child.doses.find((item) => item.vaccineCode === "BCG")?.dueDate, "2024-01-01")
      assert.equal(child.doses.find((item) => item.vaccineCode === "PENTA1")?.dueDate, "2024-03-01")
      assert.equal(child.doses.find((item) => item.vaccineCode === "MMR1")?.dueDate, "2024-10-01")
      assert.equal(child.doses.find((item) => item.vaccineCode === "MMR2")?.dueDate, "2027-01-01")
      assert.equal(child.doses.find((item) => item.vaccineCode === "OPV5")?.dueDate, "2029-01-01")
    })

    it("clamps a 29 February birthday onto a non-leap anniversary", () => {
      assert.deepEqual(addCalendarMonths("2024-02-29", 12), {
        ok: true,
        value: "2025-02-28",
      })
      assert.deepEqual(addCalendarMonths("2024-02-29", 48), {
        ok: true,
        value: "2028-02-29",
      })
      const child = mustSchedule({
        dateOfBirth: "2024-02-29",
        today: "2024-02-29",
      })
      assert.equal(child.doses.find((item) => item.vaccineCode === "BCG")?.dueDate, "2024-02-29")
      assert.equal(child.doses.find((item) => item.vaccineCode === "JE")?.dueDate, "2025-02-28")
      assert.equal(child.doses.find((item) => item.vaccineCode === "MMR2")?.dueDate, "2027-02-28")
    })
  })

  describe("newborn, future birth, and invalid dates", () => {
    it("keeps a newborn birth dose due and later doses upcoming", () => {
      const child = mustSchedule({
        dateOfBirth: "2026-06-01",
        today: "2026-06-01",
      })
      const bcg = child.doses.find((item) => item.vaccineCode === "BCG")
      const penta = child.doses.find((item) => item.vaccineCode === "PENTA1")
      assert.equal(bcg?.status, "due")
      assert.equal(bcg?.administration, null)
      assert.equal(penta?.status, "upcoming")
      assert.equal(penta?.dueDate, "2026-08-01")
    })

    it("rejects a future date of birth", () => {
      const result = buildChildVaccinationSchedule({
        childId: "child_test",
        dateOfBirth: "2026-06-02",
        today: "2026-06-01",
        schedule: demo,
        records: [],
      })
      assert.equal(result.ok, false)
      if (result.ok) return
      assert.equal(result.error.code, "validation")
    })

    it("rejects impossible and malformed dates", () => {
      for (const dateOfBirth of ["2025-02-31", "2024-02-30", "2025-13-01", "15-04-2025", "2025-1-01"]) {
        const result = buildVaccinationSchedule({
          childId: "child_test",
          dateOfBirth,
          today: "2026-01-01",
          schedule: demo,
        })
        assert.equal(result.ok, false, dateOfBirth)
        if (!result.ok) assert.equal(result.error.code, "validation")
      }
    })
  })

  describe("administration status", () => {
    const today = "2026-06-01"
    const dateOfBirth = "2024-01-01"

    it("does not mark a dose completed when no administration is recorded", () => {
      const child = mustSchedule({ dateOfBirth, today, dueWindowDays: 14 })
      const bcg = child.doses.find((item) => item.vaccineCode === "BCG")
      assert.equal(bcg?.dueDate, "2024-01-01")
      assert.equal(bcg?.status, "overdue")
      assert.equal(bcg?.sharedStatus, "overdue")
      assert.equal(bcg?.administration, null)
      assert.equal("scheduledAt" in (bcg ?? {}), false)
    })

    it("marks only a health-worker record as completed", () => {
      const child = mustSchedule({
        dateOfBirth,
        today,
        records: [
          record({
            vaccineCode: "BCG",
            administeredOn: "2024-01-02",
            source: "health_worker_verified",
            verifiedBy: "future-worker",
          }),
        ],
      })
      const bcg = child.doses.find((item) => item.vaccineCode === "BCG")
      assert.equal(bcg?.status, "completed")
      assert.equal(bcg?.sharedStatus, "completed_verified")
      assert.equal(bcg?.administration?.source, "health_worker_verified")
      assert.equal(bcg?.administration?.verifiedBy, "future-worker")
      assert.equal(bcg?.dueDate, "2024-01-01")
    })

    it("preserves parent-reported and demo records as needs verification", () => {
      const child = mustSchedule({
        dateOfBirth,
        today,
        records: [
          record({
            vaccineCode: "PENTA1",
            administeredOn: "2024-03-02",
            source: "parent_reported",
          }),
          record({
            id: "rec_opv_demo",
            vaccineCode: "OPV1",
            administeredOn: "2024-03-02",
            source: "demo",
          }),
        ],
      })
      const penta = child.doses.find((item) => item.vaccineCode === "PENTA1")
      const opv = child.doses.find((item) => item.vaccineCode === "OPV1")
      assert.equal(penta?.status, "needs_verification")
      assert.equal(penta?.sharedStatus, "completed_unverified")
      assert.equal(penta?.administration?.source, "parent_reported")
      assert.equal(opv?.status, "needs_verification")
      assert.equal(opv?.administration?.source, "demo")
      assert.notEqual(penta?.status, "completed")
    })

    it("leaves an overdue dose on its original due date instead of inventing a catch-up date", () => {
      const child = mustSchedule({ dateOfBirth: "2024-01-01", today: "2026-06-01" })
      const mmr = child.doses.find((item) => item.vaccineCode === "MMR1")
      assert.equal(mmr?.status, "overdue")
      assert.equal(mmr?.dueDate, "2024-10-01")
      assert.notEqual(mmr?.dueDate, today)
    })

    it("ignores a record with no administration date", () => {
      const child = mustSchedule({
        dateOfBirth,
        today,
        records: [
          record({ vaccineCode: "BCG", administeredOn: null, source: "parent_reported" }),
        ],
      })
      const bcg = child.doses.find((item) => item.vaccineCode === "BCG")
      assert.equal(bcg?.status, "overdue")
      assert.equal(bcg?.administration, null)
      assert.equal(child.unmatchedRecords.length, 1)
    })

    it("uses the 14-day presentation window only to separate due from upcoming", () => {
      assert.equal(PRESENTATION_DUE_WINDOW_DAYS, 14)
      const dueToday = mustSchedule({
        dateOfBirth: "2026-06-01",
        today: "2026-08-01",
        dueWindowDays: 14,
      })
      assert.equal(
        dueToday.doses.find((item) => item.vaccineCode === "PENTA1")?.status,
        "due",
      )
      const upcoming = mustSchedule({
        dateOfBirth: "2026-06-01",
        today: "2026-06-01",
        dueWindowDays: 14,
      })
      assert.equal(
        upcoming.doses.find((item) => item.vaccineCode === "PENTA1")?.status,
        "upcoming",
      )
    })
  })

  describe("schedule version changes", () => {
    it("copies the supplied version and recalculates dates from that version's ages", () => {
      const first = mustSchedule({
        dateOfBirth: "2024-01-31",
        today: "2024-01-31",
        schedule: schedule("version-a", [dose("TEST1", 1, "Test dose A")]),
      })
      const second = mustSchedule({
        dateOfBirth: "2024-01-31",
        today: "2024-01-31",
        schedule: schedule("version-b", [dose("TEST1", 2, "Test dose B")]),
      })
      assert.equal(first.scheduleVersion, "version-a")
      assert.equal(second.scheduleVersion, "version-b")
      assert.equal(first.doses[0]?.dueDate, "2024-02-29")
      assert.equal(second.doses[0]?.dueDate, "2024-03-31")
      assert.equal(first.usageLabel, "DEMONSTRATION_ONLY")
      assert.equal(first.clinicallyApproved, false)
      assert.equal(second.clinicallyApproved, false)
    })
  })

  describe("reported dose validation", () => {
    it("accepts a parent-reported dose and refuses a future or unknown code", () => {
      const accepted = validateReportedDose({
        dateOfBirth: "2024-01-01",
        vaccineCode: "BCG",
        administeredOn: "2024-01-03",
        knownVaccineCodes: demo.doses.map((item) => item.vaccineCode),
        today: "2026-01-01",
      })
      assert.deepEqual(accepted, {
        ok: true,
        value: { administeredOn: "2024-01-03", source: "parent_reported" },
      })

      const future = validateReportedDose({
        dateOfBirth: "2024-01-01",
        vaccineCode: "BCG",
        administeredOn: "2026-02-01",
        knownVaccineCodes: ["BCG"],
        today: "2026-01-01",
      })
      assert.equal(future.ok, false)

      const unknown = validateReportedDose({
        dateOfBirth: "2024-01-01",
        vaccineCode: "NOT_A_VACCINE",
        administeredOn: "2024-02-01",
        knownVaccineCodes: ["BCG"],
        today: "2026-01-01",
      })
      assert.equal(unknown.ok, false)
    })
  })
})
