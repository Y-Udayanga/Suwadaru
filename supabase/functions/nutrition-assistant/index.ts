import { createClient } from "npm:@supabase/supabase-js@2"
import {
  EDUCATION_DISCLAIMER,
  UNAVAILABLE_MESSAGE,
  classifyNutritionSafety,
  modelTextGivesMedicine,
  type NutritionSafetyCategory,
} from "./safety.ts"

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_QUESTION_LENGTH = 1500
const GEMINI_TIMEOUT_MS = 12_000
const GEMINI_MODEL = "gemini-2.5-flash"

const SYSTEM_PROMPT = `You give general nutrition education for caregivers of children from birth to five years in Sri Lanka.
You are not a clinician. Do not diagnose illness or malnutrition. Do not name a condition for this child. Do not recommend medicines, doses, supplements as treatment, or a therapeutic diet.
Use only the age in completed months, the sex, and the caregiver's question. No name or other record was provided. Do not invent allergies, clinic results, growth status, or vaccines.
No dietary restriction list was supplied. If the question says the child avoids a food, tell the caregiver to keep avoiding it and to confirm that restriction with their clinic. Do not design an elimination diet.
Under 6 completed months: exclusive breastfeeding is the education. Do not recommend water, tea, honey, salt, sugar, or solids as required foods.
From 6 completed months: family foods made soft, including rice, dhal (parippu), vegetables such as pumpkin and carrot, finely cooked leafy greens, properly cooked eggs, fish only after bones are removed, and soft local fruits such as banana and papaya. Honey is not for children under 12 months. Keep family meals mild, without extra salt or sugar for infants.
Introduce one new food at a time when the child is well. Rash, swelling, or breathing difficulty needs in-person care. Do not declare an allergy.
Choking: no whole nuts, whole grapes, hard raw pieces, or fish bones. Meals need a watching adult.
Hygiene: wash hands, use clean utensils, cook food thoroughly, and use freshly boiled then cooled water.
Write plain sentences. If the question is not about feeding, say you can only offer general feeding education.`

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }
  if (request.method !== "POST") {
    return json({ code: "validation", message: "Use POST.", modelCalled: false }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const publishableKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
  if (!supabaseUrl || !publishableKey) {
    return json({ code: "unavailable", message: UNAVAILABLE_MESSAGE, modelCalled: false }, 503)
  }

  const authorization = request.headers.get("Authorization")
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return json({ code: "unauthenticated", message: "Authentication required.", modelCalled: false }, 401)
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return json({ code: "unauthenticated", message: "Authentication required.", modelCalled: false }, 401)
  }

  const body = await readBody(request)
  if (!body.ok) return body.response
  const childId = body.value.childId
  const question = body.value.question.trim()
  if (!UUID.test(childId)) {
    return json({ code: "validation", message: "Child id must be a UUID.", modelCalled: false }, 400)
  }
  if (!question) {
    return json({ code: "validation", message: "A question is required.", modelCalled: false }, 400)
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return json(
      { code: "validation", message: "The question is too long.", modelCalled: false },
      400,
    )
  }

  const { data: membership, error: membershipError } = await supabase
    .from("child_caregivers")
    .select("access_level")
    .eq("child_id", childId)
    .eq("user_id", userData.user.id)
    .maybeSingle()
  if (membershipError || !membership) {
    return json({ code: "not_found", message: "The child was not found.", modelCalled: false }, 404)
  }

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("date_of_birth, sex")
    .eq("id", childId)
    .maybeSingle()
  if (childError || !child) {
    return json({ code: "not_found", message: "The child was not found.", modelCalled: false }, 404)
  }
  if (child.sex !== "male" && child.sex !== "female") {
    return json({ code: "unavailable", message: UNAVAILABLE_MESSAGE, modelCalled: false }, 503)
  }

  const today = calendarDateInColombo(new Date())
  const age = completedMonths(String(child.date_of_birth).slice(0, 10), today)
  if (age === null) {
    return json(
      { code: "validation", message: "The child date of birth could not be used.", modelCalled: false },
      400,
    )
  }

  const decision = classifyNutritionSafety(question)
  if (decision.action !== "allow_education") {
    return json(reply(decision.category, decision.text, false), 200)
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY")
  if (!apiKey) {
    return json({ code: "unavailable", message: UNAVAILABLE_MESSAGE, modelCalled: false }, 503)
  }

  const educated = await askGemini(apiKey, {
    question,
    ageCompletedMonths: age,
    sex: child.sex,
  })
  if (!educated.ok) {
    return json({ code: "unavailable", message: UNAVAILABLE_MESSAGE, modelCalled: false }, 503)
  }
  if (modelTextGivesMedicine(educated.text)) {
    const refusal = classifyNutritionSafety("medicine dosage")
    return json(
      reply("medication_refusal", refusal.action === "refuse" ? refusal.text : UNAVAILABLE_MESSAGE, false),
      200,
    )
  }

  return json(
    reply("educational", `${educated.text.trim()}\n\n${EDUCATION_DISCLAIMER}`, true),
    200,
  )
})

