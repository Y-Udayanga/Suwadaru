import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { AppError } from "../src/services/contracts/index.ts"
import { growthService } from "../src/features/growth/growthService.ts"
import {
  GROWTH_DISCLAIMER_TEXT,
  CLINICAL_ASSESSMENT_NOTICE,
} from "../src/features/growth/mockData.ts"

describe("Growth Monitoring Feature Integration & Safety Rules", () => {
  // ── 1. Separate Values for Two Children (Data Isolation) ──────────────────
  describe("Child Data Isolation (Nethmi vs Kavindu)", () => {
    it("maintains separate, isolated measurement lists for two demo children", async () => {
      const nethmiRecords = await growthService.list("child_nethmi_demo")
      const kavinduRecords = await growthService.list("child_kavindu_demo")

      assert.ok(nethmiRecords.length >= 5)
      assert.ok(kavinduRecords.length >= 4)
      assert.notEqual(nethmiRecords.length, kavinduRecords.length)

      // Ensure every Nethmi record belongs only to Nethmi
      for (const r of nethmiRecords) {
        assert.equal(r.childId, "child_nethmi_demo")
      }
      // Ensure every Kavindu record belongs only to Kavindu
      for (const r of kavinduRecords) {
        assert.equal(r.childId, "child_kavindu_demo")
      }

      // Check birth weights differ
      assert.notEqual(nethmiRecords[0].weightKg, kavinduRecords[0].weightKg)
    })

    it("adding a measurement for one child does not leak into the other child", async () => {
      const nethmiBefore = await growthService.list("child_nethmi_demo")
      const kavinduBefore = await growthService.list("child_kavindu_demo")

      const newNethmi = await growthService.addMeasurement({
        childId: "child_nethmi_demo",
        measuredOn: "2026-04-10",
        weightKg: 9.8,
      })

      assert.equal(newNethmi.childId, "child_nethmi_demo")
      assert.equal(newNethmi.weightKg, 9.8)

      const nethmiAfter = await growthService.list("child_nethmi_demo")
      const kavinduAfter = await growthService.list("child_kavindu_demo")

      assert.equal(nethmiAfter.length, nethmiBefore.length + 1)
      assert.equal(kavinduAfter.length, kavinduBefore.length)
    })
  })

  // ── 2. Validation: Zero/Negative Weight & Nonpositive Values (T-09, FR-033)
  describe("Measurement Input Validation (T-09, FR-033)", () => {
    it("rejects zero weight with validation error (T-09)", async () => {
      await assert.rejects(
        async () => {
          await growthService.addMeasurement({
            childId: "child_nethmi_demo",
            measuredOn: "2026-01-10",
            weightKg: 0,
          })
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /positive number/i)
          return true
        },
      )
    })

    it("rejects negative weight with validation error (T-09)", async () => {
      await assert.rejects(
        async () => {
          await growthService.addMeasurement({
            childId: "child_nethmi_demo",
            measuredOn: "2026-01-10",
            weightKg: -4.5,
          })
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /positive number/i)
          return true
        },
      )
    })

    it("rejects negative or zero length/height if provided", async () => {
      await assert.rejects(
        async () => {
          await growthService.addMeasurement({
            childId: "child_nethmi_demo",
            measuredOn: "2026-01-10",
            weightKg: 5.5,
            lengthHeightCm: -10,
          })
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /length\/height/i)
          return true
        },
      )
    })

    it("rejects negative or zero head circumference if provided", async () => {
      await assert.rejects(
        async () => {
          await growthService.addMeasurement({
            childId: "child_nethmi_demo",
            measuredOn: "2026-01-10",
            weightKg: 5.5,
            headCircumferenceCm: 0,
          })
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /head circumference/i)
          return true
        },
      )
    })
  })

  // ── 3. Date Validation: Future Dates & Pre-DOB Dates (BR-01, FR-033) ──────
  describe("Measurement Date Validation (BR-01, FR-033)", () => {
    it("rejects future measurement dates", async () => {
      await assert.rejects(
        async () => {
          await growthService.addMeasurement({
            childId: "child_nethmi_demo",
            measuredOn: "2099-01-01",
            weightKg: 6.0,
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

    it("rejects measurement date prior to child's date of birth", async () => {
      await assert.rejects(
        async () => {
          await growthService.addMeasurement({
            childId: "child_nethmi_demo",
            measuredOn: "2024-01-01", // Nethmi was born 2025-04-15
            weightKg: 3.0,
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
  })

  // ── 4. Prominent Synthetic Banner & No Diagnostic Claims (T-10, BR-04/05/07)
  describe("Illustrative Disclaimer and Absence of Medical Classification (T-10, BR-07)", () => {
    it("contains exact required disclaimer text", () => {
      assert.equal(
        GROWTH_DISCLAIMER_TEXT,
        "Illustrative only — not WHO clinical reference data",
      )
    })

    it("guarantees reference curves have synthetic_demo provenance and unassessed clinical status", async () => {
      const refFemale = await growthService.getReferenceSeries("child_nethmi_demo")
      const refMale = await growthService.getReferenceSeries("child_kavindu_demo")

      assert.equal(refFemale.provenance, "synthetic_demo")
      assert.equal(refMale.provenance, "synthetic_demo")

      assert.equal(refFemale.clinicalStatus, "not_assessed")
      assert.equal(refMale.clinicalStatus, "not_assessed")

      assert.equal(refFemale.sourceLabel, GROWTH_DISCLAIMER_TEXT)
      assert.equal(refMale.sourceLabel, GROWTH_DISCLAIMER_TEXT)
    })

    it("never classifies child as healthy, malnourished, stunted, or underweight (BR-07)", async () => {
      const prohibitedTerms = ["healthy", "malnourished", "stunted", "underweight"]
      const ref = await growthService.getReferenceSeries("child_nethmi_demo")

      // Neither sourceLabel nor clinicalStatus nor notice should assert these
      for (const term of prohibitedTerms) {
        assert.equal(
          ref.sourceLabel.toLowerCase().includes(term),
          false,
          `Found prohibited clinical term "${term}" in reference sourceLabel`,
        )
        assert.equal(
          ref.clinicalStatus.toLowerCase().includes(term),
          false,
          `Found prohibited clinical term "${term}" in clinicalStatus`,
        )
        assert.equal(
          CLINICAL_ASSESSMENT_NOTICE.toLowerCase().includes(term),
          false,
          `Found prohibited clinical term "${term}" in assessment notice`,
        )
      }
    })
  })

  // ── 5. Empty Child State (T-08) ──────────────────────────────────────────
  describe("Empty Child Measurements (T-08)", () => {
    it("safely returns an empty array for a new or child without measurements", async () => {
      const list = await growthService.list("new_child_empty")
      assert.deepEqual(list, [])
    })
  })
})
