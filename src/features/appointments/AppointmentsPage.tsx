/**
 * AppointmentsPage — Frontend B
 *
 * Route: /children/:childId/appointments
 * Owner: Frontend B (feature/frontend-health)
 *
 * States covered (BRD §8, FR-050–052, T-12):
 *   loading   — resolving child + appointments
 *   error     — unknown childId (safe state, BR-08)
 *   list      — tabbed upcoming/past view
 *   add/edit  — inline appointment form
 *   empty     — no appointments; CTA to create one
 *   completed — shows updated list with reminder preview labeled "not sent"
 *
 * Constraints:
 *   - Do NOT modify AppShell, router, shared types, or service contracts.
 *   - FR-051: scheduledAt is a date-time with offset; NOT the same as an EPI due date.
 *   - FR-052: reminder preview explicitly labeled "not sent" (BR-07).
 *   - Confirmation dialog for cancel/delete actions.
 */

import { useEffect, useReducer, useRef } from "react"
import { Link } from "react-router"
import {
  CalendarDays,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Info,
  Bell,
} from "lucide-react"
import type { ChildFeaturePageProps, ClinicAppointment } from "@/types"
import type { Child } from "@/types"
import { AppError } from "@/services/contracts"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { resolveChild, ageInMonths, formatAge } from "../childResolver"
import { appointmentService } from "./appointmentService"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AppointmentTab = "upcoming" | "past"

type AppointmentFormState = {
  scheduledDate: string // YYYY-MM-DD (local, combined with time below)
  scheduledTime: string // HH:MM
  clinicName: string
  purpose: string
  errors: Record<string, string>
  submitting: boolean
  editingId: string | null
}

type PageState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase: "ready"
      child: Child
      appointments: ClinicAppointment[]
      tab: AppointmentTab
      showForm: boolean
      form: AppointmentFormState
      confirmCancelId: string | null
    }

type Action =
  | { type: "LOADED"; child: Child; appointments: ClinicAppointment[] }
  | { type: "ERROR"; message: string }
  | { type: "SET_TAB"; tab: AppointmentTab }
  | { type: "SHOW_ADD_FORM" }
  | { type: "SHOW_EDIT_FORM"; appointment: ClinicAppointment }
  | { type: "HIDE_FORM" }
  | { type: "FORM_FIELD"; field: string; value: string }
  | { type: "FORM_ERRORS"; errors: Record<string, string> }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_DONE"; appointment: ClinicAppointment }
  | { type: "CONFIRM_CANCEL"; appointmentId: string }
  | { type: "DISMISS_CONFIRM" }
  | { type: "CANCEL_DONE"; appointment: ClinicAppointment }

const initialForm: AppointmentFormState = {
  scheduledDate: new Date().toISOString().slice(0, 10),
  scheduledTime: "09:00",
  clinicName: "",
  purpose: "",
  errors: {},
  submitting: false,
  editingId: null,
}

function apptToIsoDateTime(date: string, time: string): string {
  // Combines date + time and appends Sri Lanka offset (+05:30).
  return `${date}T${time}:00+05:30`
}

function isoDateTimeToLocal(isoDateTime: string): { date: string; time: string } {
  try {
    const d = new Date(isoDateTime)
    const date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" }) // YYYY-MM-DD
    const time = d.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      minute: "2-digit",
    })
    return { date, time }
  } catch {
    return { date: isoDateTime.slice(0, 10), time: "09:00" }
  }
}

