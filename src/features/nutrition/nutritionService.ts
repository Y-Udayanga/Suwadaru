/**
 * Mock nutrition service adapter for Feature B — Nutrition Chat.
 *
 * Satisfies `NutritionService` from `@/services/contracts`.
 * All responses have `isDemo: true`. No Gemini call is ever made from the
 * browser (BRD FR-042, BR-06, BR-07).
 *
 * SAFETY & ERROR CONSTRAINTS:
 *   - Empty input throws validation error.
 *   - Emergency keywords produce a safe professional-care referral (FR-043).
 *   - Supports simulated error mode via text keyword `[simulate-error]` for retry testing (T-16).
 */

import type { NutritionService } from "@/services/contracts"
import { AppError } from "@/services/contracts"
import type { ChatMessage } from "@/types"
import { findNutritionResponse } from "./mockData"

const MOCK_DELAY = 450

function delay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const nutritionService: NutritionService = {
  async getDemoResponse(request) {
    await delay()

    if (!request.text || request.text.trim() === "") {
      throw new AppError("validation", "Message text cannot be empty.")
    }

    // Support simulated failure for error/retry state verification (T-16)
    if (request.text.includes("[simulate-error]")) {
      throw new AppError(
        "unavailable",
        "Simulated nutrition service timeout. Please click retry.",
      )
    }

    const { text } = findNutritionResponse(request.text)

    const message: ChatMessage = {
      id: `msg_asst_${request.childId}_${Date.now()}`,
      sender: "assistant",
      text,
      createdAt: new Date().toISOString(),
      // BR-07 / FR-042: strictly true; never claim a real AI request occurred.
      isDemo: true,
    }

    return message
  },
}
