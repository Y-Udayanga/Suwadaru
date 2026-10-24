import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js"
import { AppError, type AppErrorCode } from "@/services/contracts"
import type { ChatMessage } from "@/types"
import { supabase } from "@/utils/supabase"
import { assertUuid } from "./supabase-error.ts"

export type NutritionSafetyCategory =
  | "emergency_referral"
  | "medication_refusal"
  | "educational"

export interface NutritionAssistantReply {
  message: ChatMessage
  safetyCategory: NutritionSafetyCategory
  modelCalled: boolean
}

/**
 * Asks the nutrition-assistant Edge Function. The browser never calls Gemini
 * and never reads GEMINI_API_KEY. The signed-in session is sent by supabase-js.
 */
export async function askNutritionAssistant(
  childId: string,
  message: string,
): Promise<NutritionAssistantReply> {
  assertUuid(childId, "Child id")
  if (!message || message.trim() === "") {
    throw new AppError("validation", "A question is required.")
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session?.access_token) {
    throw new AppError("unauthenticated", "Authentication required.")
  }

  const { data, error } = await supabase.functions.invoke("nutrition-assistant", {
    body: { childId, question: message },
  })
  if (error) throw await functionError(error)
  return parseReply(data)
}

async function functionError(error: unknown): Promise<AppError> {
  if (error instanceof FunctionsHttpError) {
    const payload = await readJson(error.context)
    const code = appCode(payload?.code)
    if (code) {
      return new AppError(code, payload?.message || fallbackMessage(code))
    }
    return new AppError("unavailable", fallbackMessage("unavailable"))
  }
  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    return new AppError("unavailable", fallbackMessage("unavailable"))
  }
  return new AppError("unavailable", fallbackMessage("unavailable"))
}

function parseReply(value: unknown): NutritionAssistantReply {
  if (!value || typeof value !== "object") {
    throw new AppError("unavailable", fallbackMessage("unavailable"))
  }
  const record = value as Record<string, unknown>
  const category = record.safetyCategory
  const message = record.message
  if (
    (category !== "emergency_referral" &&
      category !== "medication_refusal" &&
      category !== "educational") ||
    !message ||
    typeof message !== "object"
  ) {
    throw new AppError("unavailable", fallbackMessage("unavailable"))
  }
  const bubble = message as Record<string, unknown>
  if (typeof bubble.text !== "string" || bubble.text.trim() === "") {
    throw new AppError("unavailable", fallbackMessage("unavailable"))
  }
  const modelCalled = record.modelCalled === true
  return {
    safetyCategory: category,
    modelCalled,
    message: {
      id: typeof bubble.id === "string" ? bubble.id : crypto.randomUUID(),
      sender: "assistant",
      text: bubble.text,
      createdAt: typeof bubble.createdAt === "string" ? bubble.createdAt : colomboNow(),
      isDemo: !modelCalled,
    },
  }
}

async function readJson(
  context: unknown,
): Promise<{ code?: string; message?: string } | null> {
  if (!context || typeof context !== "object" || !("json" in context)) return null
  try {
    const body = await (context as Response).json()
    if (!body || typeof body !== "object") return null
    const record = body as Record<string, unknown>
    return {
      ...(typeof record.code === "string" ? { code: record.code } : {}),
      ...(typeof record.message === "string" ? { message: record.message } : {}),
    }
  } catch {
    return null
  }
}

function appCode(value: string | undefined): AppErrorCode | null {
  if (
    value === "unauthenticated" ||
    value === "not_found" ||
    value === "validation" ||
    value === "unavailable"
  ) {
    return value
  }
  return null
}

function fallbackMessage(code: AppErrorCode): string {
  if (code === "unauthenticated") return "Authentication required."
  if (code === "not_found") return "The child was not found."
  if (code === "validation") return "The nutrition question could not be accepted."
  return "Nutrition education is temporarily unavailable. Please try again later or ask your Public Health Midwife."
}

function colomboNow(): string {
  const shifted = new Date(Date.now() + (5 * 60 + 30) * 60 * 1000)
  const year = shifted.getUTCFullYear()
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0")
  const day = String(shifted.getUTCDate()).padStart(2, "0")
  const hour = String(shifted.getUTCHours()).padStart(2, "0")
  const minute = String(shifted.getUTCMinutes()).padStart(2, "0")
  const second = String(shifted.getUTCSeconds()).padStart(2, "0")
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`
}
