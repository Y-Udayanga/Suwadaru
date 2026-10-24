/**
 * NutritionPage — Frontend B
 *
 * Route: /children/:childId/nutrition
 * Owner: Frontend B (feature/frontend-health)
 *
 * SAFETY & GOVERNANCE (BRD §7.5, §14, BR-06, BR-07, T-11, T-16):
 *   - Friendly educational chat with child-age badge and suggested prompt chips.
 *   - Text input with Enter to submit and Shift+Enter for newlines.
 *   - Accessible conversation history with simulated typing indicator.
 *   - Error/retry state for network/service interruptions.
 *   - Prominent banner: "Demo responses — no Gemini API connected".
 *   - Scripted educational guidance on Sri Lankan local foods, hygiene, and choking risks.
 *   - Emergency and medication queries trigger urgent care referrals, not recipes.
 */

import { useEffect, useReducer, useRef } from "react"
import { Link } from "react-router"
import {
  Send,
  AlertTriangle,
  Info,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Bot,
  User,
} from "lucide-react"
import type { ChildFeaturePageProps, ChatMessage } from "@/types"
import type { Child } from "@/types"
import { AppError } from "@/services/contracts"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { resolveChild, ageInMonths, formatAge } from "../childResolver"
import { nutritionService } from "./nutritionService"
import { SUGGESTED_NUTRITION_PROMPTS } from "./mockData"
import { formatCalendarDate } from "../vaccinations/calendarDate"

// ---------------------------------------------------------------------------
// Page State & Reducer
// ---------------------------------------------------------------------------
type PageState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase: "ready"
      child: Child
      messages: ChatMessage[]
      input: string
      sending: boolean
      serviceError: string | null
      lastAttemptedText: string | null
    }