function reply(safetyCategory: NutritionSafetyCategory, text: string, modelCalled: boolean) {
  return {
    message: {
      id: crypto.randomUUID(),
      sender: "assistant" as const,
      text,
      createdAt: colomboTimestamp(new Date()),
      isDemo: !modelCalled,
    },
    safetyCategory,
    modelCalled,
  }
}

async function askGemini(
  apiKey: string,
  facts: { question: string; ageCompletedMonths: number; sex: "male" | "female" },
): Promise<{ ok: true; text: string } | { ok: false }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: JSON.stringify({
                    question: facts.question,
                    ageCompletedMonths: facts.ageCompletedMonths,
                    sex: facts.sex,
                  }),
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
        }),
      },
    )
    if (!response.ok) return { ok: false }
    const payload = await response.json()
    const blocked = payload?.promptFeedback?.blockReason
    const candidate = payload?.candidates?.[0]
    if (blocked || candidate?.finishReason === "SAFETY") return { ok: false }
    const text = candidate?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("").trim()
    if (!text) return { ok: false }
    return { ok: true, text }
  } catch {
    return { ok: false }
  }
}

async function readBody(
  request: Request,
): Promise<{ ok: true; value: { childId: string; question: string } } | { ok: false; response: Response }> {
  try {
    const value = await request.json()
    if (!value || typeof value.childId !== "string" || typeof value.question !== "string") {
      return {
        ok: false,
        response: json(
          { code: "validation", message: "childId and question are required.", modelCalled: false },
          400,
        ),
      }
    }
    return { ok: true, value: { childId: value.childId, question: value.question } }
  } catch {
    return {
      ok: false,
      response: json(
        { code: "validation", message: "The request body must be JSON.", modelCalled: false },
        400,
      ),
    }
  }
}

function completedMonths(dateOfBirth: string, today: string): number | null {
  const born = dateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const now = today.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!born || !now) return null
  const year = Number(now[1]) - Number(born[1])
  let months = year * 12 + (Number(now[2]) - Number(born[2]))
  if (Number(now[3]) < Number(born[3])) months -= 1
  if (months < 0 || months > 60 * 12) return null
  return months
}

function calendarDateInColombo(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value
  return `${year}-${month}-${day}`
}

function colomboTimestamp(instant: Date): string {
  const shifted = new Date(instant.getTime() + (5 * 60 + 30) * 60 * 1000)
  const year = shifted.getUTCFullYear()
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0")
  const day = String(shifted.getUTCDate()).padStart(2, "0")
  const hour = String(shifted.getUTCHours()).padStart(2, "0")
  const minute = String(shifted.getUTCMinutes()).padStart(2, "0")
  const second = String(shifted.getUTCSeconds()).padStart(2, "0")
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`
}

function corsHeaders(): HeadersInit {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), "content-type": "application/json" },
  })
}
