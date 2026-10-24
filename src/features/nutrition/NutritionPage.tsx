/**
 * NutritionPage — Frontend B
 *
 * Route: /children/:childId/nutrition
 * Owner: Frontend B (feature/frontend-health)
 *
 * States covered (BRD §8, FR-040–044, T-11):
 *   loading      — resolving child
 *   error        — unknown childId (safe state, BR-08)
 *   first-use    — empty conversation with suggested prompts
 *   conversation — chat history with typing indicator
 *   refused      — safe referral for emergency-like queries
 *   retry        — service error with retry action
 *
 * Constraints:
 *   - Do NOT modify AppShell, router, shared types, or service contracts.
 *   - FR-042: all assistant messages are labeled as demo; no Gemini claim.
 *   - FR-043: emergency-like questions produce a professional-care referral.
 *   - BR-06: no diagnosis, medication, or treatment advice.
 *   - BR-07: no "Gemini replied" or "officially verified" claims.
 */

import { useEffect, useReducer, useRef } from "react"
import { Link } from "react-router"
import { MessageCircle, Send, AlertTriangle, Info } from "lucide-react"
import type { ChildFeaturePageProps, ChatMessage } from "@/types"
import type { Child } from "@/types"
import { AppError } from "@/services/contracts"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { resolveChild, ageInMonths, formatAge } from "../childResolver"
import { nutritionService } from "./nutritionService"
import { SUGGESTED_PROMPTS } from "./mockData"

// ---------------------------------------------------------------------------
// Types
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
    }

type Action =
  | { type: "LOADED"; child: Child }
  | { type: "ERROR"; message: string }
  | { type: "INPUT"; text: string }
  | { type: "SEND_START"; userMessage: ChatMessage }
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
      }
    case "SEND_DONE":
      return {
        ...state,
        messages: [...state.messages, action.assistantMessage],
        sending: false,
      }
    case "SEND_ERROR":
      return { ...state, sending: false, serviceError: action.error }
    case "CLEAR_ERROR":
      return { ...state, serviceError: null }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
type BubbleProps = { message: ChatMessage; childName: string }