type Action =
  | { type: "LOADED"; child: Child }
  | { type: "ERROR"; message: string }
  | { type: "INPUT"; text: string }
  | { type: "SEND_START"; userMessage: ChatMessage; attemptedText: string }
  | { type: "SEND_DONE"; assistantMessage: ChatMessage }
  | { type: "SEND_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }

function reducer(state: PageState, action: Action): PageState {
  switch (action.type) {
    case "LOADED":
      return {
        phase: "ready",
        child: action.child,
        messages: [],
        input: "",
        sending: false,
        serviceError: null,
        lastAttemptedText: null,
      }
    case "ERROR":
      return { phase: "error", message: action.message }
  }
  if (state.phase !== "ready") return state

  switch (action.type) {
    case "INPUT":
      return { ...state, input: action.text, serviceError: null }
    case "SEND_START":
      return {
        ...state,
        messages: [...state.messages, action.userMessage],
        input: "",
        sending: true,
        serviceError: null,
        lastAttemptedText: action.attemptedText,
      }
    case "SEND_DONE":
      return {
        ...state,
        messages: [...state.messages, action.assistantMessage],
        sending: false,
        lastAttemptedText: null,
      }
    case "SEND_ERROR":
      return {
        ...state,
        sending: false,
        serviceError: action.error,
      }
    case "CLEAR_ERROR":
      return { ...state, serviceError: null }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Helper: create client user message
// ---------------------------------------------------------------------------
function createClientMessage(text: string): ChatMessage {
  return {
    id: `msg_user_${Date.now()}`,
    sender: "user",
    text: text.trim(),
    createdAt: new Date().toISOString(),
    isDemo: false,
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function NutritionPage({ childId }: ChildFeaturePageProps) {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" })
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load child profile on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const child = await resolveChild(childId)
        if (!cancelled) {
          dispatch({ type: "LOADED", child })
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof AppError
              ? err.message
              : "Unable to load child information for nutrition guide."
          dispatch({ type: "ERROR", message: msg })
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [childId])

  const messageCount = state.phase === "ready" ? state.messages.length : 0
  const isSending = state.phase === "ready" ? state.sending : false

  // Scroll to bottom when new messages arrive or typing status changes
  useEffect(() => {
    if (state.phase === "ready") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [state.phase, messageCount, isSending])


  // ── Loading state ────────────────────────────────────────────────────────
  if (state.phase === "loading") {
    return (
      <div
        className="flex min-w-0 flex-col gap-6 max-w-3xl animate-pulse"
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-64 bg-muted rounded-md" />
        <div className="h-24 w-full bg-muted rounded-xl" />
        <div className="h-96 w-full bg-muted rounded-xl" />
        <span className="sr-only">Loading nutrition guide…</span>
      </div>
    )
  }

  // ── Error state (e.g. unknown child ID — BR-08, T-05) ────────────────────
  if (state.phase === "error") {
    return (
      <div
        className="flex min-w-0 flex-col gap-4 max-w-lg rounded-xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/50 dark:bg-rose-950/20"
        role="alert"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200">
              Nutrition Guide Unavailable
            </h2>
            <p className="text-sm text-rose-700 dark:text-rose-300">{state.message}</p>
          </div>
        </div>
        <div className="pt-2">
          <Link
            to={routes.dashboard}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Ready state ──────────────────────────────────────────────────────────
  const { child, messages, input, sending, serviceError, lastAttemptedText } = state
  const childAgeMonths = ageInMonths(child.dateOfBirth)
  const isFirstUse = messages.length === 0

  async function handleSend(textToSend: string) {
    const trimmed = textToSend.trim()
    if (!trimmed || sending) return

    const userMessage = createClientMessage(trimmed)
    dispatch({ type: "SEND_START", userMessage, attemptedText: trimmed })

    try {
      const assistantMessage = await nutritionService.getDemoResponse({
        childId: child.id,
        text: trimmed,
      })
      dispatch({ type: "SEND_DONE", assistantMessage })
    } catch (err) {
      const msg =
        err instanceof AppError
          ? err.message
          : "Unable to retrieve simulated response. Please try again."
      dispatch({ type: "SEND_ERROR", error: msg })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter without Shift submits; Shift+Enter creates a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  function handleRetry() {
    if (lastAttemptedText) {
      handleSend(lastAttemptedText)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 max-w-3xl pb-16">
      {/* ── Mandatory Disclaimer Banner (FR-042, BR-06, BR-07) ── */}
      <aside
        className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-foreground dark:border-primary/40 dark:bg-primary/10 shadow-xs"
        aria-label="Demo Disclaimer Notice"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground mt-0.5">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm tracking-tight text-foreground">
                Demo responses — no Gemini API connected
              </span>
              <span className="rounded-md bg-primary/10 dark:bg-primary/20 px-2 py-0.5 text-xs font-mono font-medium text-primary">
                FR-042 scripted demo
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This interactive chat provides educational food and hygiene guidelines for Sri Lankan caregivers. <strong>It does not provide individual clinical diagnoses, drug dosages, or therapeutic prescriptions.</strong> For medical emergencies or acute illness, seek urgent hospital care immediately.
            </p>
          </div>
        </div>
      </aside>


      {/* ── Header & Child Context Bar ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs sm:text-sm mb-1">
              <Sparkles className="h-4 w-4" aria-hidden />
              <span>SuwaDaru AI (සුවදරු AI) • Pediatric Companion</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Food & Feeding Assistant
            </h1>
          </div>
          <Link
            to={routes.child(child.id)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
          >
            <span>Back to {child.name}&apos;s profile</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Child Context Banner with Child-Age Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base">
              {child.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{child.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Age: {formatAge(childAgeMonths)} ({childAgeMonths} mo)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Born: <span className="font-medium text-foreground">{formatCalendarDate(child.dateOfBirth)}</span> · Educational complementary feeding recommendations
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            <span>Clinic: <strong>{child.clinicName || "Local MOH Area"}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex flex-col rounded-xl border bg-card shadow-xs overflow-hidden h-[540px]">
        {/* Chat History Container */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
          role="log"
          aria-label={`Nutrition conversation history for ${child.name}`}
          aria-live="polite"
        >
          {/* First-use / Empty State Greeting (FR-040) */}
          {isFirstUse && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-3 my-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" aria-hidden />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-sm font-bold text-foreground">
                  Welcome to SuwaDaru AI (සුවදරු AI)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Friendly, trustworthy educational guidance on age-appropriate Sri Lankan child nutrition, food safety, growth monitoring, and feeding milestones for {child.name}.
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                Choose a suggested topic below or type your question in English, සිංහල, or தமிழ்.
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => {
            const isUser = msg.sender === "user"
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-2.5 max-w-[85%]",
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto",
                )}
              >
                {/* Avatar Icon */}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold overflow-hidden",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "ring-1 ring-primary/30 bg-white",
                  )}
                  aria-hidden
                >
                  {isUser ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <img src="/suwadaru-logo.jpg" alt="SuwaDaru AI" className="size-full object-cover" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-line",
                      isUser
                        ? "rounded-tr-xs bg-primary text-primary-foreground"
                        : "rounded-tl-xs bg-muted/60 text-foreground border border-border/70",
                    )}
                  >
                    {msg.text}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] text-muted-foreground px-1",
                      isUser ? "justify-end" : "justify-start",
                    )}
                  >
                    <span>{isUser ? `${child.name}'s caregiver` : "SuwaDaru AI (සුවදරු AI)"}</span>
                    <span>·</span>
                    <time dateTime={msg.createdAt}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {!isUser && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-muted-foreground/80">Demo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}


          {/* Simulated Typing Indicator */}
          {sending && (
            <div
              className="flex items-center gap-2.5 text-xs text-muted-foreground animate-in fade-in"
              role="status"
              aria-label="SuwaDaru is preparing an educational response"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/90 text-primary-foreground text-xs">
                <Bot className="h-4 w-4" />
              </div>

              <div className="rounded-2xl rounded-tl-xs bg-muted/60 border border-border/70 px-4 py-2.5 flex items-center gap-1.5 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="text-xs text-muted-foreground ml-1">Composing guidance…</span>
              </div>
            </div>
          )}

          {/* Service Error / Retry State Banner */}
          {serviceError && (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 flex items-center justify-between gap-3 animate-in fade-in"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" aria-hidden />
                <span>{serviceError}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="border-t bg-muted/20 px-4 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap" role="group" aria-label="Suggested nutrition questions">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1 shrink-0">
              <Sparkles className="h-3 w-3 text-primary" aria-hidden />
              Suggestions:
            </span>
            {SUGGESTED_NUTRITION_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={sending}
                className="rounded-full border bg-background px-3 py-1 text-xs text-foreground hover:bg-primary/10 hover:border-primary transition-colors disabled:opacity-50 shrink-0 shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Form */}
        <div className="border-t p-3 sm:p-4 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(input)
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <label htmlFor="nutritionQueryInput" className="sr-only">
                Ask a pediatric nutrition or complementary feeding question
              </label>
              <textarea
                id="nutritionQueryInput"
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => dispatch({ type: "INPUT", text: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Ask SuwaDaru AI in Sinhala, Tamil, or English (e.g., මාස 8 බබාට අඩු වියදම් කෑම, Budget Meal Plan)…"
                className="w-full resize-none rounded-xl border bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground shadow-xs focus:outline-hidden focus:ring-2 focus:ring-primary max-h-32 min-h-[42px]"
                disabled={sending}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-40 transition-opacity"
              aria-label="Send nutrition query"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 px-1">
            <span>Press <kbd className="font-mono bg-muted px-1 rounded">Enter</kbd> to submit · <kbd className="font-mono bg-muted px-1 rounded">Shift + Enter</kbd> for newline</span>
            <span>Simulated demo</span>
          </div>
        </div>
      </div>

      {/* ── Guidance Footer Notice ── */}
      <footer className="rounded-xl border border-muted/80 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-1.5 text-foreground font-semibold">
          <Info className="h-4 w-4 text-primary shrink-0" aria-hidden />
          <span>Safety & Medical Disclaimer (BR-06 / BR-07)</span>
        </div>
        <p className="leading-relaxed">
          SuwaDaru nutrition responses are based on public health educational frameworks. If your child exhibits severe loss of appetite, persistent vomiting, chronic diarrhea, or unexpected weight faltering, please schedule an appointment at your clinic or consult your Public Health Midwife (PHM).
        </p>
      </footer>
    </div>
  )
}
