import { watchRecords } from "@/services/realtime"
/**
 * GrowthPage — Frontend B
 *
 * Route: /children/:childId/growth
 * Owner: Frontend B (feature/frontend-health)
 *
 * SAFETY & GOVERNANCE (BRD §7.4, §10, §12, §14, T-08, T-09, T-10):
 *   - Prioritizes accurate input and source attribution over medical classification.
 *   - Reference curves are explicitly synthetic; prominent banner:
 *     "Reference curves appear only when verified source data is available."
 *   - Clinical status is always "not_assessed".
 *   - NEVER labels a child "healthy", "malnourished", "stunted", or "underweight" (BR-07).
 *   - Legend keys (+2 SD, +1 SD, median, -1 SD, -2 SD) are marked as illustrative placeholders.
 *   - Supports 0-point (empty), 1-point, and several-point states.
 *   - Validates positive numbers and non-future dates (FR-033, T-09).
 *   - Accessible table alternative and textual equivalents for chart tooltips (NFR-05).
 */

import { useEffect, useReducer, useRef, useState } from "react"
import { Link } from "react-router"
import {
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Info,
  Calendar,
  X,
  Scale,
  Ruler,
  CircleDot,
  Check,
  ChevronRight,
  ArrowLeft,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { ChildFeaturePageProps } from "@/types"
import type {
  GrowthMeasurement,
  GrowthReferenceSeries,
} from "@/types"
import type { Child } from "@/types"
import { AppError } from "@/services/contracts"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { resolveChild, ageInMonths, formatAge } from "../childResolver"
import { growthService } from "./growthService"
const GROWTH_DISCLAIMER_TEXT = 'Measurements are caregiver-reported. Clinical status has not been assessed.'
const CLINICAL_ASSESSMENT_NOTICE = 'Discuss growth concerns with your midwife or doctor.'
import { formatCalendarDate, isFutureDate } from "../vaccinations/calendarDate"
import { useLanguage } from "@/hooks/useLanguage"

// ---------------------------------------------------------------------------
// Form state & page reducer
// ---------------------------------------------------------------------------
interface AddFormState {
  measuredOn: string
  weightKg: string
  lengthHeightCm: string
  headCircumferenceCm: string
  errors: Record<string, string>
  submitting: boolean
}

type PageState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase: "ready"
      child: Child
      measurements: GrowthMeasurement[]
      reference: GrowthReferenceSeries
      showAddForm: boolean
      showReferenceCurves: boolean
      addForm: AddFormState
      successToast: string | null
    }

type Action =
  | {
      type: "LOADED"
      child: Child
      measurements: GrowthMeasurement[]
      reference: GrowthReferenceSeries
    }
  | { type: "ERROR"; message: string }
  | { type: "SHOW_FORM" }
  | { type: "HIDE_FORM" }
  | { type: "TOGGLE_REFERENCE_CURVES" }
  | {
      type: "FIELD"
      field: keyof Omit<AddFormState, "errors" | "submitting">
      value: string
    }
  | { type: "FORM_ERRORS"; errors: Record<string, string> }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_DONE"; measurement: GrowthMeasurement; message: string }
  | { type: "DISMISS_TOAST" }

const initialForm = (today: string): AddFormState => ({
  measuredOn: today,
  weightKg: "",
  lengthHeightCm: "",
  headCircumferenceCm: "",
  errors: {},
  submitting: false,
})

