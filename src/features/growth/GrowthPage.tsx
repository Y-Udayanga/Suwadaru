/**
 * GrowthPage — Frontend B
 *
 * Route: /children/:childId/growth
 * Owner: Frontend B (feature/frontend-health)
 *
 * States covered (BRD §8, FR-030–036, T-08–T-10):
 *   loading   — resolving child + measurements + reference
 *   error     — unknown childId (safe state, BR-08)
 *   empty     — no measurements yet; CTA to add first measurement
 *   chart     — Recharts line chart with synthetic reference bands
 *   add       — inline measurement form
 *
 * Constraints:
 *   - Do NOT modify AppShell, router, shared types, or service contracts.
 *   - FR-031: reference series is labeled SYNTHETIC DEMO ONLY.
 *   - FR-035: clinical status is always "not_assessed".
 *   - BR-04/BR-05: no z-score or diagnosis inferred.
 *   - FR-033: nonpositive values and future dates rejected.
 *   - NFR-05: tabular data alternative; chart tooltip is not the only value source.
 */

import { useEffect, useReducer, useRef, useState } from "react"
import { Link } from "react-router"
import {
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Info,
  BarChart2,
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
  GrowthReferencePoint,
  AddMeasurementInput,
} from "@/types"
import type { Child } from "@/types"
import { AppError } from "@/services/contracts"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { resolveChild, ageInMonths, formatAge } from "../childResolver"
import { growthService } from "./growthService"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AddFormState = {
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
      addForm: AddFormState
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
  | { type: "FIELD"; field: keyof Omit<AddFormState, "errors" | "submitting">; value: string }
  | { type: "FORM_ERRORS"; errors: Record<string, string> }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_DONE"; measurement: GrowthMeasurement }

const initialAddForm: AddFormState = {
  measuredOn: new Date().toISOString().slice(0, 10),
  weightKg: "",
  lengthHeightCm: "",
  headCircumferenceCm: "",
  errors: {},
  submitting: false,
}

function reducer(state: PageState, action: Action): PageState {
  switch (action.type) {
    case "LOADED":
      return {
        phase: "ready",
        child: action.child,
        measurements: action.measurements,
        reference: action.reference,
        showAddForm: false,
        addForm: { ...initialAddForm, measuredOn: new Date().toISOString().slice(0, 10) },
      }
    case "ERROR":
      return { phase: "error", message: action.message }
  }
  if (state.phase !== "ready") return state
  switch (action.type) {
    case "SHOW_FORM":
      return { ...state, showAddForm: true, addForm: { ...initialAddForm, measuredOn: new Date().toISOString().slice(0, 10) } }
    case "HIDE_FORM":
      return { ...state, showAddForm: false }
    case "FIELD":
      return {
        ...state,
        addForm: { ...state.addForm, [action.field]: action.value, errors: {} },
      }
    case "FORM_ERRORS":
      return {
        ...state,
        addForm: { ...state.addForm, errors: action.errors, submitting: false },
      }
    case "SUBMIT_START":
      return { ...state, addForm: { ...state.addForm, submitting: true, errors: {} } }
    case "SUBMIT_DONE":
      return {
        ...state,
        measurements: [...state.measurements, action.measurement].sort(
          (a, b) => a.measuredOn.localeCompare(b.measuredOn),
        ),
        showAddForm: false,
      }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Chart helpers
// ---------------------------------------------------------------------------
/** Combine reference points and measurements into a unified chart dataset. */
type ChartPoint = {
  ageMonths: number
  weight?: number
  sdMinus2?: number
  sdMinus1?: number
  median?: number
  sdPlus1?: number
  sdPlus2?: number
}

function buildChartData(
  measurements: GrowthMeasurement[],
  reference: GrowthReferenceSeries,
  dateOfBirth: string,
): ChartPoint[] {
  const refMap = new Map<number, GrowthReferencePoint>()
  for (const p of reference.points) refMap.set(p.ageMonths, p)

  // Measurement ages.
  const measByAge = new Map<number, number>()
  for (const m of measurements) {
    if (m.weightKg === undefined) continue
    const age = ageInMonths(dateOfBirth, m.measuredOn)
    measByAge.set(age, m.weightKg)
  }

  // Union of all age values.
  const allAges = new Set([...refMap.keys(), ...measByAge.keys()])
  const sorted = [...allAges].sort((a, b) => a - b)

  return sorted.map((age) => {
    const ref = refMap.get(age)
    const point: ChartPoint = { ageMonths: age }
    if (measByAge.has(age)) point.weight = measByAge.get(age)
    if (ref) {
      point.sdMinus2 = ref.sdMinus2Kg
      point.sdMinus1 = ref.sdMinus1Kg
      point.median = ref.medianKg
      point.sdPlus1 = ref.sdPlus1Kg
      point.sdPlus2 = ref.sdPlus2Kg
    }
    return point
  })
}

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
// Add measurement form
// ---------------------------------------------------------------------------
type AddFormProps = {
  form: AddFormState
  today: string
  onField: (field: keyof Omit<AddFormState, "errors" | "submitting">, value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

function AddMeasurementForm({ form, today, onField, onSubmit, onCancel }: AddFormProps) {
  const firstRef = useRef<HTMLInputElement>(null)
  useEffect(() => { firstRef.current?.focus() }, [])

  return (
    <section
      aria-label="Add measurement form"
      className="rounded-xl border border-[#A7F3D0] bg-[#E8F7F3] p-4 flex flex-col gap-4"
    >
      <h2 className="text-sm font-semibold text-[#0F766E]">
        Add measurement
      </h2>
      <p className="text-xs text-muted-foreground">
        Enter the values recorded at your child's visit. This is a parent-entered
        record, not a clinical assessment. At least one measurement field is required.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="meas-date" className="text-xs font-medium">
            Date measured <span aria-hidden>*</span>
          </label>
          <input
            ref={firstRef}
            id="meas-date"
            type="date"
            max={today}
            value={form.measuredOn}
            onChange={(e) => onField("measuredOn", e.target.value)}
            disabled={form.submitting}
            className={cn(
              "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              form.errors.measuredOn && "border-[#E27D72]",
            )}
            aria-describedby={form.errors.measuredOn ? "err-date" : undefined}
            aria-invalid={!!form.errors.measuredOn}
          />
          {form.errors.measuredOn && (
            <p id="err-date" className="text-xs text-[#E27D72]" role="alert">
              {form.errors.measuredOn}
            </p>
          )}
        </div>

        {/* Weight */}
        <div className="flex flex-col gap-1">
          <label htmlFor="meas-weight" className="text-xs font-medium">
            Weight (kg)
          </label>
          <input
            id="meas-weight"
            type="number"
            min="0.1"
            step="0.01"
            placeholder="e.g. 7.5"
            value={form.weightKg}
            onChange={(e) => onField("weightKg", e.target.value)}
            disabled={form.submitting}
            className={cn(
              "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              form.errors.weightKg && "border-[#E27D72]",
            )}
            aria-describedby={form.errors.weightKg ? "err-weight" : undefined}
            aria-invalid={!!form.errors.weightKg}
          />
          {form.errors.weightKg && (
            <p id="err-weight" className="text-xs text-[#E27D72]" role="alert">
              {form.errors.weightKg}
            </p>
          )}
        </div>

        {/* Length/Height */}
        <div className="flex flex-col gap-1">
          <label htmlFor="meas-height" className="text-xs font-medium">
            Length / Height (cm)
          </label>
          <input
            id="meas-height"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="e.g. 68"
            value={form.lengthHeightCm}
            onChange={(e) => onField("lengthHeightCm", e.target.value)}
            disabled={form.submitting}
            className={cn(
              "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              form.errors.lengthHeightCm && "border-[#E27D72]",
            )}
            aria-describedby={form.errors.lengthHeightCm ? "err-height" : undefined}
            aria-invalid={!!form.errors.lengthHeightCm}
          />
          {form.errors.lengthHeightCm && (
            <p id="err-height" className="text-xs text-[#E27D72]" role="alert">
              {form.errors.lengthHeightCm}
            </p>
          )}
        </div>

        {/* Head circumference */}
        <div className="flex flex-col gap-1">
          <label htmlFor="meas-head" className="text-xs font-medium">
            Head circumference (cm)
          </label>
          <input
            id="meas-head"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="e.g. 43"
            value={form.headCircumferenceCm}
            onChange={(e) => onField("headCircumferenceCm", e.target.value)}
            disabled={form.submitting}
            className={cn(
              "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              form.errors.headCircumferenceCm && "border-[#E27D72]",
            )}
            aria-describedby={form.errors.headCircumferenceCm ? "err-head" : undefined}
            aria-invalid={!!form.errors.headCircumferenceCm}
          />
          {form.errors.headCircumferenceCm && (
            <p id="err-head" className="text-xs text-[#E27D72]" role="alert">
              {form.errors.headCircumferenceCm}
            </p>
          )}
        </div>
      </div>

      {form.errors.general && (
        <p className="rounded-lg bg-[#FFF1F0] px-3 py-2 text-xs text-[#E27D72]" role="alert">
          {form.errors.general}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={onSubmit}
          disabled={form.submitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-opacity"
        >
          {form.submitting ? "Saving…" : "Save measurement"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={form.submitting}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export function GrowthPage({ childId }: ChildFeaturePageProps) {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" })
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [child, measurements, reference] = await Promise.all([
          resolveChild(childId),
          growthService.list(childId),
          growthService.getReferenceSeries(childId),
        ])
        if (!cancelled) dispatch({ type: "LOADED", child, measurements, reference })
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof AppError
              ? err.message
              : "Unable to load growth data. Please try again."
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
      <div className="flex max-w-3xl flex-col gap-4" aria-busy="true">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded-lg bg-muted animate-pulse" />
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
  const { child, measurements, reference, showAddForm, addForm } = state
  const ageMonths = ageInMonths(child.dateOfBirth)
  const chartData = buildChartData(measurements, reference, child.dateOfBirth)
  const hasWeightData = measurements.some((m) => m.weightKg !== undefined)

  async function handleSubmit() {
    if (state.phase !== "ready") return
    const { addForm: form } = state
    const errors: Record<string, string> = {}

    if (!form.measuredOn) {
      errors.measuredOn = "Date is required."
    } else if (form.measuredOn > today) {
      errors.measuredOn = "Date may not be in the future."
    }

    const hasAny =
      form.weightKg.trim() ||
      form.lengthHeightCm.trim() ||
      form.headCircumferenceCm.trim()
    if (!hasAny) {
      errors.general = "At least one measurement (weight, length, or head circumference) is required."
    }

    const weightNum = parseFloat(form.weightKg)
    if (form.weightKg.trim() && (isNaN(weightNum) || weightNum <= 0)) {
      errors.weightKg = "Weight must be a positive number in kilograms."
    }
    const heightNum = parseFloat(form.lengthHeightCm)
    if (form.lengthHeightCm.trim() && (isNaN(heightNum) || heightNum <= 0)) {
      errors.lengthHeightCm = "Length/height must be a positive number in centimetres."
    }
    const headNum = parseFloat(form.headCircumferenceCm)
    if (form.headCircumferenceCm.trim() && (isNaN(headNum) || headNum <= 0)) {
      errors.headCircumferenceCm = "Head circumference must be a positive number in centimetres."
    }

    if (Object.keys(errors).length > 0) {
      dispatch({ type: "FORM_ERRORS", errors })
      return
    }

    dispatch({ type: "SUBMIT_START" })
    try {
      const input: AddMeasurementInput = {
        childId,
        measuredOn: form.measuredOn,
        weightKg: form.weightKg.trim() ? weightNum : undefined,
        lengthHeightCm: form.lengthHeightCm.trim() ? heightNum : undefined,
        headCircumferenceCm: form.headCircumferenceCm.trim() ? headNum : undefined,
      }
      const measurement = await growthService.addMeasurement(input)
      dispatch({ type: "SUBMIT_DONE", measurement })
    } catch (err) {
      const msg = err instanceof AppError ? err.message : "Unable to save measurement."
      dispatch({ type: "FORM_ERRORS", errors: { general: msg } })
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight">
              Growth — {child.name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatAge(ageMonths)} old
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => dispatch({ type: "SHOW_FORM" })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-opacity"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            Add measurement
          </button>
        )}
      </div>

      {/* Reference disclaimer banner (FR-031, T-10) */}
      <aside
        aria-label="Chart reference disclaimer"
        className="flex items-start gap-2 rounded-xl border border-[#FECDCA] bg-[#FFF1F0] px-4 py-3 text-xs"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#E27D72]" aria-hidden />
        <span className="text-[#B91C1C]">
          <strong>Demonstration only — not official WHO data.</strong> The
          reference bands (−2SD to +2SD) are synthetic illustrative curves.
          Clinical status is{" "}
          <strong>not assessed</strong>. Do not use for medical decisions. Visit
          your PHM or clinic for professional growth assessment.
        </span>
      </aside>

      {/* Add form */}
      {showAddForm && (
        <AddMeasurementForm
          form={addForm}
          today={today}
          onField={(field, value) => dispatch({ type: "FIELD", field, value })}
          onSubmit={handleSubmit}
          onCancel={() => dispatch({ type: "HIDE_FORM" })}
        />
      )}

      {/* Chart or empty state */}
      {!hasWeightData ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-10 text-center">
          <BarChart2 className="h-10 w-10 text-muted-foreground/40" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">No weight measurements yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first measurement to see the growth chart.
            </p>
          </div>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => dispatch({ type: "SHOW_FORM" })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-opacity"
            >
              <PlusCircle className="h-4 w-4" aria-hidden />
              Add first measurement
            </button>
          )}
        </div>
      ) : (
        <section aria-label="Weight-for-age chart">
          <h2 className="mb-3 text-base font-semibold">
            Weight-for-age chart (weight in kg · age in months)
          </h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="ageMonths"
                  label={{ value: "Age (months)", position: "insideBottom", offset: -2, fontSize: 11 }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  label={{ value: "Weight (kg)", angle: -90, position: "insideLeft", fontSize: 11 }}
                  tick={{ fontSize: 11 }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(v: any, name: any) => [`${v ?? "-"} kg`, String(name)]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {/* Reference bands */}
                <Line
                  dataKey="sdMinus2"
                  name="-2SD (demo)"
                  stroke="#E27D72"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
                <Line
                  dataKey="sdMinus1"
                  name="-1SD (demo)"
                  stroke="#F4C95D"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
                <Line
                  dataKey="median"
                  name="Median (demo)"
                  stroke="#0F766E"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                  connectNulls
                />
                <Line
                  dataKey="sdPlus1"
                  name="+1SD (demo)"
                  stroke="#F4C95D"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
                <Line
                  dataKey="sdPlus2"
                  name="+2SD (demo)"
                  stroke="#E27D72"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
                {/* Child's weight */}
                <Line
                  dataKey="weight"
                  name={`${child.name}'s weight`}
                  stroke="#0F766E"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#0F766E" }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Measurement table (accessible alternative, NFR-05) */}
      {measurements.length > 0 && (
        <section aria-label="Measurement records">
          <h2 className="mb-3 text-base font-semibold">Measurement records</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[500px] border-collapse text-sm">
              <caption className="sr-only">
                Growth measurements for {child.name}
              </caption>
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold text-xs">Date</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold text-xs">Age</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold text-xs">Weight (kg)</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold text-xs">Length/Height (cm)</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold text-xs">Head circ. (cm)</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold text-xs">Source</th>
                </tr>
              </thead>
              <tbody>
                {[...measurements]
                  .sort((a, b) => b.measuredOn.localeCompare(a.measuredOn))
                  .map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-xs">{formatDate(m.measuredOn)}</td>
                      <td className="px-4 py-2.5 text-xs">
                        {formatAge(ageInMonths(child.dateOfBirth, m.measuredOn))}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{m.weightKg ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{m.lengthHeightCm ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{m.headCircumferenceCm ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs capitalize">{m.source.replace("_", " ")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Clinical disclaimer */}
      <footer className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <strong>Fictional demonstration only.</strong> Measurements here are
        not clinically assessed. Reference bands are synthetic and do not
        substitute official WHO weight-for-age tables. Always consult your PHM
        or clinic for professional growth monitoring.
      </footer>
    </div>
  )
}
