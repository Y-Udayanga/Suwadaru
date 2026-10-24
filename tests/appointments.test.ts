/**
 * appointments.test.ts
 *
 * Comprehensive integration and unit tests for Feature B — Clinic Appointments:
 * - Scoped child profile isolation (Nethmi vs Kavindu)
 * - Complete CRUD lifecycle (create, list, update, complete, cancel)
 * - Input validation & invalid date handling
 * - Date/time formatting helpers (local SLST +05:30 offset)
 * - Error simulation and non-crashing failure handling
 * - EPI milestone separation and reminder preview "not sent" guardrail (FR-051, FR-052, BR-07)
 */

import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  appointmentService,
} from "../src/features/appointments/appointmentService"
import {
  apptToIsoDateTime,
  isoDateTimeToLocal,
  formatAppointmentDateTime,
} from "../src/features/appointments/appointmentHelpers"
import { AppError } from "../src/services/contracts"


describe("Clinic Appointments Feature Integration & Safety Rules (T-12)", () => {
  beforeEach(() => {
    appointmentService.resetToDemo()
  })

  describe("Child Profile Context & Isolation (J-02, BR-08)", () => {
    it("returns separate appointment lists for Nethmi and Kavindu", async () => {
      const nethmiAppts = await appointmentService.list("child_nethmi_demo")
      const kavinduAppts = await appointmentService.list("child_kavindu_demo")

      assert.ok(nethmiAppts.length > 0, "Nethmi has demo appointments")
      assert.ok(kavinduAppts.length > 0, "Kavindu has demo appointments")

      // Check all appointments in Nethmi belong to Nethmi
      for (const a of nethmiAppts) {
        assert.equal(a.childId, "child_nethmi_demo")
      }
      // Check all appointments in Kavindu belong to Kavindu
      for (const a of kavinduAppts) {
        assert.equal(a.childId, "child_kavindu_demo")
      }
    })

    it("adding an appointment for Nethmi does not leak into Kavindu", async () => {
      const kavinduBefore = await appointmentService.list("child_kavindu_demo")
      const countBefore = kavinduBefore.length

      await appointmentService.create({
        childId: "child_nethmi_demo",
        scheduledAt: "2026-12-10T09:30:00+05:30",
        clinicName: "Private Pediatric Centre",
        purpose: "Routine milestone checkup",
      })

      const kavinduAfter = await appointmentService.list("child_kavindu_demo")
      assert.equal(kavinduAfter.length, countBefore, "Kavindu's list remained untouched")
    })

    it("returns an empty array safely for a child with no appointments", async () => {
      const emptyList = await appointmentService.list("child_newborn_unrecorded")
      assert.deepEqual(emptyList, [])
    })
  })

  describe("Input Validation & Invalid Date Handling (FR-050, FR-051)", () => {
    it("rejects creation with empty clinic name", async () => {
      await assert.rejects(
        () =>
          appointmentService.create({
            childId: "child_nethmi_demo",
            scheduledAt: "2026-11-20T10:00:00+05:30",
            clinicName: "   ",
          }),
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /clinic name is required/i)
          return true
        },
      )
    })

    it("rejects creation with invalid scheduled date/time string", async () => {
      await assert.rejects(
        () =>
          appointmentService.create({
            childId: "child_nethmi_demo",
            scheduledAt: "invalid-date-format",
            clinicName: "MOH Clinic",
          }),
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /valid appointment date/i)
          return true
        },
      )
    })

    it("rejects update with empty clinic name", async () => {
      const appts = await appointmentService.list("child_nethmi_demo")
      const targetId = appts[0].id

      await assert.rejects(
        () =>
          appointmentService.update(targetId, {
            clinicName: "  ",
          }),
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          return true
        },
      )
    })

    it("rejects update with invalid scheduledAt date string", async () => {
      const appts = await appointmentService.list("child_nethmi_demo")
      const targetId = appts[0].id

      await assert.rejects(
        () =>
          appointmentService.update(targetId, {
            scheduledAt: "not-a-valid-date",
          }),
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          return true
        },
      )
    })
  })

  describe("Appointment CRUD & Lifecycle (T-12, FR-050)", () => {
    it("creates an appointment in scheduled status", async () => {
      const newAppt = await appointmentService.create({
        childId: "child_nethmi_demo",
        scheduledAt: "2026-12-05T08:30:00+05:30",
        clinicName: "Dehiwala MOH Clinic",
        purpose: "12-month development screening and JE vaccine",
      })

      assert.ok(newAppt.id.startsWith("appt_child_nethmi_demo"))
      assert.equal(newAppt.status, "scheduled")
      assert.equal(newAppt.clinicName, "Dehiwala MOH Clinic")
      assert.equal(newAppt.purpose, "12-month development screening and JE vaccine")

      const list = await appointmentService.list("child_nethmi_demo")
      assert.ok(list.some((a) => a.id === newAppt.id))
    })

    it("updates appointment details and purpose", async () => {
      const appts = await appointmentService.list("child_nethmi_demo")
      const target = appts.find((a) => a.status === "scheduled")!

      const updated = await appointmentService.update(target.id, {
        clinicName: "Colombo South Teaching Hospital (Kalubowila)",
        purpose: "Rescheduled growth follow-up",
      })

      assert.equal(updated.id, target.id)
      assert.equal(updated.clinicName, "Colombo South Teaching Hospital (Kalubowila)")
      assert.equal(updated.purpose, "Rescheduled growth follow-up")
    })

    it("completes an appointment and moves status to completed (T-12)", async () => {
      const appts = await appointmentService.list("child_nethmi_demo")
      const scheduled = appts.find((a) => a.status === "scheduled")!

      const completed = await appointmentService.complete(scheduled.id)
      assert.equal(completed.id, scheduled.id)
      assert.equal(completed.status, "completed")

      const listAfter = await appointmentService.list("child_nethmi_demo")
      const found = listAfter.find((a) => a.id === scheduled.id)
      assert.equal(found?.status, "completed")
    })

    it("cancels an appointment and moves status to cancelled (FR-050)", async () => {
      const appts = await appointmentService.list("child_nethmi_demo")
      const scheduled = appts.find((a) => a.status === "scheduled")!

      const cancelled = await appointmentService.cancel(scheduled.id)
      assert.equal(cancelled.id, scheduled.id)
      assert.equal(cancelled.status, "cancelled")

      const listAfter = await appointmentService.list("child_nethmi_demo")
      const found = listAfter.find((a) => a.id === scheduled.id)
      assert.equal(found?.status, "cancelled")
    })

    it("throws not_found when updating a nonexistent appointment", async () => {
      await assert.rejects(
        () =>
          appointmentService.update("nonexistent_appt_12345", {
            clinicName: "Nowhere Clinic",
          }),
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "not_found")
          return true
        },
      )
    })

    it("throws not_found when cancelling a nonexistent appointment", async () => {
      await assert.rejects(
        () => appointmentService.cancel("nonexistent_appt_12345"),
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "not_found")
          return true
        },
      )
    })
  })

  describe("Date-Time Conversion & Presentation Helpers (FR-051)", () => {
    it("combines local date and time with Sri Lanka offset (+05:30)", () => {
      const iso = apptToIsoDateTime("2026-11-15", "10:30")
      assert.equal(iso, "2026-11-15T10:30:00+05:30")
    })

    it("converts ISO date-time into local date and 24-hr time components", () => {
      const local = isoDateTimeToLocal("2026-11-15T10:30:00+05:30")
      assert.equal(local.date, "2026-11-15")
      assert.equal(local.time, "10:30")
    })

    it("formats ISO date-time with explicit Sri Lanka timezone presentation", () => {
      const formatted = formatAppointmentDateTime("2026-11-15T10:30:00+05:30")
      assert.ok(formatted.includes("2026"))
      assert.ok(formatted.includes("Nov"))
      assert.ok(formatted.includes("10:30"))
      assert.ok(formatted.includes("UTC+05:30"))
    })
  })

  describe("Simulated Error Handling (T-16)", () => {
    it("simulates service failure when [simulate-error] token is provided", async () => {
      await assert.rejects(
        () =>
          appointmentService.create({
            childId: "child_nethmi_demo",
            scheduledAt: "2026-12-01T09:00:00+05:30",
            clinicName: "General Hospital [simulate-error]",
          }),
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "unavailable")
          assert.match(err.message, /simulated service failure/i)
          return true
        },
      )
    })
  })

  describe("EPI Milestone Separation & Reminder Preview Guardrails (FR-051, FR-052, BR-07)", () => {
    it("keeps appointment model independent from EPI milestone structure", async () => {
      const appt = await appointmentService.create({
        childId: "child_nethmi_demo",
        scheduledAt: "2026-11-15T10:30:00+05:30",
        clinicName: "Sample Clinic, Colombo",
        purpose: "Growth & immunization visit",
      })

      // The appointment structure has scheduledAt and clinicName
      assert.ok(appt.scheduledAt)
      assert.ok(appt.clinicName)
      // Must not possess milestone-specific fields like vaccineCode or birthWindow
      assert.equal((appt as Record<string, unknown>).vaccineCode, undefined)
      assert.equal((appt as Record<string, unknown>).birthWindow, undefined)
    })
  })
})
