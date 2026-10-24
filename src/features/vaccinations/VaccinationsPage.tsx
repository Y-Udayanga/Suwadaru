/**
 * VaccinationsPage — Frontend B
 *
 * Route: /children/:childId/vaccinations
 * Owner: Frontend B (feature/frontend-health)
 *
 * SOURCING & GOVERNANCE:
 *   - Schedule baseline: Sri Lanka National Immunization Schedule (2023 baseline).
 *   - Sourced from: https://www.epid.gov.lk/storage/post/pdfs/en_6403b42a75fa4_Doc2.pdf
 *   - Mandatory label: "For demonstration — verify the latest official EPI schedule before clinical use"
 *
 * BRD CONSTRAINTS SATISFIED:
 *   - FR-020: Birthdate-derived timeline using calendar-month arithmetic.
 *   - FR-021: Distinguish scheduled due date, actual administered date, and clinic appointment.
 *   - FR-022: Distinct upcoming, due, overdue, and parent-reported unverified statuses.
 *   - FR-023: Versioned schedule source link and reviewed status banner.
 *   - FR-024: Interactive report-dose form with non-future validation and parent_reported provenance.
 *   - FR-025: Reminder preview explicitly labeled "no message sent".
 *   - FR-026: Month-end and leap-year calendar dates; no custom catch-up regimes.
 *   - BR-01: Pure calendar-aware date addition.
 *   - BR-02: User-entered completion is parent_reported only; never verified.
 *   - BR-03: Missed milestone shows PHM/clinic contact guidance, not catch-up calculation.
 *   - BR-07: Demo honesty — no fake SMS, no false verification.
 *   - NFR-05: Accessible table alternative and non-color-dependent statuses.
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
  ExternalLink,
  ShieldCheck,
  FileText,
  Calendar,
  X,
  Bell,
  PhoneCall,
  ArrowLeft,
  ChevronRight,
  ListFilter,
  Table as TableIcon,
  LayoutList,
  Edit2,
  Check,
} from "lucide-react"
import type { ChildFeaturePageProps } from "@/types"
import type {
  VaccinationMilestone,
  VaccinationRecord,
  VaccinationStatus,
  ClinicAppointment,
} from "@/types"
import type { Child } from "@/types"
import { AppError } from "@/services/contracts"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { resolveChild, ageInMonths, formatAge } from "../childResolver"
import { vaccinationService } from "./vaccinationService"
import { appointmentService } from "../appointments/appointmentService"
import {
  computeVaccinationStatus,
  computeScheduleSummary,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_ACCESSIBILITY_DESCRIPTIONS,
  matchesFilter,
  type StatusFilterKey,
} from "./vaccinationStatus"
import {
  EPI_SCHEDULE_METADATA,
  getVaccineDefinition,
  type VaccineScheduleDefinition,
} from "./scheduleConfig"
import { formatCalendarDate, isFutureDate } from "./calendarDate"

// ---------------------------------------------------------------------------
// Page state & actions
// ---------------------------------------------------------------------------
interface ReportFormState {
  vaccineCode: string
  vaccineName: string
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
      appointments: ClinicAppointment[]
      filter: StatusFilterKey
      viewMode: "timeline" | "table"
      reportModal: ReportFormState | null
      detailModal: VaccineScheduleDefinition | null
      reminderPreviewMilestone: VaccinationMilestone | null
      successToast: string | null
    }

type Action =
  | {
      type: "LOADED"
      child: Child
      milestones: VaccinationMilestone[]
      records: VaccinationRecord[]
      appointments: ClinicAppointment[]
    }
  | { type: "ERROR"; message: string }
  | { type: "SET_FILTER"; filter: StatusFilterKey }
  | { type: "SET_VIEW_MODE"; mode: "timeline" | "table" }
  | { type: "OPEN_REPORT"; vaccineCode: string; vaccineName: string; defaultDate: string }
  | { type: "CLOSE_REPORT" }
  | { type: "SET_REPORT_DATE"; date: string }
  | { type: "SET_REPORT_ERROR"; error: string }
  | { type: "SUBMIT_REPORT_START" }
  | { type: "SUBMIT_REPORT_DONE"; record: VaccinationRecord; message: string }
  | { type: "OPEN_DETAIL"; definition: VaccineScheduleDefinition }
  | { type: "CLOSE_DETAIL" }
  | { type: "OPEN_REMINDER"; milestone: VaccinationMilestone }
  | { type: "CLOSE_REMINDER" }
  | { type: "DISMISS_TOAST" }

function reducer(state: PageState, action: Action): PageState {
  if (action.type === "LOADED") {
    return {
      phase: "ready",
      child: action.child,
      milestones: action.milestones,
      records: action.records,
      appointments: action.appointments,
      filter: "all",
      viewMode: "timeline",
      reportModal: null,
      detailModal: null,
      reminderPreviewMilestone: null,
      successToast: null,
    }
  }
  if (action.type === "ERROR") return { phase: "error", message: action.message }
  if (state.phase !== "ready") return state

  switch (action.type) {
    case "SET_FILTER":
      return { ...state, filter: action.filter }
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode }
    case "OPEN_REPORT":
      return {
        ...state,
        reportModal: {
          vaccineCode: action.vaccineCode,
          vaccineName: action.vaccineName,
          administeredOn: action.defaultDate,
          error: null,
          submitting: false,
        },
      }
    case "CLOSE_REPORT":
      return { ...state, reportModal: null }
    case "SET_REPORT_DATE":
      return state.reportModal
        ? {
            ...state,
            reportModal: {
              ...state.reportModal,
              administeredOn: action.date,
              error: null,
            },
          }
        : state
    case "SET_REPORT_ERROR":
      return state.reportModal
        ? {
            ...state,
            reportModal: {
              ...state.reportModal,
              error: action.error,
              submitting: false,
            },
          }
        : state
    case "SUBMIT_REPORT_START":
      return state.reportModal
        ? { ...state, reportModal: { ...state.reportModal, submitting: true, error: null } }
        : state
    case "SUBMIT_REPORT_DONE": {
      const updated = state.records.filter((r) => r.vaccineCode !== action.record.vaccineCode)
      return {
        ...state,
        records: [...updated, action.record],
        reportModal: null,
        successToast: action.message,
      }
    }
    case "OPEN_DETAIL":
      return { ...state, detailModal: action.definition }
    case "CLOSE_DETAIL":
      return { ...state, detailModal: null }
    case "OPEN_REMINDER":
      return { ...state, reminderPreviewMilestone: action.milestone }
    case "CLOSE_REMINDER":
      return { ...state, reminderPreviewMilestone: null }
    case "DISMISS_TOAST":
      return { ...state, successToast: null }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Helper: Find linked clinic appointment for milestone
// ---------------------------------------------------------------------------
function findLinkedAppointment(
  milestone: VaccinationMilestone,
  appointments: ClinicAppointment[],
): ClinicAppointment | undefined {
  const code = milestone.vaccineCode.toLowerCase()
  return appointments.find((a) => {
    const purpose = (a.purpose ?? "").toLowerCase()
    return (
      purpose.includes(code) ||
      (code.startsWith("penta") && purpose.includes("penta")) ||
      (code.startsWith("opv") && purpose.includes("opv")) ||
      (code.startsWith("fipv") && purpose.includes("fipv")) ||
      (code.startsWith("mmr") && purpose.includes("mmr")) ||
      (code === "je" && (purpose.includes("je") || purpose.includes("encephalitis"))) ||
      (code.startsWith("dt") && purpose.includes("dt")) ||
      (code === "bcg" && purpose.includes("bcg"))
    )
  })
}

// ---------------------------------------------------------------------------
// Accessible Status Badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: VaccinationStatus }) {
  const icon = (() => {
    switch (status) {
      case "completed_verified":
        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
      case "completed_unverified":
        return <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" aria-hidden />
      case "overdue":
        return <AlertTriangle className="h-3.5 w-3.5 text-rose-600" aria-hidden />
      case "due":
        return <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden />
      case "upcoming":
      default:
        return <CalendarDays className="h-3.5 w-3.5 text-slate-500" aria-hidden />
    }
  })()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs",
        STATUS_BADGE_CLASSES[status],
      )}
      title={STATUS_ACCESSIBILITY_DESCRIPTIONS[status]}
    >
      {icon}
      <span>{STATUS_LABELS[status]}</span>
      <span className="sr-only">({STATUS_ACCESSIBILITY_DESCRIPTIONS[status]})</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main Vaccinations Page Component
// ---------------------------------------------------------------------------
export function VaccinationsPage({ childId }: ChildFeaturePageProps) {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" })
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const reportDateInputRef = useRef<HTMLInputElement>(null)

  // Load child, schedule, records, and appointments on mount / childId change
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [child, milestones, records, appointments] = await Promise.all([
          resolveChild(childId),
          vaccinationService.getSchedule(childId),
          vaccinationService.getRecords(childId),
          appointmentService.list(childId),
        ])
        if (!cancelled) {
          dispatch({
            type: "LOADED",
            child,
            milestones,
            records,
            appointments,
          })
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof AppError
              ? err.message
              : "Unable to load vaccination records. Please try again."
          dispatch({ type: "ERROR", message: msg })
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [childId])

  const isReportModalOpen = state.phase === "ready" && Boolean(state.reportModal)

  // Focus date input when report modal opens
  useEffect(() => {
    if (isReportModalOpen) {
      setTimeout(() => reportDateInputRef.current?.focus(), 50)
    }
  }, [isReportModalOpen])

  // ── Loading state ────────────────────────────────────────────────────────
  if (state.phase === "loading") {
    return (
      <div
        className="flex min-w-0 flex-col gap-6 max-w-4xl animate-pulse"
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-64 bg-muted rounded-md" />
        <div className="h-24 w-full bg-muted rounded-xl" />
        <div className="h-32 w-full bg-muted rounded-xl" />
        <div className="space-y-4">
          <div className="h-28 w-full bg-muted rounded-xl" />
          <div className="h-28 w-full bg-muted rounded-xl" />
          <div className="h-28 w-full bg-muted rounded-xl" />
        </div>
        <span className="sr-only">Loading immunization schedule…</span>
      </div>
    )
  }

  // ── Error state (e.g., unknown child ID — BR-08, T-05) ───────────────────
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
              Immunization Records Unavailable
            </h2>
            <p className="text-sm text-rose-700 dark:text-rose-300">{state.message}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
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
  const {
    child,
    milestones,
    records,
    appointments,
    filter,
    viewMode,
    reportModal,
    detailModal,
    reminderPreviewMilestone,
    successToast,
  } = state

  const childAgeMonths = ageInMonths(child.dateOfBirth, today)
  const summary = computeScheduleSummary(milestones, records, today)

  // Filtered milestones
  const filteredMilestones = milestones.filter((m) => {
    const status = computeVaccinationStatus(m, records, today)
    return matchesFilter(status, filter)
  })

  // Group milestones by age milestone label for longitudinal timeline
  const groupedMilestones = filteredMilestones.reduce<
    Record<string, { label: string; ageMonths: number | null; items: VaccinationMilestone[] }>
  >((acc, m) => {
    const def = getVaccineDefinition(m.vaccineCode)
    const label = def?.ageMilestoneLabel || (m.birthWindow ? "At Birth" : `${m.ageMonths} Months`)
    const key = m.birthWindow ? "0" : String(m.ageMonths ?? 999)
    if (!acc[key]) {
      acc[key] = { label, ageMonths: m.ageMonths, items: [] }
    }
    acc[key].items.push(m)
    return acc
  }, {})

  // Handle report dose form submission
  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reportModal || reportModal.submitting) return

    const { vaccineCode, vaccineName, administeredOn } = reportModal
    if (!administeredOn || administeredOn.trim() === "") {
      dispatch({ type: "SET_REPORT_ERROR", error: "Please provide an administered date." })
      return
    }

    if (isFutureDate(administeredOn, today)) {
      dispatch({
        type: "SET_REPORT_ERROR",
        error: "Administered date may not be in the future (BR-01, FR-026).",
      })
      return
    }

    if (administeredOn < child.dateOfBirth) {
      dispatch({
        type: "SET_REPORT_ERROR",
        error: `Administered date cannot be before child's date of birth (${formatCalendarDate(child.dateOfBirth)}).`,
      })
      return
    }

    dispatch({ type: "SUBMIT_REPORT_START" })
    try {
      const record = await vaccinationService.addReportedDose({
        childId: child.id,
        vaccineCode,
        administeredOn,
      })
      dispatch({
        type: "SUBMIT_REPORT_DONE",
        record,
        message: `${vaccineName} recorded as parent-reported dose (${formatCalendarDate(administeredOn)}). Marked unverified.`,
      })
    } catch (err) {
      const msg =
        err instanceof AppError
          ? err.message
          : "Unable to save dose record. Please try again."
      dispatch({ type: "SET_REPORT_ERROR", error: msg })
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 max-w-4xl pb-16">
      {/* ── Official EPI Schedule Baseline & Reviewed Status Banner (FR-023) ── */}
      <aside
        className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-100 shadow-xs"
        aria-label="Official Schedule Baseline Notice"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white mt-0.5">
              <FileText className="h-4 w-4" aria-hidden />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm tracking-tight text-teal-950 dark:text-teal-50">
                  {EPI_SCHEDULE_METADATA.title}
                </span>
                <span className="rounded-md bg-teal-100 dark:bg-teal-900/80 px-2 py-0.5 text-xs font-mono font-medium text-teal-800 dark:text-teal-200">
                  v{EPI_SCHEDULE_METADATA.version}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-teal-800 dark:text-teal-200 font-medium">
                ⚠️ {EPI_SCHEDULE_METADATA.mandatoryDisclaimer}
              </p>
              <p className="text-xs text-teal-700/80 dark:text-teal-300/80">
                Attribution: {EPI_SCHEDULE_METADATA.sourceAttribution} · Baseline effective: {EPI_SCHEDULE_METADATA.effectiveYear}
              </p>
            </div>
          </div>
          <a
            href={EPI_SCHEDULE_METADATA.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 rounded-lg border border-teal-300 dark:border-teal-700 bg-white/80 dark:bg-teal-900/60 px-3 py-1.5 text-xs font-medium text-teal-900 dark:text-teal-100 hover:bg-white dark:hover:bg-teal-900 transition-colors shadow-2xs"
          >
            <span>Official Schedule PDF</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </aside>

      {/* ── Page Header & Child Context ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
              <Syringe className="h-4 w-4" aria-hidden />
              <span>Pediatric Immunization Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Vaccination Timeline
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

        {/* Child Context Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold text-lg">
              {child.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{child.name}</h2>
                <span className="capitalize text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {child.sex}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Born: <span className="font-medium text-foreground">{formatCalendarDate(child.dateOfBirth)}</span> · Current age: <span className="font-medium text-foreground">{formatAge(childAgeMonths)}</span> ({childAgeMonths} completed months)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            <span>Clinic: <strong>{child.clinicName || "Colombo MOH Area Clinic"}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Success Toast Alert ── */}
      {successToast && (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-teal-300 bg-teal-50 p-3 text-teal-900 dark:border-teal-800 dark:bg-teal-950/80 dark:text-teal-100 text-sm animate-in fade-in"
          role="status"
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-teal-600 shrink-0" aria-hidden />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "DISMISS_TOAST" })}
            className="text-teal-700 hover:text-teal-900 p-1"
            aria-label="Dismiss toast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Next Milestone Hero & Summary Card ── */}
      {summary.nextMilestone && (
        <section
          className={cn(
            "rounded-xl border p-5 shadow-xs transition-colors",
            summary.nextMilestoneStatus === "overdue"
              ? "border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20"
              : summary.nextMilestoneStatus === "due"
              ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
              : "border-teal-200 bg-teal-50/30 dark:border-teal-900/40 dark:bg-teal-950/20",
          )}
          aria-labelledby="next-milestone-heading"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" id="next-milestone-heading">
                  Next Scheduled Milestone
                </span>
                <StatusBadge status={summary.nextMilestoneStatus || "upcoming"} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {summary.nextMilestone.vaccineName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Scheduled for: <strong className="text-foreground">{formatCalendarDate(summary.nextMilestone.dueDate)}</strong>
                {summary.nextMilestone.birthWindow ? " (at birth)" : ` (at ${summary.nextMilestone.ageMonths} completed months)`}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "OPEN_REPORT",
                    vaccineCode: summary.nextMilestone!.vaccineCode,
                    vaccineName: summary.nextMilestone!.vaccineName,
                    defaultDate: today,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
              >
                <PlusCircle className="h-4 w-4" aria-hidden />
                <span>Report Administered Dose</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const def = getVaccineDefinition(summary.nextMilestone!.vaccineCode)
                  if (def) dispatch({ type: "OPEN_DETAIL", definition: def })
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span>Guidance</span>
              </button>
            </div>
          </div>

          {/* Overdue alert notice (BR-03) */}
          {summary.nextMilestoneStatus === "overdue" && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-rose-100/80 dark:bg-rose-900/40 p-3 text-xs text-rose-900 dark:text-rose-100 border border-rose-200 dark:border-rose-800">
              <PhoneCall className="h-4 w-4 shrink-0 text-rose-700 dark:text-rose-300 mt-0.5" aria-hidden />
              <div>
                <strong>Overdue Guidance (BR-03):</strong> This milestone is past its national schedule date. Please contact your Public Health Midwife (PHM) or MOH clinic for professional catch-up planning. Do not calculate a catch-up interval yourself.
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Reported Progress Summary (BR-02, BR-07, FR-022) ── */}
      <section
        className="rounded-xl border bg-card p-5 shadow-xs space-y-3"
        aria-labelledby="progress-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 id="progress-heading" className="text-sm font-semibold text-foreground">
              Immunization Timeline Progress
            </h3>
            <p className="text-xs text-muted-foreground">
              {summary.completed} of {summary.total} baseline milestone doses reported ({summary.progressPercentage}%)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              {summary.completed} Reported
            </span>
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {summary.due} Due
            </span>
            <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              {summary.overdue} Overdue
            </span>
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              {summary.upcoming} Upcoming
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div
          className="h-2.5 w-full rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={summary.progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Immunization progress: ${summary.progressPercentage}% recorded`}
        >
          <div
            className="h-full bg-teal-600 transition-all duration-500 rounded-full"
            style={{ width: `${summary.progressPercentage}%` }}
          />
        </div>

        {/* Explanatory Provenance Disclaimer (BR-02, BR-07) */}
        <p className="text-xs text-muted-foreground/90 italic">
          * Based strictly on parent-reported and demonstration records. This progress meter does not imply clinical immunity or official healthcare worker verification.
        </p>
      </section>

      {/* ── Filter Chips and View Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="Filter vaccines by status">
          <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
            <ListFilter className="h-3.5 w-3.5" aria-hidden />
            Filter:
          </span>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_FILTER", filter: "all" })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shadow-2xs whitespace-nowrap",
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={filter === "all"}
          >
            All ({summary.total})
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_FILTER", filter: "due_overdue" })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shadow-2xs whitespace-nowrap",
              filter === "due_overdue"
                ? "bg-amber-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={filter === "due_overdue"}
          >
            Due & Overdue ({summary.due + summary.overdue})
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_FILTER", filter: "reported" })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shadow-2xs whitespace-nowrap",
              filter === "reported"
                ? "bg-teal-700 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={filter === "reported"}
          >
            Reported ({summary.completed})
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_FILTER", filter: "upcoming" })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shadow-2xs whitespace-nowrap",
              filter === "upcoming"
                ? "bg-slate-700 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={filter === "upcoming"}
          >
            Upcoming ({summary.upcoming})
          </button>
        </div>

        {/* View Mode Switcher (Timeline vs Table - NFR-05) */}
        <div className="flex items-center gap-1 self-end sm:self-auto rounded-lg border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_VIEW_MODE", mode: "timeline" })}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              viewMode === "timeline"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Timeline view"
            aria-pressed={viewMode === "timeline"}
          >
            <LayoutList className="h-3.5 w-3.5" aria-hidden />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_VIEW_MODE", mode: "table" })}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Table view"
            aria-pressed={viewMode === "table"}
          >
            <TableIcon className="h-3.5 w-3.5" aria-hidden />
            <span>Accessible Table</span>
          </button>
        </div>
      </div>

      {/* ── Empty Filter State ── */}
      {filteredMilestones.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            No vaccines found matching the selected filter ({filter}).
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_FILTER", filter: "all" })}
            className="text-xs text-primary font-semibold underline underline-offset-4"
          >
            Clear filter and show all vaccines
          </button>
        </div>
      )}

      {/* ── Longitudinal Timeline View ── */}
      {viewMode === "timeline" && filteredMilestones.length > 0 && (
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 sm:before:left-5 before:w-0.5 before:bg-muted-foreground/20">
          {Object.entries(groupedMilestones).map(([key, group]) => (
            <div key={key} className="relative pl-10 sm:pl-12 space-y-4">
              {/* Group milestone header marker */}
              <div className="flex items-center gap-3 -ml-10 sm:-ml-12">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-teal-600 text-white font-bold text-xs shadow-xs z-10">
                  <Calendar className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {group.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {group.ageMonths === null
                      ? "Administered within 4 weeks of birth"
                      : `Recommended milestone at ${group.ageMonths} completed calendar months`}
                  </p>
                </div>
              </div>

              {/* Milestone Cards for this age group */}
              <div className="grid gap-3 sm:grid-cols-1">
                {group.items.map((milestone) => {
                  const status = computeVaccinationStatus(milestone, records, today)
                  const record = records.find(
                    (r) => r.vaccineCode === milestone.vaccineCode && r.administeredOn !== null,
                  )
                  const linkedAppt = findLinkedAppointment(milestone, appointments)
                  const def = getVaccineDefinition(milestone.vaccineCode)

                  return (
                    <article
                      key={milestone.id}
                      className={cn(
                        "rounded-xl border bg-card p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md space-y-4",
                        status === "overdue" && "border-rose-200 dark:border-rose-900/40",
                        status === "due" && "border-amber-200 dark:border-amber-900/40",
                      )}
                    >
                      {/* Card Header: Title & Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-foreground tracking-tight">
                              {milestone.vaccineName}
                            </h4>
                            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                              {milestone.vaccineCode}
                            </span>
                            {def?.doseNumber && (
                              <span className="text-xs text-muted-foreground">
                                ({def.doseNumber})
                              </span>
                            )}
                          </div>
                          {def && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Protects against: <strong className="text-foreground">{def.targetDiseases.join(", ")}</strong>
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={status} />
                        </div>
                      </div>

                      {/* ── FR-021: Separate fields for Scheduled Due Date, Administered Date, Clinic Appointment ── */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg bg-muted/30 p-3 border border-muted/50 text-xs">
                        {/* 1. National Scheduled Due Date */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground block font-medium">
                            1. National Due Date
                          </span>
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                            {formatCalendarDate(milestone.dueDate)}
                          </span>
                          <span className="text-[11px] text-muted-foreground/80 block">
                            EPI baseline calculation (BR-01)
                          </span>
                        </div>

                        {/* 2. Actual Administered Date */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground block font-medium">
                            2. Administered Date
                          </span>
                          {record ? (
                            <div>
                              <span className="font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" aria-hidden />
                                {formatCalendarDate(record.administeredOn ?? "")}
                              </span>
                              <span className="text-[11px] text-teal-700 dark:text-teal-300 block">
                                Sourced: {record.source === "health_worker_verified"
                                  ? "Verified by clinic"
                                  : record.source === "demo"
                                    ? "Sample demo (unverified)"
                                    : "parent_reported (unverified)"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" aria-hidden />
                              Not yet administered
                            </span>
                          )}
                        </div>

                        {/* 3. Linked Clinic Appointment */}
                        <div className="space-y-1">
                          <span className="text-muted-foreground block font-medium">
                            3. Clinic Appointment
                          </span>
                          {linkedAppt ? (
                            <div>
                              <span className="font-semibold text-foreground block">
                                {formatCalendarDate(linkedAppt.scheduledAt.slice(0, 10))}
                              </span>
                              <span className="text-[11px] text-muted-foreground block truncate" title={linkedAppt.clinicName}>
                                {linkedAppt.clinicName} ({linkedAppt.status})
                              </span>
                            </div>
                          ) : (
                            <Link
                              to={routes.appointments(child.id)}
                              className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span>Book clinic visit</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Overdue Guidance Note (BR-03) */}
                      {status === "overdue" && (
                        <div className="rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 p-3 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden />
                          <p>
                            <strong>Missed / Overdue:</strong> Contact your Public Health Midwife (PHM) or local MOH clinic for evaluation and an authorized vaccination plan. Custom catch-up calculation is not provided (BR-03).
                          </p>
                        </div>
                      )}

                      {/* Card Actions: Report Dose, Guidance Details, Reminder Preview */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t flex-wrap">
                        <div className="flex items-center gap-2">
                          {record ? (
                            <button
                              type="button"
                              onClick={() =>
                                dispatch({
                                  type: "OPEN_REPORT",
                                  vaccineCode: milestone.vaccineCode,
                                  vaccineName: milestone.vaccineName,
                                  defaultDate: record.administeredOn ?? today,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                              <span>Update Date</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                dispatch({
                                  type: "OPEN_REPORT",
                                  vaccineCode: milestone.vaccineCode,
                                  vaccineName: milestone.vaccineName,
                                  defaultDate: today,
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                            >
                              <PlusCircle className="h-3.5 w-3.5" aria-hidden />
                              <span>Report Dose</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (def) dispatch({ type: "OPEN_DETAIL", definition: def })
                            }}
                            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Info className="h-3.5 w-3.5" aria-hidden />
                            <span>Vaccine Details</span>
                          </button>
                        </div>

                        {/* Reminder Preview Action (FR-025) */}
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "OPEN_REMINDER", milestone })}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground py-1 px-1.5"
                          title="Preview sample SMS/push notification"
                        >
                          <Bell className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                          <span>Preview Reminder</span>
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Accessible Table View (NFR-05) ── */}
      {viewMode === "table" && filteredMilestones.length > 0 && (
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <caption className="sr-only">
                Complete Immunization Schedule for {child.name} with National Due Dates, Administered Dates, and Statuses
              </caption>
              <thead className="bg-muted/70 text-muted-foreground border-b uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th scope="col" className="p-3">Vaccine & Code</th>
                  <th scope="col" className="p-3">Milestone Age</th>
                  <th scope="col" className="p-3">1. National Due Date</th>
                  <th scope="col" className="p-3">2. Administered Date</th>
                  <th scope="col" className="p-3">3. Linked Clinic Visit</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMilestones.map((m) => {
                  const status = computeVaccinationStatus(m, records, today)
                  const record = records.find((r) => r.vaccineCode === m.vaccineCode && r.administeredOn !== null)
                  const linkedAppt = findLinkedAppointment(m, appointments)
                  const def = getVaccineDefinition(m.vaccineCode)

                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <th scope="row" className="p-3 font-semibold text-foreground">
                        <div>{m.vaccineName}</div>
                        <div className="text-[11px] text-muted-foreground font-mono font-normal">{m.vaccineCode}</div>
                      </th>
                      <td className="p-3 text-muted-foreground">
                        {def?.ageMilestoneLabel || (m.birthWindow ? "At Birth" : `${m.ageMonths} mos`)}
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {formatCalendarDate(m.dueDate)}
                      </td>
                      <td className="p-3">
                        {record ? (
                          <div>
                            <span className="font-semibold text-teal-800 dark:text-teal-200">
                              {formatCalendarDate(record.administeredOn ?? "")}
                            </span>
                            <span className="text-[10px] block text-muted-foreground">
                              (parent_reported unverified)
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">None recorded</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {linkedAppt ? (
                          <div>
                            <span>{formatCalendarDate(linkedAppt.scheduledAt.slice(0, 10))}</span>
                            <span className="block text-[10px] truncate max-w-[120px]">{linkedAppt.clinicName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              dispatch({
                                type: "OPEN_REPORT",
                                vaccineCode: m.vaccineCode,
                                vaccineName: m.vaccineName,
                                defaultDate: record?.administeredOn || today,
                              })
                            }
                            className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
                          >
                            {record ? "Edit" : "Report"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (def) dispatch({ type: "OPEN_DETAIL", definition: def })
                            }}
                            className="rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Report Dose Dialog Modal (FR-024, BR-02) ── */}
      {reportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <div className="relative w-full max-w-md rounded-xl border bg-background p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 id="report-modal-title" className="text-lg font-bold text-foreground">
                  Record Administered Dose
                </h3>
                <p className="text-xs text-muted-foreground">
                  Reporting dose for <strong className="text-foreground">{child.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "CLOSE_REPORT" })}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <span className="text-xs text-muted-foreground block font-medium">Vaccine</span>
                <span className="text-sm font-semibold text-foreground block">
                  {reportModal.vaccineName} ({reportModal.vaccineCode})
                </span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="administeredOnInput" className="text-xs font-semibold text-foreground">
                  Date Administered <span className="text-rose-600">*</span>
                </label>
                <input
                  id="administeredOnInput"
                  ref={reportDateInputRef}
                  type="date"
                  value={reportModal.administeredOn}
                  max={today}
                  min={child.dateOfBirth}
                  onChange={(e) => dispatch({ type: "SET_REPORT_DATE", date: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                  required
                />
                <span className="text-[11px] text-muted-foreground block">
                  May not be in the future (BR-01). Earliest allowed: {formatCalendarDate(child.dateOfBirth)}.
                </span>
              </div>

              {/* Provenance Disclaimer (BR-02, BR-07) */}
              <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-300" aria-hidden />
                  <span>Provenance: parent_reported</span>
                </div>
                <p className="leading-relaxed">
                  Caregiver-entered completions are stored as parent-reported unverified records. They will not be marked as health-worker verified in this demonstration.
                </p>
              </div>

              {/* Error feedback */}
              {reportModal.error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                  <span>{reportModal.error}</span>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CLOSE_REPORT" })}
                  disabled={reportModal.submitting}
                  className="rounded-lg border px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportModal.submitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  {reportModal.submitting ? "Saving…" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Vaccine Detail Drawer / Dialog (FR-023) ── */}
      {detailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
        >
          <div className="relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Vaccine Information Guide
                </span>
                <h3 id="detail-modal-title" className="text-xl font-bold text-foreground">
                  {detailModal.vaccineName}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {detailModal.vaccineCode} · {detailModal.doseNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "CLOSE_DETAIL" })}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target Diseases */}
              <div className="space-y-1.5">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Diseases Prevented
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detailModal.targetDiseases.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-900 font-medium dark:bg-teal-950 dark:border-teal-800 dark:text-teal-200"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Timing & Administration */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 border">
                <div>
                  <span className="text-muted-foreground block font-medium">Standard Milestone</span>
                  <span className="font-semibold text-foreground block">{detailModal.ageMilestoneLabel}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Route & Dosage</span>
                  <span className="font-semibold text-foreground block">{detailModal.administrationRoute}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block font-medium">Recommended Anatomical Site</span>
                  <span className="font-semibold text-foreground block">{detailModal.recommendedSite}</span>
                </div>
              </div>

              {/* Context Note */}
              <div className="space-y-1">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Clinical Context Note (FR-023)
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {detailModal.contextNote}
                </p>
              </div>

              {/* Expected Reactions */}
              <div className="space-y-1 rounded-lg bg-amber-50/70 border border-amber-200 p-3 dark:bg-amber-950/30 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <span className="font-semibold flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                  Expected Normal Reaction
                </span>
                <p className="leading-relaxed">
                  {detailModal.expectedReactionNotice}
                </p>
              </div>

              {/* Missed Dose Guidance (BR-03) */}
              <div className="space-y-1 rounded-lg bg-rose-50/70 border border-rose-200 p-3 dark:bg-rose-950/30 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                <span className="font-semibold flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5 text-rose-600" aria-hidden />
                  If Missed or Delayed (BR-03)
                </span>
                <p className="leading-relaxed">
                  {detailModal.missedDoseGuidance}
                </p>
              </div>

              {/* Baseline Source Link */}
              <div className="border-t pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Baseline: Sri Lanka EPI 2023</span>
                <a
                  href={EPI_SCHEDULE_METADATA.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>Official PDF Reference</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "CLOSE_DETAIL" })}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                Close Guidance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reminder Preview Dialog (FR-025, BR-07) ── */}
      {reminderPreviewMilestone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reminder-modal-title"
        >
          <div className="relative w-full max-w-md rounded-xl border bg-background p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <Bell className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <h3 id="reminder-modal-title" className="text-base font-bold text-foreground">
                    Reminder Preview
                  </h3>
                  <span className="text-xs text-rose-600 font-semibold tracking-wide">
                    NO MESSAGE SENT (FR-025, BR-07)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "CLOSE_REMINDER" })}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                This dialog demonstrates what an automated reminder notice would contain in a future production release. In SuwaDaru F0, <strong>no SMS, email, or push notifications are ever transmitted.</strong>
              </p>

              {/* Sample SMS Mock Container */}
              <div className="rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-mono font-semibold">
                  <span>📱 SMS TEMPLATE PREVIEW</span>
                  <span>PREVIEW ONLY</span>
                </div>
                <div className="rounded-lg bg-background p-3 shadow-xs border text-foreground text-xs leading-relaxed font-sans">
                  &ldquo;SuwaDaru Reminder: <strong>{child.name}</strong> is scheduled for <strong>{reminderPreviewMilestone.vaccineName}</strong> on <strong>{formatCalendarDate(reminderPreviewMilestone.dueDate)}</strong>. Please bring your Child Health Development Record (CHDR) to your local MOH clinic.&rdquo;
                </div>
              </div>

              <div className="rounded-lg bg-muted p-3 text-[11px] text-muted-foreground space-y-1">
                <strong>Honesty & Reliability Guardrail:</strong>
                <p>
                  SuwaDaru strictly enforces demo honesty (BR-07). Status is never marked as &ldquo;message sent&rdquo; or &ldquo;delivered&rdquo;.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "CLOSE_REMINDER" })}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
