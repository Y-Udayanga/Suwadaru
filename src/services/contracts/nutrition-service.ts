import type { ChatMessage, DemoNutritionRequest } from "@/types"

/**
 * Scripted nutrition boundary. `getDemoResponse` must return `isDemo: true`
 * and must not call Gemini. Throw AppError for expected failures.
 */
export interface NutritionService {
  getDemoResponse(request: DemoNutritionRequest): Promise<ChatMessage>
}
