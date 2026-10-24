import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { AppError } from "../src/services/contracts/index.ts"
import { nutritionService } from "../src/features/nutrition/nutritionService.ts"
import {
  findNutritionResponse,
  SUGGESTED_NUTRITION_PROMPTS,
} from "../src/features/nutrition/mockData.ts"

describe("Nutrition Educational Chat Feature & Safety Guardrails (T-11)", () => {
  // ── 1. Separate Child Profiles Context ────────────────────────────────────
  describe("Child Profile Context & Isolation", () => {
    it("handles requests scoped to Nethmi with proper response tagging", async () => {
      const response = await nutritionService.getDemoResponse({
        childId: "child_nethmi_demo",
        text: "What are good local Sri Lankan foods for lunch?",
      })

      assert.equal(response.sender, "assistant")
      assert.equal(response.isDemo, true)
      assert.match(response.id, /child_nethmi_demo/)
      assert.match(response.text, /dhal|rice|parippu|vegetables|gotukola/i)
    })

    it("handles requests scoped to Kavindu with proper response tagging", async () => {
      const response = await nutritionService.getDemoResponse({
        childId: "child_kavindu_demo",
        text: "When should complementary foods be introduced?",
      })

      assert.equal(response.sender, "assistant")
      assert.equal(response.isDemo, true)
      assert.match(response.id, /child_kavindu_demo/)
      assert.match(response.text, /6 completed months|developmental readiness/i)
    })
  })

  // ── 2. Validation: Empty Input Rejection ──────────────────────────────────
  describe("Input Validation", () => {
    it("rejects empty string with validation error", async () => {
      await assert.rejects(
        async () => {
          await nutritionService.getDemoResponse({
            childId: "child_nethmi_demo",
            text: "",
          })
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /cannot be empty/i)
          return true
        },
      )
    })

    it("rejects whitespace-only string with validation error", async () => {
      await assert.rejects(
        async () => {
          await nutritionService.getDemoResponse({
            childId: "child_nethmi_demo",
            text: "    \n\t  ",
          })
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "validation")
          assert.match(err.message, /cannot be empty/i)
          return true
        },
      )
    })
  })

  // ── 3. Emergency / Alarming Symptoms Referral (T-11, FR-043) ──────────────
  describe("Emergency & Alarming Symptoms Handling (T-11)", () => {
    it("returns urgent professional medical advice when emergency keywords appear", async () => {
      const emergencyQueries = [
        "My baby is choking on food, what to do?",
        "High fever and not breathing well",
        "Baby is having a seizure",
        "There is blood in stool and vomiting blood",
        "Baby is severely dehydrated with sunken eyes",
      ]

      for (const query of emergencyQueries) {
        const response = await nutritionService.getDemoResponse({
          childId: "child_nethmi_demo",
          text: query,
        })

        assert.equal(response.isDemo, true)
        // Must contain urgent medical referral advice
        assert.match(
          response.text,
          /urgent medical|emergency treatment unit|hospital|immediately/i,
        )
        // Must NOT attempt to give recipes or cooking steps
        assert.doesNotMatch(response.text, /congee|kenda|papaya/i)
      }
    })
  })

  // ── 4. Medication & Prescription Refusal (BR-06) ──────────────────────────
  describe("Medication & Prescription Refusal (BR-06)", () => {
    it("refuses medication dosage advice and directs to doctor or PHM", async () => {
      const medQueries = [
        "What is the paracetamol dose for 8kg?",
        "Should I give antibiotics for cough?",
        "What medicine can I buy at the pharmacy?",
      ]

      for (const query of medQueries) {
        const response = await nutritionService.getDemoResponse({
          childId: "child_nethmi_demo",
          text: query,
        })

        assert.match(
          response.text,
          /qualified physician|pediatrician|public health midwife|phm/i,
        )
        assert.match(response.text, /withholds all drug dosage guidance/i)
      }
    })
  })

  // ── 5. Curated Local Food & Choking Precautions ──────────────────────────
  describe("Local Food Educational Content & Choking Precautions", () => {
    it("provides safe fish preparation guidance highlighting bone removal", () => {
      const result = findNutritionResponse("How do I prepare fish for my baby?")
      assert.equal(result.category, "local_foods")
      assert.match(result.text, /bones|flake/i)
      assert.match(result.text, /choking/i)
    })

    it("provides safe texture progression advice avoiding whole nuts and round grapes", () => {
      const result = findNutritionResponse("What textures are safe and what are choking hazards?")
      assert.equal(result.category, "hygiene_safety")
      assert.match(result.text, /whole nuts/i)
      assert.match(result.text, /grapes/i)
      assert.match(result.text, /supervise/i)
    })

    it("provides hygiene and safe drinking water advice", () => {
      const result = findNutritionResponse("How should I store food and what water is safe?")
      assert.equal(result.category, "hygiene_safety")
      assert.match(result.text, /handwashing|boiled.*water/i)
    })
  })

  // ── 6. Error Simulation & Retry Testing (T-16) ───────────────────────────
  describe("Error Simulation and Recoverability (T-16)", () => {
    it("simulates service failure when [simulate-error] token is passed", async () => {
      await assert.rejects(
        async () => {
          await nutritionService.getDemoResponse({
            childId: "child_nethmi_demo",
            text: "Hello [simulate-error]",
          })
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError)
          assert.equal(err.code, "unavailable")
          assert.match(err.message, /timeout|retry/i)
          return true
        },
      )
    })
  })

  // ── 7. Demo Honesty (BR-07, FR-042) ──────────────────────────────────────
  describe("Demo Honesty & Suggestion Chips", () => {
    it("includes standard suggestions in fixture", () => {
      assert.ok(SUGGESTED_NUTRITION_PROMPTS.length >= 5)
    })

    it("always tags assistant messages as demo", async () => {
      const res = await nutritionService.getDemoResponse({
        childId: "child_nethmi_demo",
        text: "Tell me about dhal",
      })
      assert.equal(res.isDemo, true)
    })
  })
})