function reducer(state: PageState, action: Action): PageState {
  switch (action.type) {
    case "LOADED":
      return {
        phase: "ready",
        child: action.child,
        appointments: action.appointments,
        tab: "upcoming",
        showForm: false,
        form: { ...initialForm },
        confirmCancelId: null,
      }
    case "ERROR":
      return { phase: "error", message: action.message }
  }
  if (state.phase !== "ready") return state
  switch (action.type) {
    case "SET_TAB":
      return { ...state, tab: action.tab }
    case "SHOW_ADD_FORM":
      return {
        ...state,
        showForm: true,
        form: {
          ...initialForm,
          scheduledDate: new Date().toISOString().slice(0, 10),
        },
        confirmCancelId: null,
      }
    case "SHOW_EDIT_FORM": {
      const { date, time } = isoDateTimeToLocal(action.appointment.scheduledAt)
      return {
        ...state,
        showForm: true,
        form: {
          scheduledDate: date,
          scheduledTime: time,
          clinicName: action.appointment.clinicName,
          purpose: action.appointment.purpose ?? "",
          errors: {},
          submitting: false,
          editingId: action.appointment.id,
        },
        confirmCancelId: null,
      }
    }
    case "HIDE_FORM":
      return { ...state, showForm: false }
    case "FORM_FIELD":
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value, errors: {} },
      }
    case "FORM_ERRORS":
      return {
        ...state,
        form: { ...state.form, errors: action.errors, submitting: false },
      }
    case "SUBMIT_START":
      return { ...state, form: { ...state.form, submitting: true, errors: {} } }
    case "SUBMIT_DONE":
      return {
        ...state,
        appointments: state.form.editingId
          ? state.appointments.map((a) =>
              a.id === action.appointment.id ? action.appointment : a,
            )
          : [...state.appointments, action.appointment],
        showForm: false,
      }
    case "CONFIRM_CANCEL":
      return { ...state, confirmCancelId: action.appointmentId }
    case "DISMISS_CONFIRM":
      return { ...state, confirmCancelId: null }
    case "CANCEL_DONE":
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.appointment.id ? action.appointment : a,
        ),
        confirmCancelId: null,
      }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDateTime(isoDateTime: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoDateTime))
  } catch {
    return isoDateTime
  }
}

function isUpcoming(appointment: ClinicAppointment): boolean {
  if (appointment.status === "cancelled") return false
  if (appointment.status === "completed") return false
  return new Date(appointment.scheduledAt) >= new Date()
}