function MessageBubble({ message, childName }: BubbleProps) {
  const isUser = message.sender === "user"
  const time = (() => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(message.createdAt))
    } catch {
      return ""
    }
  })()

  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[85%]",
        isUser ? "self-end items-end" : "self-start items-start",
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-[#E8F7F3] text-foreground border border-[#A7F3D0]",
        )}
        aria-label={
          isUser
            ? `You: ${message.text}`
            : `SuwaDaru demo response: ${message.text}`
        }
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{isUser ? `${childName}'s caregiver` : "SuwaDaru"}</span>
        {time && <span aria-hidden>·</span>}
        {time && <time dateTime={message.createdAt}>{time}</time>}
        {!isUser && message.isDemo && (
          <>
            <span aria-hidden>·</span>
            <span className="italic text-[10px] text-muted-foreground/70">
              Demo response
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div
      className="self-start flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-[#E8F7F3] border border-[#A7F3D0] px-4 py-3 text-xs text-muted-foreground"
      aria-live="polite"
      aria-label="SuwaDaru is composing a response"
    >
      <span
        className="h-2 w-2 rounded-full bg-primary animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-primary animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-primary animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
      <span className="sr-only">Composing a response…</span>
    </div>
  )
}

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
// Main page component
// ---------------------------------------------------------------------------
export function NutritionPage({ childId }: ChildFeaturePageProps) {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" })
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll chat to bottom when messages update.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [state])

  // Load child on mount.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const child = await resolveChild(childId)
        if (!cancelled) dispatch({ type: "LOADED", child })
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof AppError
              ? err.message
              : "Unable to load child. Please try again."
          dispatch({ type: "ERROR", message })
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [childId])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state.phase === "loading") {
    return (
      <div className="flex max-w-2xl flex-col gap-4" aria-busy="true">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state.phase === "error") {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <div className="rounded-xl border border-[#FECDCA] bg-[#FFF1F0] p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#E27D72]" aria-hidden />
            <h1 className="text-lg font-semibold">Child not found</h1>
          </div>
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <Link
            to={routes.dashboard}
            className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Ready ────────────────────────────────────────────────────────────────
  const { child, messages, input, sending, serviceError } = state
  const ageMonths = ageInMonths(child.dateOfBirth)
  const isEmpty = messages.length === 0

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return

    const userMessage = createClientMessage(text)
    dispatch({ type: "SEND_START", userMessage })

    try {
      const assistantMessage = await nutritionService.getDemoResponse({
        childId,
        text: text.trim(),
      })
      dispatch({ type: "SEND_DONE", assistantMessage })
    } catch (err) {
      const msg =
        err instanceof AppError
          ? err.message
          : "Unable to get a response. Please try again."
      dispatch({ type: "SEND_ERROR", error: msg })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 max-w-2xl">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">
            Nutrition — {child.name}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatAge(ageMonths)} old · Educational nutrition guide (scripted demo)
        </p>
      </div>

      {/* Disclaimer banner (FR-042, BR-06) */}
      <aside
        aria-label="Demo disclaimer"
        className="flex items-start gap-2 rounded-xl border border-border bg-[#E8F7F3] px-4 py-3 text-xs"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="text-muted-foreground">
          <strong className="text-foreground">Demo only.</strong> Responses are
          scripted educational examples. No request is sent to Gemini or any AI
          service. SuwaDaru does not provide medical advice, diagnosis, or
          treatment. For health concerns, always consult your PHM or doctor.
        </span>
      </aside>

      {/* Chat window */}
      <section
        aria-label="Nutrition chat"
        className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
        style={{ minHeight: "400px" }}
      >
        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
          style={{ minHeight: "300px", maxHeight: "480px" }}
          aria-live="polite"
          aria-atomic="false"
          aria-label="Conversation"
        >
          {/* First-use / empty state */}
          {isEmpty && !sending && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30" aria-hidden />
              <div>
                <p className="font-semibold text-sm">Ask a nutrition question</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try one of the example questions below, or type your own.
                </p>
              </div>
              {/* Child age context (FR-040) */}
              <div className="rounded-lg bg-[#E8F7F3] border border-[#A7F3D0] px-4 py-2 text-xs text-[#0F766E]">
                Context: {child.name}, {formatAge(ageMonths)} old
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} childName={child.name} />
          ))}

          {/* Typing indicator */}
          {sending && <TypingIndicator />}

          {/* Service error */}
          {serviceError && (
            <div className="self-start flex items-center gap-2 rounded-xl border border-[#FECDCA] bg-[#FFF1F0] px-4 py-3 text-xs text-[#B91C1C]">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              <span>{serviceError}</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "CLEAR_ERROR" })}
                className="ml-1 underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded"
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={bottomRef} aria-hidden />
        </div>

        {/* Suggested prompts (first-use) */}
        {isEmpty && (
          <div className="border-t border-border px-4 py-3 overflow-x-auto">
            <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
            <ul className="flex flex-wrap gap-2 m-0 p-0 list-none">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    disabled={sending}
                    className={cn(
                      "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium",
                      "hover:bg-[#E8F7F3] hover:border-[#A7F3D0] hover:text-primary",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      "transition-colors disabled:opacity-50 text-left",
                    )}
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-border p-3 flex items-end gap-2">
          <textarea
            ref={inputRef}
            id="nutrition-input"
            value={input}
            onChange={(e) => dispatch({ type: "INPUT", text: e.target.value })}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Ask about foods, feeding, or nutrition…"
            rows={2}
            maxLength={500}
            className={cn(
              "flex-1 min-w-0 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "disabled:opacity-50 placeholder:text-muted-foreground",
            )}
            aria-label="Type a nutrition question"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={sending || !input.trim()}
            className={cn(
              "shrink-0 rounded-lg bg-primary p-2.5 text-primary-foreground",
              "hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "disabled:opacity-40 transition-opacity",
            )}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </section>

      {/* Footer disclaimer */}
      <footer className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <strong>Fictional demonstration only.</strong> All responses are
        pre-written educational examples. No message is sent to Gemini or any
        external service. For real dietary advice, consult your Public Health
        Midwife (PHM) or a qualified nutritionist.
      </footer>
    </div>
  )
}
