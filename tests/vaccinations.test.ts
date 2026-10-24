import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { AppError } from "../src/services/contracts/index.ts"
import { vaccinationService } from "../src/features/vaccinations/vaccinationService.ts"
import {
  EPI_SCHEDULE_METADATA,
  EPI_SCHEDULE_DEFINITIONS,
} from "../src/features/vaccinations/scheduleConfig.ts"
import {
  buildSchedule,
  MOCK_VACCINATION_RECORDS,
} from "../src/features/vaccinations/mockData.ts"
import {
  computeVaccinationStatus,
  computeScheduleSummary,
  matchesFilter,
} from "../src/features/vaccinations/vaccinationStatus.ts"
import { addCalendarMonths } from "../src/features/vaccinations/calendarDate.ts"

describe("Vaccinations Feature Integration & Business Rules", () => {
  // ── 1. Schedule Source Banner & Metadata (FR-023, R-01) ─────────────────
  describe("Schedule Source Banner & Version Metadata", () => {
    it("contains the mandatory demonstration disclaimer", () => {
      assert.equal(
        EPI_SCHEDULE_METADATA.mandatoryDisclaimer,
        "For demonstration — verify the latest official EPI schedule before clinical use",
      )
    })

    it("references the published Sri Lankan EPI schedule PDF and version", () => {
      assert.equal(
        EPI_SCHEDULE_METADATA.sourceUrl,
        "https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf",
      )
      assert.match(EPI_SCHEDULE_METADATA.version, /LK-EPI-2023/)
      assert.equal(EPI_SCHEDULE_METADATA.isDemonstrationOnly, true)
    })

    it("builds milestones with version and sourceUrl attached", () => {
      const schedule = buildSchedule("test_child", "2025-04-15")
      assert.equal(schedule.length, EPI_SCHEDULE_DEFINITIONS.length)
      for (const m of schedule) {
        assert.equal(m.scheduleVersion, EPI_SCHEDULE_METADATA.version)
        assert.equal(m.sourceUrl, EPI_SCHEDULE_METADATA.sourceUrl)
      }
    })
  })

  // ── 2. Unusual DOB & Calendar-aware Schedules (T-06, BR-01) ───────────
  describe("Unusual DOB and Calendar-aware Schedules (T-06)", () => {
    it("correctly generates calendar-month schedule for Leap Day DOB (2024-02-29)", () => {
      const schedule = buildSchedule("leap_child", "2024-02-29")
      const bcg = schedule.find((m) => m.vaccineCode === "BCG")!
      const penta1 = schedule.find((m) => m.vaccineCode === "PENTA1")!
      const je = schedule.find((m) => m.vaccineCode === "JE")! // 12 months
      const dtpBoost = schedule.find((m) => m.vaccineCode === "DTP_BOOST")! // 18 months
      const dtBoost = schedule.find((m) => m.vaccineCode === "DT_BOOST")! // 60 months (5 yrs)

      assert.equal(bcg.dueDate, "2024-02-29")
      assert.equal(penta1.dueDate, "2024-04-29")
      // 12 months after 2024-02-29 is clamped to Feb 28 in non-leap 2025
      assert.equal(je.dueDate, "2025-02-28")
      // 18 months after 2024-02-29 is August 29, 2025
      assert.equal(dtpBoost.dueDate, "2025-08-29")
      // 60 months after 2024-02-29 is February 28, 2029 (non-leap)
      assert.equal(dtBoost.dueDate, "2029-02-28")
    })

    it("correctly generates calendar-month schedule for End-of-Month DOB (2025-01-31)", () => {
      const schedule = buildSchedule("eom_child", "2025-01-31")
      const penta1 = schedule.find((m) => m.vaccineCode === "PENTA1")! // 2 months -> March 31
      const penta2 = schedule.find((m) => m.vaccineCode === "PENTA2")! // 4 months -> May 31
      const penta3 = schedule.find((m) => m.vaccineCode === "PENTA3")! // 6 months -> July 31
      const mmr1 = schedule.find((m) => m.vaccineCode === "MMR1")! // 9 months -> Oct 31

      assert.equal(penta1.dueDate, "2025-03-31")
      assert.equal(penta2.dueDate, "2025-05-31")
      assert.equal(penta3.dueDate, "2025-07-31")
      assert.equal(mmr1.dueDate, "2025-10-31")
    })

    it("clamps 31st to 30th when target month has 30 days (2025-08-31)", () => {
      const novDate = addCalendarMonths("2025-08-31", 3) // August + 3 = Nov (30 days)
      assert.equal(novDate, "2025-11-30")
      const aprDate = addCalendarMonths("2025-08-31", 8) // August + 8 = April next year
      assert.equal(aprDate, "2026-04-30")
    })
  })

  // ── 3. Empty / Bogus Child ID Handling (T-05, BR-08) ────────────────────
  describe("Empty / Bogus Child ID Handling (T-05)", () => {
    it("throws AppError not_found when getting schedule for nonexistent child", async () => {
      await assert.rejects(
        async () => {
          await vaccinationService.getSchedule("nonexistent_child_xyz")
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "not_found")
          return true
        },
      )
    })

    it("safely returns an empty array when getting records for unknown child", async () => {
      const records = await vaccinationService.getRecords("unknown_child_123")
      assert.deepEqual(records, [])
    })
  })

  // ── 4. Dose Recording & Provenance (T-07, BR-02, FR-026) ───────────────
  describe("Dose Recording and Provenance (T-07)", () => {
    it("rejects future administered dates with validation error (FR-026)", async () => {
      await assert.rejects(
        async () => {
          await vaccinationService.addReportedDose({
            childId: "child_nethmi_demo",
            vaccineCode: "JE",
            administeredOn: "2099-12-31",
          })
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /future/i)
          return true
        },
      )
    })

    it("rejects administered dates before the child's birth date", async () => {
      await assert.rejects(
        async () => {
          await vaccinationService.addReportedDose({
            childId: "child_nethmi_demo",
            vaccineCode: "BCG",
            administeredOn: "2020-01-01",
          })
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /before the child's birth date/i)
          return true
        },
      )
    })

    it("records a valid dose with parent_reported provenance and unverified status (T-07)", async () => {
      const record = await vaccinationService.addReportedDose({
        childId: "child_nethmi_demo",
        vaccineCode: "MMR1",
        administeredOn: "2026-01-20",
      })

      assert.equal(record.source, "parent_reported")
      assert.notEqual(record.source, "health_worker_verified")

      // Verify status computation treats parent_reported as completed_unverified
      const milestone = {
        id: "m_test_mmr1",
        vaccineCode: "MMR1",
        vaccineName: "MMR 1",
        ageMonths: 9,
        dueDate: "2026-01-15",
        scheduleVersion: "test",
        sourceUrl: "test",
      }

      const status = computeVaccinationStatus(milestone, [record], "2026-10-24")
      assert.equal(status, "completed_unverified")
      assert.notEqual(status, "completed_verified")
    })
  })

  // ── 5. Status Calculation & Filtering (FR-022) ─────────────────────────
  describe("Status Calculation and Filter Logic (FR-022)", () => {
    it("correctly identifies upcoming, due, overdue, and reported statuses", () => {
      const today = "2026-10-24"

      const upcomingMilestone = {
        id: "m1",
        vaccineCode: "MMR2",
        vaccineName: "MMR 2",
        ageMonths: 36,
        dueDate: "2028-04-15",
        scheduleVersion: "v1",
        sourceUrl: "url",
      }
      assert.equal(computeVaccinationStatus(upcomingMilestone, [], today), "upcoming")

      const dueMilestone = {
        id: "m2",
        vaccineCode: "DT_BOOST",
        vaccineName: "DT Booster",
        ageMonths: 60,
        dueDate: "2026-10-28", // 4 days from today
        scheduleVersion: "v1",
        sourceUrl: "url",
      }
      assert.equal(computeVaccinationStatus(dueMilestone, [], today), "due")

      const overdueMilestone = {
        id: "m3",
        vaccineCode: "JE",
        vaccineName: "JE",
        ageMonths: 12,
        dueDate: "2026-04-15", // past today
        scheduleVersion: "v1",
        sourceUrl: "url",
      }
      assert.equal(computeVaccinationStatus(overdueMilestone, [], today), "overdue")

      const reportedMilestone = {
        id: "m4",
        vaccineCode: "BCG",
        vaccineName: "BCG",
        ageMonths: null,
        dueDate: "2025-04-15",
        scheduleVersion: "v1",
        sourceUrl: "url",
      }
      const demoRecord = MOCK_VACCINATION_RECORDS.child_nethmi_demo[0]
      assert.equal(
        computeVaccinationStatus(reportedMilestone, [demoRecord], today),
        "completed_unverified",
      )
    })

    it("properly filters by status category", () => {
      assert.equal(matchesFilter("upcoming", "upcoming"), true)
      assert.equal(matchesFilter("due", "upcoming"), false)

      assert.equal(matchesFilter("due", "due_overdue"), true)
      assert.equal(matchesFilter("overdue", "due_overdue"), true)
      assert.equal(matchesFilter("upcoming", "due_overdue"), false)

      assert.equal(matchesFilter("completed_unverified", "reported"), true)
      assert.equal(matchesFilter("completed_verified", "reported"), true)
      assert.equal(matchesFilter("overdue", "reported"), false)

      assert.equal(matchesFilter("upcoming", "all"), true)
      assert.equal(matchesFilter("overdue", "all"), true)
    })

    it("computes accurate summary statistics for progress display", () => {
      const schedule = buildSchedule("child_kavindu_demo", "2026-02-28")
      const records = MOCK_VACCINATION_RECORDS.child_kavindu_demo
      const summary = computeScheduleSummary(schedule, records, "2026-10-24")

      assert.equal(summary.total, schedule.length)
      assert.equal(summary.completed, 1) // Only BCG completed in Kavindu fixture
      assert.ok(summary.progressPercentage > 0)
      assert.ok(summary.nextMilestone !== null)
    })
  })
})
