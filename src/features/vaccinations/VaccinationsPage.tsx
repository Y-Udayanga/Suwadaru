/**
 * VaccinationsPage — Frontend B
 *
 * Route: /children/:childId/vaccinations
 * Owner: Frontend B (feature/frontend-health)
 *
 * States covered (BRD §8, FR-020–026, T-05–T-07):
 *   loading   — resolving child + schedule
 *   error     — unknown childId (safe 404 state)
 *   upcoming  — schedule list with status badges
 *   entry     — inline form to report a dose as parent_reported
 *   no-data   — empty records (no administered doses yet)
 *
 * Constraints:
 *   - Do NOT modify AppShell, router, shared types, or service contracts.
 *   - BR-02: user-entered completion is parent_reported only; never verified.
 *   - BR-03: overdue shows a contact-clinic suggestion, not a catch-up plan.
 *   - FR-025: reminder preview explicitly labeled "not sent".
 *   - FR-023: schedule source URL and version displayed.
 */

import { useEffect, useReducer, useRef, useState } from "react"
import { Link } from "react-router"
import {
  Syringe,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Info,
} from "lucide-react"
import type { ChildFeaturePageProps } from "@/types"
import type {
  VaccinationMilestone,
  VaccinationRecord,
  VaccinationStatus,
} from "@/types"
import type { Child } from "@/types"
import { AppError } from "@/services/contracts"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { resolveChild, ageInMonths, formatAge } from "../childResolver"
import { vaccinationService } from "./vaccinationService"
import {
  computeVaccinationStatus,
  STATUS_LABELS,
  STATUS_BG,
} from "./vaccinationStatus"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ReportFormState = {
  vaccineCode: string
  administeredOn: string
  error: string | null
  submitting: boolean
}

type PageState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase: "ready"
      child: Child
      milestones: VaccinationMilestone[]
      records: VaccinationRecord[]
      reportForm: ReportFormState | null
    }

type Action =
  | { type: "LOADED"; child: Child; milestones: VaccinationMilestone[]; records: VaccinationRecord[] }
  | { type: "ERROR"; message: string }
  | { type: "OPEN_REPORT"; vaccineCode: string }
  | { type: "CLOSE_REPORT" }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_FORM_ERROR"; error: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_DONE"; record: VaccinationRecord }

function reducer(state: PageState, action: Action): PageState {
  if (action.type === "LOADED") {
    return {
      phase: "ready",
      child: action.child,
      milestones: action.milestones,
      records: action.records,
      reportForm: null,
    }
  }
  if (action.type === "ERROR") return { phase: "error", message: action.message }
  if (state.phase !== "ready") return state

  switch (action.type) {
    case "OPEN_REPORT":
      return {
        ...state,
        reportForm: {
          vaccineCode: action.vaccineCode,
          administeredOn: new Date().toISOString().slice(0, 10),
          error: null,
          submitting: false,
        },
      }
    case "CLOSE_REPORT":
      return { ...state, reportForm: null }
    case "SET_DATE":
      return state.reportForm
        ? { ...state, reportForm: { ...state.reportForm, administeredOn: action.date, error: null } }
        : state
    case "SET_FORM_ERROR":
      return state.reportForm
        ? { ...state, reportForm: { ...state.reportForm, error: action.error, submitting: false } }
        : state
    case "SUBMIT_START":
      return state.reportForm
        ? { ...state, reportForm: { ...state.reportForm, submitting: true, error: null } }
        : state
    case "SUBMIT_DONE":
      return {
        ...state,
        records: [...state.records, action.record],
        reportForm: null,
      }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Status icon helper
// ---------------------------------------------------------------------------
function StatusIcon({ status }: { status: VaccinationStatus }) {
  const cls = "h-4 w-4 shrink-0"
  switch (status) {
    case "completed_unverified":
    case "completed_verified":
      return <CheckCircle2 className={cn(cls, "text-[#0F766E]")} aria-hidden />
    case "overdue":
      return <AlertTriangle className={cn(cls, "text-[#E27D72]")} aria-hidden />
    case "due":
      return <Clock className={cn(cls, "text-amber-600")} aria-hidden />
    default:
      return <CalendarDays className={cn(cls, "text-muted-foreground")} aria-hidden />
  }
}

// ---------------------------------------------------------------------------
// Milestone card
// ---------------------------------------------------------------------------
type MilestoneCardProps = {
  milestone: VaccinationMilestone
  records: VaccinationRecord[]
  today: string
  onReport: (vaccineCode: string) => void
}

function MilestoneCard({ milestone, records, today, onReport }: MilestoneCardProps) {
  const status = computeVaccinationStatus(milestone, records, today)
  const record = records.find(
    (r) => r.vaccineCode === milestone.vaccineCode && r.administeredOn !== null,
  )
  const isDone =
    status === "completed_unverified" || status === "completed_verified"

  const ageLabel =
    milestone.birthWindow
      ? "At birth (0–4 weeks)"
      : milestone.ageMonths !== null
      ? `${milestone.ageMonths} month${milestone.ageMonths !== 1 ? "s" : ""}`
      : "—"

  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-4 flex flex-col gap-2 transition-shadow hover:shadow-sm",
        status === "overdue" && "border-[#FECDCA]",
        status === "due" && "border-amber-200",
        isDone && "border-[#A7F3D0] opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon status={status} />
          <h3 className="font-semibold text-sm leading-snug truncate">
            {milestone.vaccineName}
          </h3>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            STATUS_BG[status],
          )}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div>
          <dt className="sr-only">Milestone age</dt>
          <dd>{ageLabel}</dd>
        </div>
        <div>
          <dt className="sr-only">Scheduled due date</dt>
          <dd>Due {formatDate(milestone.dueDate)}</dd>
        </div>
        {record?.administeredOn && (
          <div className="col-span-2">
            <dt className="sr-only">Reported administered date</dt>
            <dd className="text-[#0F766E]">
              Reported on {formatDate(record.administeredOn)} —{" "}
              <span className="italic">parent-reported, not clinically verified</span>
            </dd>
          </div>
        )}
      </dl>

      {status === "overdue" && (
        <p className="rounded-lg bg-[#FFF1F0] px-3 py-2 text-xs text-[#B91C1C]">
          <strong>Overdue:</strong> Please contact your clinic or Public Health
          Midwife (PHM) to arrange a suitable follow-up appointment.{" "}
          <em>SuwaDaru does not generate catch-up schedules.</em>
        </p>
      )}

      {!isDone && (
        <button
          type="button"
          onClick={() => onReport(milestone.vaccineCode)}
          className={cn(
            "mt-1 inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-medium",
            "bg-[#E8F7F3] text-[#0F766E] hover:bg-[#d1f0e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "transition-colors",
          )}
        >
          <PlusCircle className="h-3.5 w-3.5" aria-hidden />
          Report administered date
        </button>
      )}
    </article>
  )
}