function reducer(state: PageState, action: Action): PageState {
  switch (action.type) {
    case "LOADED":
      if (state.phase === "ready") return { ...state, child: action.child, measurements: action.measurements, reference: action.reference }
      return {
        phase: "ready",
        child: action.child,
        measurements: action.measurements,
        reference: action.reference,
        showAddForm: false,
        showReferenceCurves: true,
        addForm: initialForm(new Date().toISOString().slice(0, 10)),
        successToast: null,
      }
    case "ERROR":
      return { phase: "error", message: action.message }
  }
  if (state.phase !== "ready") return state

  switch (action.type) {
    case "SHOW_FORM":
      return {
        ...state,
        showAddForm: true,
        addForm: initialForm(new Date().toISOString().slice(0, 10)),
      }
    case "HIDE_FORM":
      return { ...state, showAddForm: false }
    case "TOGGLE_REFERENCE_CURVES":
      return { ...state, showReferenceCurves: !state.showReferenceCurves }
    case "FIELD":
      return {
        ...state,
        addForm: {
          ...state.addForm,
          [action.field]: action.value,
          errors: { ...state.addForm.errors, [action.field]: "" },
        },
      }
    case "FORM_ERRORS":
      return {
        ...state,
        addForm: { ...state.addForm, errors: action.errors, submitting: false },
      }
    case "SUBMIT_START":
      return {
        ...state,
        addForm: { ...state.addForm, submitting: true, errors: {} },
      }
    case "SUBMIT_DONE":
      return {
        ...state,
        measurements: [...state.measurements.filter(m => m.id !== action.measurement.id), action.measurement].sort(
          (a, b) => a.measuredOn.localeCompare(b.measuredOn),
        ),
        showAddForm: false,
        successToast: action.message,
      }
    case "DISMISS_TOAST":
      return { ...state, successToast: null }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Chart Data Point Interface
// ---------------------------------------------------------------------------
interface ChartDataPoint {
  ageMonths: number
  measuredOn?: string
  weight?: number
  sdMinus2?: number
  sdMinus1?: number
  median?: number
  sdPlus1?: number
  sdPlus2?: number
}

function buildChartData(
  child: Child,
  measurements: GrowthMeasurement[],
  reference: GrowthReferenceSeries,
): ChartDataPoint[] {
  const pointsMap = new Map<number, ChartDataPoint>()

  // 1. Populate reference grid points (0, 1, 2, 3, 4, 6, 9, 12, 18, 24, 36, 48, 60 months)
  for (const ref of reference.points) {
    pointsMap.set(ref.ageMonths, {
      ageMonths: ref.ageMonths,
      sdMinus2: ref.sdMinus2Kg,
      sdMinus1: ref.sdMinus1Kg,
      median: ref.medianKg,
      sdPlus1: ref.sdPlus1Kg,
      sdPlus2: ref.sdPlus2Kg,
    })
  }

  // 2. Map actual child measurements
  for (const m of measurements) {
    if (m.weightKg === undefined || m.weightKg === null) continue
    const age = ageInMonths(child.dateOfBirth, m.measuredOn)
    const existing = pointsMap.get(age)
    if (existing) {
      existing.weight = m.weightKg
      existing.measuredOn = m.measuredOn
    } else {
      pointsMap.set(age, {
        ageMonths: age,
        measuredOn: m.measuredOn,
        weight: m.weightKg,
      })
    }
  }

  return Array.from(pointsMap.values()).sort((a, b) => a.ageMonths - b.ageMonths)
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function GrowthPage({ childId }: ChildFeaturePageProps) {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" })
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const weightInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    let revision = 0
    async function load() {
      const current = ++revision
      try {
        const [child, measurements, reference] = await Promise.all([
          resolveChild(childId),
          growthService.list(childId),
          growthService.getReferenceSeries(childId),
        ])
        if (!cancelled && current === revision) {
          dispatch({ type: "LOADED", child, measurements, reference })
        }
      } catch (err) {
        if (!cancelled && current === revision) {
          const msg =
            err instanceof AppError
              ? err.message
              : "Unable to load growth data. Please try again."
          dispatch({ type: "ERROR", message: msg })
        }
      }
    }
    void load()
    const stop = watchRecords(["growth_measurements","growth_references","children"], () => { void load() })
    return () => { cancelled = true; stop() }
  }, [childId])

  const isAddFormOpen = state.phase === "ready" && state.showAddForm

  // Focus weight input when form appears
  useEffect(() => {
    if (isAddFormOpen) {
      setTimeout(() => weightInputRef.current?.focus(), 50)
    }
  }, [isAddFormOpen])

  // ── Loading state ────────────────────────────────────────────────────────
  if (state.phase === "loading") {
    return (
      <div
        className="flex min-w-0 flex-col gap-6 max-w-4xl animate-pulse"
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-60 bg-muted rounded-md" />
        <div className="h-20 w-full bg-muted rounded-xl" />
        <div className="h-72 w-full bg-muted rounded-xl" />
        <div className="h-44 w-full bg-muted rounded-xl" />
        <span className="sr-only">Loading growth records…</span>
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
              Growth Records Unavailable
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
  const {
    child,
    measurements,
    reference,
    showAddForm,
    showReferenceCurves,
    addForm,
    successToast,
  } = state

  const { language } = useLanguage()
  const isSi = language === "si"
  const childAgeMonths = ageInMonths(child.dateOfBirth, today)
  const chartData = buildChartData(child, measurements, reference)
  const validWeightCount = measurements.filter((m) => m.weightKg != null && m.weightKg > 0).length
  const isNoDataState = validWeightCount === 0
  const isSinglePointState = validWeightCount === 1
  const isSeveralPointsState = validWeightCount >= 2

  // Latest measurement details
  const latestMeasurement = measurements.length > 0
    ? [...measurements].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn))[0]
    : null
  const firstMeasurement = measurements.length > 0
    ? [...measurements].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn))[0]
    : null

  // Handle Add Measurement Form Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (addForm.submitting) return

    const errors: Record<string, string> = {}

    // Date validation
    if (!addForm.measuredOn || addForm.measuredOn.trim() === "") {
      errors.measuredOn = "Measurement date is required."
    } else if (isFutureDate(addForm.measuredOn, today)) {
      errors.measuredOn = "Measurement date may not be in the future (BR-01, FR-033)."
    } else if (addForm.measuredOn < child.dateOfBirth) {
      errors.measuredOn = `Measurement date cannot be before ${child.name}'s birth date (${formatCalendarDate(child.dateOfBirth)}).`
    }

    // Weight validation (required positive number — T-09)
    const weightNum = parseFloat(addForm.weightKg)
    if (!addForm.weightKg || isNaN(weightNum)) {
      errors.weightKg = "Weight in kilograms is required."
    } else if (weightNum <= 0) {
      errors.weightKg = "Weight must be a positive number greater than 0 kg (T-09)."
    }

    // Optional length/height validation
    let lengthNum: number | undefined
    if (addForm.lengthHeightCm.trim() !== "") {
      lengthNum = parseFloat(addForm.lengthHeightCm)
      if (isNaN(lengthNum) || lengthNum <= 0) {
        errors.lengthHeightCm = "Length/height must be a positive number greater than 0 cm."
      }
    }

    // Optional head circumference validation
    let headNum: number | undefined
    if (addForm.headCircumferenceCm.trim() !== "") {
      headNum = parseFloat(addForm.headCircumferenceCm)
      if (isNaN(headNum) || headNum <= 0) {
        errors.headCircumferenceCm = "Head circumference must be a positive number greater than 0 cm."
      }
    }

    if (Object.keys(errors).length > 0) {
      dispatch({ type: "FORM_ERRORS", errors })
      return
    }

    dispatch({ type: "SUBMIT_START" })
    try {
      const measurement = await growthService.addMeasurement({
        childId: child.id,
        measuredOn: addForm.measuredOn,
        weightKg: weightNum,
        lengthHeightCm: lengthNum,
        headCircumferenceCm: headNum,
      })
      dispatch({
        type: "SUBMIT_DONE",
        measurement,
        message: `Growth measurement recorded successfully (${weightNum} kg on ${formatCalendarDate(addForm.measuredOn)}). Sourced as parent_reported.`,
      })
    } catch (err) {
      const msg =
        err instanceof AppError
          ? err.message
          : "Unable to record measurement. Please check your entries."
      dispatch({ type: "FORM_ERRORS", errors: { general: msg } })
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 max-w-4xl pb-16">
      {/* ── Mandatory Prominent Disclaimer Banner (FR-031, BR-04, BR-05, T-10) ── */}
      <aside
        className="rounded-xl border border-rose-300 bg-rose-50/80 p-4 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100 shadow-xs"
        aria-label="Growth Reference Disclaimer"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white mt-0.5">
            <ShieldAlert className="h-4 w-4" aria-hidden />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm tracking-tight text-rose-950 dark:text-rose-100">
                ⚠️ {GROWTH_DISCLAIMER_TEXT}
              </span>
              <span className="rounded-md bg-rose-100 dark:bg-rose-900/80 px-2 py-0.5 text-xs font-mono font-medium text-rose-800 dark:text-rose-200">
                {reference.provenance}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-rose-900 dark:text-rose-200">
              {CLINICAL_ASSESSMENT_NOTICE} {reference.points.length ? "Reference values come from the cited published dataset." : "No verified reference curves are currently available. Your measurements remain visible below."}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Page Header & Child Context Bar ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
              <TrendingUp className="h-4 w-4" aria-hidden />
              <span>{isSi ? "ළමා වර්ධන නිරීක්ෂණය" : "Pediatric Growth Tracking"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isSi ? "වයසට අදාළ බර වර්ධන සටහන (WHO)" : "Weight-for-Age Monitoring"}
            </h1>
          </div>
          <Link
            to={routes.child(child.id)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
          >
            <span>{isSi ? `${child.name} ගේ පැතිකඩ වෙත` : `Back to ${child.name}'s profile`}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Child Context Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold text-lg">
              {child.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{child.name}</h2>
                <span className="capitalize text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {isSi ? `${child.sex === "female" ? "ගැහැණු" : "පිරිමි"} සටහන` : `${child.sex} chart`}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                  {isSi ? "තත්ත්වය: තක්සේරු කර නැත" : "Status: Not Assessed"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isSi ? (
                  <>
                    උපත: <span className="font-medium text-foreground">{formatCalendarDate(child.dateOfBirth)}</span> · වයස: <span className="font-medium text-foreground">{formatAge(childAgeMonths)}</span> (සම්පූර්ණ මාස {childAgeMonths})
                  </>
                ) : (
                  <>
                    Born: <span className="font-medium text-foreground">{formatCalendarDate(child.dateOfBirth)}</span> · Current age: <span className="font-medium text-foreground">{formatAge(childAgeMonths)}</span> ({childAgeMonths} completed months)
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showAddForm && (
              <button
                type="button"
                onClick={() => dispatch({ type: "SHOW_FORM" })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
              >
                <PlusCircle className="h-4 w-4" aria-hidden />
                <span>{isSi ? "මිනුමක් එක් කරන්න" : "Add Measurement"}</span>
              </button>
            )}
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
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Add Measurement Form (FR-033, T-09) ── */}
      {showAddForm && (
        <section
          className="rounded-xl border border-primary/30 bg-card p-5 shadow-sm space-y-4 animate-in fade-in"
          aria-labelledby="add-measurement-title"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 id="add-measurement-title" className="text-base font-bold text-foreground">
                Record Growth Measurement
              </h3>
              <p className="text-xs text-muted-foreground">
                Caregiver entry for <strong className="text-foreground">{child.name}</strong>. Enforces positive numbers and non-future dates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: "HIDE_FORM" })}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Cancel adding measurement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {addForm.errors.general && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" aria-hidden />
                <span>{addForm.errors.general}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Measurement Date */}
              <div className="space-y-1.5">
                <label htmlFor="measuredOnInput" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <span>Measurement Date <span className="text-rose-600">*</span></span>
                </label>
                <input
                  id="measuredOnInput"
                  type="date"
                  value={addForm.measuredOn}
                  max={today}
                  min={child.dateOfBirth}
                  onChange={(e) => dispatch({ type: "FIELD", field: "measuredOn", value: e.target.value })}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-2",
                    addForm.errors.measuredOn
                      ? "border-rose-300 focus:ring-rose-500"
                      : "focus:ring-primary",
                  )}
                  aria-invalid={Boolean(addForm.errors.measuredOn)}
                  aria-describedby={addForm.errors.measuredOn ? "date-error" : undefined}
                />
                {addForm.errors.measuredOn ? (
                  <p id="date-error" className="text-[11px] text-rose-600 font-medium">
                    {addForm.errors.measuredOn}
                  </p>
                ) : (
                  <span className="text-[11px] text-muted-foreground block">
                    May not be in the future (BR-01). Minimum date: {formatCalendarDate(child.dateOfBirth)}.
                  </span>
                )}
              </div>

              {/* Weight in kg (Required positive numeric) */}
              <div className="space-y-1.5">
                <label htmlFor="weightKgInput" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <span>Weight (kg) <span className="text-rose-600">*</span></span>
                </label>
                <input
                  id="weightKgInput"
                  ref={weightInputRef}
                  type="number"
                  step="0.05"
                  min="0.1"
                  placeholder="e.g. 5.4"
                  value={addForm.weightKg}
                  onChange={(e) => dispatch({ type: "FIELD", field: "weightKg", value: e.target.value })}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-2",
                    addForm.errors.weightKg
                      ? "border-rose-300 focus:ring-rose-500"
                      : "focus:ring-primary",
                  )}
                  aria-invalid={Boolean(addForm.errors.weightKg)}
                  aria-describedby={addForm.errors.weightKg ? "weight-error" : undefined}
                />
                {addForm.errors.weightKg ? (
                  <p id="weight-error" className="text-[11px] text-rose-600 font-medium">
                    {addForm.errors.weightKg}
                  </p>
                ) : (
                  <span className="text-[11px] text-muted-foreground block">
                    Strictly positive number in kilograms (e.g. 5.25 kg).
                  </span>
                )}
              </div>

              {/* Length/Height in cm (Optional positive numeric) */}
              <div className="space-y-1.5">
                <label htmlFor="lengthHeightInput" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <span>Length / Height (cm) <span className="text-muted-foreground font-normal">(optional)</span></span>
                </label>
                <input
                  id="lengthHeightInput"
                  type="number"
                  step="0.1"
                  min="1"
                  placeholder="e.g. 62.5"
                  value={addForm.lengthHeightCm}
                  onChange={(e) => dispatch({ type: "FIELD", field: "lengthHeightCm", value: e.target.value })}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-2",
                    addForm.errors.lengthHeightCm
                      ? "border-rose-300 focus:ring-rose-500"
                      : "focus:ring-primary",
                  )}
                  aria-invalid={Boolean(addForm.errors.lengthHeightCm)}
                  aria-describedby={addForm.errors.lengthHeightCm ? "length-error" : undefined}
                />
                {addForm.errors.lengthHeightCm && (
                  <p id="length-error" className="text-[11px] text-rose-600 font-medium">
                    {addForm.errors.lengthHeightCm}
                  </p>
                )}
              </div>

              {/* Head Circumference in cm (Optional positive numeric) */}
              <div className="space-y-1.5">
                <label htmlFor="headCircumferenceInput" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CircleDot className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <span>Head Circumference (cm) <span className="text-muted-foreground font-normal">(optional)</span></span>
                </label>
                <input
                  id="headCircumferenceInput"
                  type="number"
                  step="0.1"
                  min="1"
                  placeholder="e.g. 39.0"
                  value={addForm.headCircumferenceCm}
                  onChange={(e) => dispatch({ type: "FIELD", field: "headCircumferenceCm", value: e.target.value })}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-2",
                    addForm.errors.headCircumferenceCm
                      ? "border-rose-300 focus:ring-rose-500"
                      : "focus:ring-primary",
                  )}
                  aria-invalid={Boolean(addForm.errors.headCircumferenceCm)}
                  aria-describedby={addForm.errors.headCircumferenceCm ? "head-error" : undefined}
                />
                {addForm.errors.headCircumferenceCm && (
                  <p id="head-error" className="text-[11px] text-rose-600 font-medium">
                    {addForm.errors.headCircumferenceCm}
                  </p>
                )}
              </div>
            </div>

            {/* Source Provenance Notice */}
            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">
                Source Attribution: parent_reported (unverified)
              </span>
              <p>
                Measurements entered by caregivers are tagged as parent_reported. SuwaDaru never derives medical diagnoses or automated z-scores from caregiver input.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "HIDE_FORM" })}
                disabled={addForm.submitting}
                className="rounded-lg border px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addForm.submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50"
              >
                {addForm.submitting ? "Saving…" : "Save Measurement"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── State 1: No-data state (0 points — T-08) ── */}
      {isNoDataState && (
        <section
          className="rounded-xl border border-dashed border-border bg-card p-10 text-center space-y-4"
          aria-label="No measurements empty state"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Scale className="h-7 w-7" aria-hidden />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-foreground">
              No Growth Measurements Recorded Yet
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No weight observations have been recorded for <strong className="text-foreground">{child.name}</strong>. Add at least one measurement to begin charting weight-for-age over time.
            </p>
          </div>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => dispatch({ type: "SHOW_FORM" })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="h-4 w-4" aria-hidden />
              <span>Add First Measurement (T-08)</span>
            </button>
          )}
        </section>
      )}

      {/* ── State 2: 1-point state (single observation callout — BR-05) ── */}
      {isSinglePointState && latestMeasurement && (
        <div
          className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-xs text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-100 space-y-1.5"
          role="note"
        >
          <div className="flex items-center gap-2 font-semibold">
            <Info className="h-4 w-4 text-teal-700 dark:text-teal-300 shrink-0" aria-hidden />
            <span>Single Observation Recorded (1 Point)</span>
          </div>
          <p className="leading-relaxed">
            Logged: <strong className="text-foreground">{latestMeasurement.weightKg} kg</strong> on <strong className="text-foreground">{formatCalendarDate(latestMeasurement.measuredOn)}</strong> (age: {formatAge(ageInMonths(child.dateOfBirth, latestMeasurement.measuredOn))}). Growth trajectory curves appear once 2 or more measurements over time are logged.
          </p>
        </div>
      )}

      {/* ── State 3: Several-point state Summary Metrics ── */}
      {isSeveralPointsState && latestMeasurement && firstMeasurement && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Latest Weight
            </span>
            <span className="text-lg font-bold text-teal-700 dark:text-teal-300 block">
              {latestMeasurement.weightKg} kg
            </span>
            <span className="text-[10px] text-muted-foreground block truncate">
              {formatCalendarDate(latestMeasurement.measuredOn)}
            </span>
          </div>
          <div className="rounded-xl border bg-card p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Earliest Recorded
            </span>
            <span className="text-lg font-bold text-foreground block">
              {firstMeasurement.weightKg} kg
            </span>
            <span className="text-[10px] text-muted-foreground block truncate">
              {formatCalendarDate(firstMeasurement.measuredOn)}
            </span>
          </div>
          <div className="rounded-xl border bg-card p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Recorded Points
            </span>
            <span className="text-lg font-bold text-foreground block">
              {validWeightCount} observations
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Longitudinal series
            </span>
          </div>
          <div className="rounded-xl border bg-card p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Clinical Classification
            </span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400 block mt-1">
              Not Assessed
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Caregiver-reported measurements
            </span>
          </div>
        </div>
      )}

      {/* ── Recharts Chart Section ── */}
      {!isNoDataState && (
        <section
          className="rounded-xl border bg-card p-5 shadow-xs space-y-4"
          aria-labelledby="growth-chart-heading"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 id="growth-chart-heading" className="text-base font-bold text-foreground">
                Weight-for-Age Trajectory
              </h3>
              <p className="text-xs text-muted-foreground">
                Y-Axis: Weight in kilograms (kg) · X-Axis: Child age in completed calendar months
              </p>
            </div>

            {/* Toggle Illustrative Reference Curves */}
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_REFERENCE_CURVES" })}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              aria-pressed={showReferenceCurves}
            >
              {showReferenceCurves ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  <span>Hide Placeholder Bands</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  <span>Show Placeholder Bands</span>
                </>
              )}
            </button>
          </div>

          {/* Chart Container */}
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 16, bottom: 20, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/40" />

                {/* Explicit Age Axis (months) */}
                <XAxis
                  dataKey="ageMonths"
                  name="Age"
                  unit=" mo"
                  type="number"
                  domain={[0, 60]}
                  ticks={[0, 1, 2, 3, 4, 6, 9, 12, 18, 24, 36, 48, 60]}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  label={{
                    value: "Child Age (completed calendar months from DOB)",
                    position: "insideBottom",
                    offset: -12,
                    fontSize: 11,
                    fill: "currentColor",
                    className: "text-muted-foreground font-medium",
                  }}
                />

                {/* Explicit Weight Axis (kg) */}
                <YAxis
                  name="Weight"
                  unit=" kg"
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  label={{
                    value: "Weight (kg)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 8,
                    fontSize: 11,
                    fill: "currentColor",
                    className: "text-muted-foreground font-medium",
                  }}
                />

                {/* Textual equivalent tooltip */}
                <Tooltip
                  formatter={(v: any, name: any) => [`${v ?? "—"} kg`, String(name)]}
                  labelFormatter={(age: any) => `Age: ${age} completed calendar months`}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />

                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(value: string) => (
                    <span className="text-muted-foreground">{value}</span>
                  )}
                />

                {/* Synthetic reference curves marked as illustrative placeholders */}
                {showReferenceCurves && (
                  <>
                    <Line
                      dataKey="sdPlus2"
                      name="+2 SD (reference)"
                      stroke="#E27D72"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                    <Line
                      dataKey="sdPlus1"
                      name="+1 SD (reference)"
                      stroke="#F4C95D"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                    <Line
                      dataKey="median"
                      name="Median (reference)"
                      stroke="#BE123C"
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                    <Line
                      dataKey="sdMinus1"
                      name="-1 SD (reference)"
                      stroke="#F4C95D"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                    <Line
                      dataKey="sdMinus2"
                      name="-2 SD (reference)"
                      stroke="#E27D72"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  </>
                )}

                {/* Child's actual trend line: Solid warm rose */}
                <Line
                  dataKey="weight"
                  name={`${child.name}'s Recorded Weight (kg)`}
                  stroke="#BE123C"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#BE123C", stroke: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#BE123C" }}
                  connectNulls
                  isAnimationActive={true}
                />

              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2">
            <span>
              <strong>Reference Source:</strong> {reference.sourceLabel} ({reference.sourceVersion})
            </span>
            <span className="font-mono text-muted-foreground/80">
              Units: kg · months
            </span>
          </div>
        </section>
      )}

      {/* ── Accessible Measurement Table (NFR-05) ── */}
      {measurements.length > 0 && (
        <section
          className="rounded-xl border bg-card shadow-xs overflow-hidden space-y-2 p-5"
          aria-labelledby="table-heading"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 id="table-heading" className="text-base font-bold text-foreground">
                Recorded Measurement History
              </h3>
              <p className="text-xs text-muted-foreground">
                Accessible tabular representation of all recorded child growth measurements
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {measurements.length} total entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <caption className="sr-only">
                Complete growth measurement log for {child.name} including date, child age, weight, length/height, head circumference, and data provenance.
              </caption>
              <thead className="bg-muted/70 text-muted-foreground border-b uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th scope="col" className="p-3">Measurement Date</th>
                  <th scope="col" className="p-3">Child Age</th>
                  <th scope="col" className="p-3">Weight (kg)</th>
                  <th scope="col" className="p-3">Length / Height (cm)</th>
                  <th scope="col" className="p-3">Head Circ. (cm)</th>
                  <th scope="col" className="p-3">Source Provenance</th>
                  <th scope="col" className="p-3">Clinical Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...measurements]
                  .sort((a, b) => b.measuredOn.localeCompare(a.measuredOn))
                  .map((m) => {
                    const age = ageInMonths(child.dateOfBirth, m.measuredOn)
                    return (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <th scope="row" className="p-3 font-semibold text-foreground whitespace-nowrap">
                          {formatCalendarDate(m.measuredOn)}
                        </th>
                        <td className="p-3 text-muted-foreground">
                          {formatAge(age)} ({age} mo)
                        </td>
                        <td className="p-3 font-bold text-teal-800 dark:text-teal-200">
                          {m.weightKg != null ? `${m.weightKg} kg` : "—"}
                        </td>
                        <td className="p-3 text-foreground">
                          {m.lengthHeightCm != null ? `${m.lengthHeightCm} cm` : "—"}
                        </td>
                        <td className="p-3 text-foreground">
                          {m.headCircumferenceCm != null ? `${m.headCircumferenceCm} cm` : "—"}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                            {m.source}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800">
                            Not assessed
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Clinical Assessment & Referral Footer (BR-04, BR-05, BR-07) ── */}
      <footer className="rounded-xl border border-muted/80 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-1.5 text-foreground font-semibold">
          <Info className="h-4 w-4 text-primary shrink-0" aria-hidden />
          <span>Professional Health Worker Notice (BR-04 / BR-05)</span>
        </div>
        <p className="leading-relaxed">
          SuwaDaru prioritizes accurate record-keeping and source transparency. Single isolated points must not be equated to medical judgments. Pediatric growth evaluation requires clinical examination, multiple physical indices, dietary context, and parental consultations with a certified Public Health Midwife (PHM) or Medical Officer of Health (MOH).
        </p>
      </footer>
    </div>
  )
}