function StatusBadge({ status }: { status: ClinicAppointment["status"] }) {
  const map: Record<
    ClinicAppointment["status"],
    { label: string; cls: string; Icon: React.ElementType }
  > = {
    scheduled: {
      label: "Scheduled",
      cls: "bg-[#E8F7F3] text-[#0F766E] border-[#A7F3D0]",
      Icon: Clock,
    },
    completed: {
      label: "Completed",
      cls: "bg-green-50 text-green-800 border-green-200",
      Icon: CheckCircle2,
    },
    cancelled: {
      label: "Cancelled",
      cls: "bg-muted text-muted-foreground border-border",
      Icon: XCircle,
    },
  }
  const { label, cls, Icon } = map[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cls,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Appointment card
// ---------------------------------------------------------------------------
type AppointmentCardProps = {
  appointment: ClinicAppointment
  onEdit: (a: ClinicAppointment) => void
  onCancel: (id: string) => void
  confirmCancelId: string | null
  onDismissConfirm: () => void
  onConfirmCancel: () => void
  cancelling: boolean
}

function AppointmentCard({
  appointment,
  onEdit,
  onCancel,
  confirmCancelId,
  onDismissConfirm,
  onConfirmCancel,
  cancelling,
}: AppointmentCardProps) {
  const isEditable = appointment.status === "scheduled"
  const showConfirm = confirmCancelId === appointment.id

  return (
    <article className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {appointment.clinicName}
          </h3>
          <time
            dateTime={appointment.scheduledAt}
            className="text-xs text-muted-foreground"
          >
            {formatDateTime(appointment.scheduledAt)}
          </time>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      {appointment.purpose && (
        <p className="text-sm text-muted-foreground">{appointment.purpose}</p>
      )}

      {/* Reminder preview (FR-052, BR-07) */}
      {appointment.status === "scheduled" && (
        <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
          <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            <strong>Reminder preview (not sent):</strong> SuwaDaru does not
            send SMS or push notifications.
          </span>
        </p>
      )}

      {/* Actions */}
      {isEditable && !showConfirm && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onEdit(appointment)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onCancel(appointment.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECDCA] bg-[#FFF1F0] px-3 py-1.5 text-xs font-medium text-[#E27D72] hover:bg-[#FECDCA]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden />
            Cancel appointment
          </button>
        </div>
      )}

      {/* Confirmation dialog (inline) */}
      {showConfirm && (
        <div
          role="alertdialog"
          aria-label="Confirm cancellation"
          className="rounded-lg border border-[#FECDCA] bg-[#FFF1F0] p-3 flex flex-col gap-2"
        >
          <p className="text-xs font-medium text-[#B91C1C]">
            Cancel this appointment? This cannot be undone in this demo session.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onConfirmCancel}
              disabled={cancelling}
              className="rounded-lg bg-[#E27D72] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-opacity"
            >
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </button>
            <button
              type="button"
              onClick={onDismissConfirm}
              disabled={cancelling}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-colors"
            >
              Keep
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

// ---------------------------------------------------------------------------
// Appointment form
// ---------------------------------------------------------------------------
type FormProps = {
  form: AppointmentFormState
  isEdit: boolean
  onField: (field: string, value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

function AppointmentForm({ form, isEdit, onField, onSubmit, onCancel }: FormProps) {
  const firstRef = useRef<HTMLInputElement>(null)
  useEffect(() => { firstRef.current?.focus() }, [])

  return (
    <section
      aria-label={isEdit ? "Edit appointment" : "New appointment"}
      className="rounded-xl border border-[#A7F3D0] bg-[#E8F7F3] p-4 flex flex-col gap-4"
    >
      <h2 className="text-sm font-semibold text-[#0F766E]">
        {isEdit ? "Edit appointment" : "New appointment"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Clinic name */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="appt-clinic" className="text-xs font-medium">
            Clinic name <span aria-hidden>*</span>
          </label>
          <input
            ref={firstRef}
            id="appt-clinic"
            type="text"
            value={form.clinicName}
            onChange={(e) => onField("clinicName", e.target.value)}
            disabled={form.submitting}
            placeholder="e.g. Sample Clinic, Colombo"
            className={cn(
              "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              form.errors.clinicName && "border-[#E27D72]",
            )}
            aria-describedby={form.errors.clinicName ? "err-clinic" : undefined}
            aria-invalid={!!form.errors.clinicName}
          />
          {form.errors.clinicName && (
            <p id="err-clinic" className="text-xs text-[#E27D72]" role="alert">
              {form.errors.clinicName}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label htmlFor="appt-date" className="text-xs font-medium">
            Date <span aria-hidden>*</span>
          </label>
          <input
            id="appt-date"
            type="date"
            value={form.scheduledDate}
            onChange={(e) => onField("scheduledDate", e.target.value)}
            disabled={form.submitting}
            className={cn(
              "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              form.errors.scheduledDate && "border-[#E27D72]",
            )}
            aria-describedby={form.errors.scheduledDate ? "err-date" : undefined}
            aria-invalid={!!form.errors.scheduledDate}
          />
          {form.errors.scheduledDate && (
            <p id="err-date" className="text-xs text-[#E27D72]" role="alert">
              {form.errors.scheduledDate}
            </p>
          )}
        </div>

        {/* Time */}
        <div className="flex flex-col gap-1">
          <label htmlFor="appt-time" className="text-xs font-medium">
            Time (Sri Lanka, +05:30) <span aria-hidden>*</span>
          </label>
          <input
            id="appt-time"
            type="time"
            value={form.scheduledTime}
            onChange={(e) => onField("scheduledTime", e.target.value)}
            disabled={form.submitting}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>

        {/* Purpose */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="appt-purpose" className="text-xs font-medium">
            Purpose (optional)
          </label>
          <input
            id="appt-purpose"
            type="text"
            value={form.purpose}
            onChange={(e) => onField("purpose", e.target.value)}
            disabled={form.submitting}
            placeholder="e.g. 6-month immunisation visit"
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
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
          {form.submitting
            ? "Saving…"
            : isEdit
            ? "Save changes"
            : "Create appointment"}
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
export function AppointmentsPage({ childId }: ChildFeaturePageProps) {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [child, appointments] = await Promise.all([
          resolveChild(childId),
          appointmentService.list(childId),
        ])
        if (!cancelled) dispatch({ type: "LOADED", child, appointments })
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof AppError
              ? err.message
              : "Unable to load appointments. Please try again."
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
        {[1, 2].map((n) => (
          <div key={n} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
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
  const { child, appointments, tab, showForm, form, confirmCancelId } = state
  const ageMonths = ageInMonths(child.dateOfBirth)

  const upcoming = appointments.filter(isUpcoming)
  const past = appointments.filter((a) => !isUpcoming(a))
  const displayed = tab === "upcoming" ? upcoming : past

  async function handleSubmit() {
    if (state.phase !== "ready") return
    const { form: f } = state
    const errors: Record<string, string> = {}

    if (!f.clinicName.trim()) {
      errors.clinicName = "Clinic name is required."
    }
    if (!f.scheduledDate) {
      errors.scheduledDate = "Date is required."
    }
    if (Object.keys(errors).length > 0) {
      dispatch({ type: "FORM_ERRORS", errors })
      return
    }

    dispatch({ type: "SUBMIT_START" })
    const scheduledAt = apptToIsoDateTime(f.scheduledDate, f.scheduledTime)

    try {
      let appointment: ClinicAppointment
      if (f.editingId) {
        appointment = await appointmentService.update(f.editingId, {
          scheduledAt,
          clinicName: f.clinicName,
          purpose: f.purpose || undefined,
        })
      } else {
        appointment = await appointmentService.create({
          childId,
          scheduledAt,
          clinicName: f.clinicName,
          purpose: f.purpose || undefined,
        })
      }
      dispatch({ type: "SUBMIT_DONE", appointment })
    } catch (err) {
      const msg =
        err instanceof AppError ? err.message : "Unable to save appointment."
      dispatch({ type: "FORM_ERRORS", errors: { general: msg } })
    }
  }

  async function handleConfirmCancel() {
    if (state.phase !== "ready" || !state.confirmCancelId) return
    try {
      const appointment = await appointmentService.cancel(state.confirmCancelId)
      dispatch({ type: "CANCEL_DONE", appointment })
    } catch {
      // Silently dismiss; in production show error feedback.
      dispatch({ type: "DISMISS_CONFIRM" })
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight">
              Appointments — {child.name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatAge(ageMonths)} old
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => dispatch({ type: "SHOW_ADD_FORM" })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-opacity"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            New appointment
          </button>
        )}
      </div>

      {/* Reminder notice (FR-052) */}
      <aside
        aria-label="Reminder notice"
        className="flex items-start gap-2 rounded-xl border border-border bg-[#E8F7F3] px-4 py-3 text-xs"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="text-muted-foreground">
          SuwaDaru shows reminder{" "}
          <strong className="text-foreground">previews only</strong>. No SMS,
          email, or push notification is sent. Contact your clinic directly for
          real reminders.
        </span>
      </aside>

      {/* Form */}
      {showForm && (
        <AppointmentForm
          form={form}
          isEdit={!!form.editingId}
          onField={(field, value) => dispatch({ type: "FORM_FIELD", field, value })}
          onSubmit={handleSubmit}
          onCancel={() => dispatch({ type: "HIDE_FORM" })}
        />
      )}

      {/* Tabs */}
      <div role="tablist" aria-label="Filter appointments" className="flex gap-1 border-b border-border">
        {(["upcoming", "past"] as AppointmentTab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            type="button"
            onClick={() => dispatch({ type: "SET_TAB", tab: t })}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            {t === "upcoming" && upcoming.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {upcoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Appointment list */}
      <section aria-label={`${tab} appointments`}>
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30" aria-hidden />
            <div>
              <p className="font-semibold text-sm">
                No {tab} appointments
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {tab === "upcoming"
                  ? "Create a new appointment using the button above."
                  : "Completed and cancelled appointments will appear here."}
              </p>
            </div>
            {tab === "upcoming" && !showForm && (
              <button
                type="button"
                onClick={() => dispatch({ type: "SHOW_ADD_FORM" })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-opacity"
              >
                <PlusCircle className="h-4 w-4" aria-hidden />
                New appointment
              </button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {displayed.map((appt) => (
              <li key={appt.id}>
                <AppointmentCard
                  appointment={appt}
                  onEdit={(a) => dispatch({ type: "SHOW_EDIT_FORM", appointment: a })}
                  onCancel={(id) => dispatch({ type: "CONFIRM_CANCEL", appointmentId: id })}
                  confirmCancelId={confirmCancelId}
                  onDismissConfirm={() => dispatch({ type: "DISMISS_CONFIRM" })}
                  onConfirmCancel={handleConfirmCancel}
                  cancelling={!!confirmCancelId}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Disclaimer */}
      <footer className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <strong>Fictional demonstration only.</strong> Appointments are stored
        in-memory for this session only. No real reminders are sent, and this
        data is not persisted to any database.
      </footer>
    </div>
  )
}