// ---------------------------------------------------------------------------
// Inline report form
// ---------------------------------------------------------------------------
type ReportFormProps = {
  state: ReportFormState
  milestoneName: string
  childId: string
  today: string
  onDateChange: (date: string) => void
  onSubmit: () => void
  onCancel: () => void
}

function ReportForm({
  state,
  milestoneName,
  today,
  onDateChange,
  onSubmit,
  onCancel,
}: ReportFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`Report administered date for ${milestoneName}`}
      className="rounded-xl border border-[#A7F3D0] bg-[#E8F7F3] p-4 flex flex-col gap-3"
    >
      <p className="text-sm font-medium text-[#0F766E]">
        Report administered date for <strong>{milestoneName}</strong>
      </p>
      <p className="text-xs text-muted-foreground">
        This records the date a caregiver reports the vaccine was given. It is{" "}
        <strong>not clinically verified</strong> and will not be treated as an
        official health-worker record.
      </p>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="administered-date"
          className="text-xs font-medium text-foreground"
        >
          Date administered
        </label>
        <input
          ref={inputRef}
          id="administered-date"
          type="date"
          max={today}
          value={state.administeredOn}
          onChange={(e) => onDateChange(e.target.value)}
          disabled={state.submitting}
          className={cn(
            "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            state.error && "border-[#E27D72]",
          )}
          aria-describedby={state.error ? "report-error" : undefined}
          aria-invalid={!!state.error}
        />
        {state.error && (
          <p id="report-error" className="text-xs text-[#E27D72]" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={onSubmit}
          disabled={state.submitting}
          className={cn(
            "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
            "hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "disabled:opacity-50 transition-opacity",
          )}
        >
          {state.submitting ? "Saving…" : "Save record"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={state.submitting}
          className={cn(
            "rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium",
            "hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "disabled:opacity-50 transition-colors",
          )}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso + "T00:00:00"))
  } catch {
    return iso
  }
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export function VaccinationsPage({ childId }: ChildFeaturePageProps) {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" })
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  // Load child + schedule + records on mount / childId change.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [child, milestones, records] = await Promise.all([
          resolveChild(childId),
          vaccinationService.getSchedule(childId),
          vaccinationService.getRecords(childId),
        ])
        if (!cancelled) dispatch({ type: "LOADED", child, milestones, records })
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof AppError
              ? err.message
              : "Unable to load vaccination data. Please try again."
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
        <div className="h-4 w-32 rounded-lg bg-muted animate-pulse" />
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  // ── Error (invalid childId → safe state, BR-08, T-05) ───────────────────
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
  const { child, milestones, records, reportForm } = state
  const ageMonths = ageInMonths(child.dateOfBirth)

  const reportingMilestone = reportForm
    ? milestones.find((m) => m.vaccineCode === reportForm.vaccineCode)
    : null

  // Sort: overdue first, then due, then upcoming, then completed.
  const sortOrder: Record<VaccinationStatus, number> = {
    overdue: 0,
    due: 1,
    upcoming: 2,
    completed_unverified: 3,
    completed_verified: 4,
  }
  const sortedMilestones = [...milestones].sort((a, b) => {
    const sa = computeVaccinationStatus(a, records, today)
    const sb = computeVaccinationStatus(b, records, today)
    if (sortOrder[sa] !== sortOrder[sb]) return sortOrder[sa] - sortOrder[sb]
    return a.dueDate.localeCompare(b.dueDate)
  })

  // Reminder preview (FR-025).
  const nextDue = sortedMilestones.find((m) => {
    const s = computeVaccinationStatus(m, records, today)
    return s === "due" || s === "overdue"
  })

  async function handleSubmitReport() {
    if (!reportForm) return
    if (!reportForm.administeredOn) {
      dispatch({ type: "SET_FORM_ERROR", error: "Please enter the date." })
      return
    }
    if (reportForm.administeredOn > today) {
      dispatch({ type: "SET_FORM_ERROR", error: "Date cannot be in the future." })
      return
    }
    dispatch({ type: "SUBMIT_START" })
    try {
      const record = await vaccinationService.addReportedDose({
        childId,
        vaccineCode: reportForm.vaccineCode,
        administeredOn: reportForm.administeredOn,
      })
      dispatch({ type: "SUBMIT_DONE", record })
    } catch (err) {
      const msg =
        err instanceof AppError ? err.message : "Unable to save record."
      dispatch({ type: "SET_FORM_ERROR", error: msg })
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-primary" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">
            Vaccinations — {child.name}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatAge(ageMonths)} old · Birthdate-derived schedule below
        </p>
      </div>

      {/* Source banner */}
      <aside
        aria-label="Schedule source information"
        className="flex items-start gap-2 rounded-xl border border-border bg-[#E8F7F3] px-4 py-3 text-xs text-muted-foreground"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span>
          Schedule version:{" "}
          <strong className="text-foreground">
            LK-EPI-2023-baseline (research reference only)
          </strong>
          . Dates are calculated from {child.name}'s date of birth using
          calendar-month arithmetic.{" "}
          <a
            href="https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Source PDF ↗
          </a>
          . Always verify the current effective circular with your PHM or clinic
          before making decisions.
        </span>
      </aside>

      {/* Reminder preview (FR-025, BR-07) */}
      {nextDue && (
        <aside
          aria-label="Upcoming reminder preview"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs"
        >
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <span className="text-amber-800">
            <strong>Reminder preview (not sent):</strong> {child.name} has{" "}
            <strong>{nextDue.vaccineName}</strong> due on{" "}
            {formatDate(nextDue.dueDate)}. Contact your clinic to schedule.
            SuwaDaru does not send SMS or push notifications.
          </span>
        </aside>
      )}

      {/* Inline report form */}
      {reportForm && reportingMilestone && (
        <ReportForm
          state={reportForm}
          milestoneName={reportingMilestone.vaccineName}
          childId={childId}
          today={today}
          onDateChange={(date) => dispatch({ type: "SET_DATE", date })}
          onSubmit={handleSubmitReport}
          onCancel={() => dispatch({ type: "CLOSE_REPORT" })}
        />
      )}

      {/* Milestone list */}
      <section aria-label="Vaccine milestones">
        <h2 className="mb-3 text-base font-semibold">Schedule milestones</h2>
        {milestones.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
            <Syringe className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden />
            <p>No schedule available for this child.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {sortedMilestones.map((milestone) => (
              <li key={milestone.id}>
                <MilestoneCard
                  milestone={milestone}
                  records={records}
                  today={today}
                  onReport={(code) => dispatch({ type: "OPEN_REPORT", vaccineCode: code })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Accessible tabular alternative (NFR-05) */}
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded">
          View as table (accessible alternative)
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-xs">
            <caption className="sr-only">
              Vaccination schedule for {child.name}
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted">
                <th scope="col" className="px-3 py-2 text-left font-semibold">Vaccine</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Age</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Due date</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Status</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Reported date</th>
              </tr>
            </thead>
            <tbody>
              {sortedMilestones.map((m) => {
                const status = computeVaccinationStatus(m, records, today)
                const rec = records.find(
                  (r) => r.vaccineCode === m.vaccineCode && r.administeredOn,
                )
                return (
                  <tr key={m.id} className="border-b border-border">
                    <td className="px-3 py-2">{m.vaccineName}</td>
                    <td className="px-3 py-2">
                      {m.birthWindow ? "At birth" : `${m.ageMonths}m`}
                    </td>
                    <td className="px-3 py-2">{formatDate(m.dueDate)}</td>
                    <td className="px-3 py-2">{STATUS_LABELS[status]}</td>
                    <td className="px-3 py-2">
                      {rec?.administeredOn ? formatDate(rec.administeredOn) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </details>

      {/* Clinical disclaimer */}
      <footer className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <strong>Fictional demonstration only.</strong> Records entered here are
        parent-reported and are not clinically verified. The schedule shown is a
        research baseline and may not reflect the current effective Sri Lanka
        EPI circular. Always consult your PHM or doctor.
      </footer>
    </div>
  )
}
