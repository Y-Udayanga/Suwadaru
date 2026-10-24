/**
 * Mock nutrition service adapter for Feature B — Nutrition Chat.
 *
 * Satisfies `NutritionService` from `@/services/contracts`.
 * All responses have `isDemo: true`. No Gemini call is ever made from the
 * browser (BRD FR-042, BR-06, BR-07).
 *
 * BOUNDARY DOCUMENTATION:
 *   - Scripted responses are keyword-matched in `mockData.ts`.
 *   - Emergency keywords always produce a safe professional-care referral (FR-043).
 *
 * INTEGRATION IMPORTS NEEDED FROM FRONTEND A (when B1 lands):
 *   import type { NutritionService } from "@/services/contracts"
 *   import { AppError } from "@/services/contracts"
 *   — Already imported below.
 */

import type { NutritionService } from "@/services/contracts"
import type { ChatMessage } from "@/types"
import { findScriptedResponse } from "./mockData"

const MOCK_DELAY_MIN = 600
const MOCK_DELAY_MAX = 1200

function delay(): Promise<void> {
  const ms =
    MOCK_DELAY_MIN + Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const nutritionService: NutritionService = {
  async getDemoResponse(request) {
    await delay()
    const { text } = findScriptedResponse(request.text)
    const message: ChatMessage = {
      id: `msg_${request.childId}_${Date.now()}`,
      sender: "assistant",
      text,
      createdAt: new Date().toISOString(),
      // BR-07 / FR-042: must be true; never claim Gemini replied.
      isDemo: true,
    }
    return message
  },
}
