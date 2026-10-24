import type { IsoDateTime } from "./common"

/**
 * A nutrition chat message. F0 messages are scripted examples.
 * `isDemo` stays true until a reviewed server-side adapter exists.
 */
export interface ChatMessage {
  id: string
  sender: "user" | "assistant"
  text: string
  /** ISO 8601 date-time with an explicit offset. */
  createdAt: IsoDateTime
  isDemo: boolean
}

export interface DemoNutritionRequest {
  childId: string
  /** Caregiver wording. Adapters must not forward this to Gemini from the browser. */
  text: string
}
