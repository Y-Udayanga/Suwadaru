import { watchRecords } from "@/services/realtime"
/**
 * AppointmentsPage — Frontend B
 *
 * Route: /children/:childId/appointments
 * Owner: Frontend B (feature/frontend-health)
 *
 * Requirements (BRD §7.6, §9, §10, §14, T-12):
 *   - Responsive upcoming / past clinic visit list.
 *   - Create, edit, cancel, complete lifecycle.
 *   - Inputs: selected childId, clinicName, scheduled local date+time with clear formatting,
 *     purpose, status.
 *   - Keep clinic appointment strictly separate from scheduled EPI milestones (FR-051, BR-02).
 *   - Appointment reminder preview panel with prominent "Not sent" label (no real push/SMS, BR-07, FR-052).
 *   - Empty, invalid-date, and user-confirmation states.
 *   - Consumes `appointmentService` adapter (no direct fixture imports in component).
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
  Building2,
  CalendarCheck2,
} from "lucide-react"
import type { ChildFeaturePageProps, ClinicAppointment } from "@/types"
import type { Child } from "@/types"
import { AppError } from "@/services/contracts"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { resolveChild, ageInMonths, formatAge } from "../childResolver"
import { appointmentService } from "./appointmentService"
import {
  apptToIsoDateTime,
  isoDateTimeToLocal,
  formatAppointmentDateTime,
} from "./appointmentHelpers"
import { useLanguage } from "@/hooks/useLanguage"

// ---------------------------------------------------------------------------
// Types & State
// ---------------------------------------------------------------------------
type AppointmentTab = "upcoming" | "past"

export type AppointmentFormState = {
  scheduledDate: string // YYYY-MM-DD
  scheduledTime: string // HH:MM
  clinicName: string
  purpose: string
  status: "scheduled" | "completed"
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
      confirmCompleteId: string | null
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
  | { type: "CONFIRM_COMPLETE"; appointmentId: string }
  | { type: "DISMISS_CONFIRM" }
  | { type: "MUTATION_DONE"; appointment: ClinicAppointment }

const initialForm: AppointmentFormState = {
  scheduledDate: new Date().toISOString().slice(0, 10),
  scheduledTime: "09:00",
  clinicName: "",
  purpose: "",
  status: "scheduled",
  errors: {},
  submitting: false,
  editingId: null,
}

function isUpcoming(appointment: ClinicAppointment): boolean {
  // Active scheduled visits remain in upcoming tab for caregiver visibility
  return appointment.status === "scheduled"
}


function reducer(state: PageState, action: Action): PageState {
  switch (action.type) {
    case "LOADED":
      if (state.phase === "ready") return { ...state, child: action.child, appointments: action.appointments }
      return {
        phase: "ready",
        child: action.child,
        appointments: action.appointments,
        tab: "upcoming",
        showForm: false,
        form: { ...initialForm },
        confirmCancelId: null,
        confirmCompleteId: null,
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
        confirmCompleteId: null,
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
          status: action.appointment.status === "completed" ? "completed" : "scheduled",
          errors: {},
          submitting: false,
          editingId: action.appointment.id,
        },
        confirmCancelId: null,
        confirmCompleteId: null,
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
          : [...state.appointments.filter(a => a.id !== action.appointment.id), action.appointment],
        showForm: false,
      }
    case "CONFIRM_CANCEL":
      return {
        ...state,
        confirmCancelId: action.appointmentId,
        confirmCompleteId: null,
      }
    case "CONFIRM_COMPLETE":
      return {
        ...state,
        confirmCompleteId: action.appointmentId,
        confirmCancelId: null,
      }
    case "DISMISS_CONFIRM":
      return { ...state, confirmCancelId: null, confirmCompleteId: null }
    case "MUTATION_DONE":
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.appointment.id ? action.appointment : a,
        ),
        confirmCancelId: null,
        confirmCompleteId: null,
      }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Status Badge Component
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: ClinicAppointment["status"] }) {
  const { language } = useLanguage()
  const isSi = language === "si"

  const map: Record<
    ClinicAppointment["status"],
    { label: string; cls: string; Icon: React.ElementType }
  > = {
    scheduled: {
      label: isSi ? "නියමිතයි" : "Scheduled",
      cls: "bg-primary/10 text-primary border-primary/25",
      Icon: Clock,
    },

    completed: {
      label: isSi ? "සම්පූර්ණයි" : "Completed",
      cls: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800",
      Icon: CheckCircle2,
    },
    cancelled: {
      label: isSi ? "අවලංගුයි" : "Cancelled",
      cls: "bg-muted text-muted-foreground border-border",
      Icon: XCircle,
    },
  }
  const { label, cls, Icon } = map[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        cls,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Appointment Card Component
// ---------------------------------------------------------------------------
type AppointmentCardProps = {
  appointment: ClinicAppointment
  childName: string
  onEdit: (a: ClinicAppointment) => void
  onCancel: (id: string) => void
  onComplete: (id: string) => void
  confirmCancelId: string | null
  confirmCompleteId: string | null
  onDismissConfirm: () => void
  onConfirmCancel: () => void
  onConfirmComplete: () => void
  processing: boolean
}

function AppointmentCard({
  appointment,
  childName,
  onEdit,
  onCancel,
  onComplete,
  confirmCancelId,
  confirmCompleteId,
  onDismissConfirm,
  onConfirmCancel,
  onConfirmComplete,
  processing,
}: AppointmentCardProps) {
  const { language } = useLanguage()
  const isSi = language === "si"
  const isEditable = appointment.status === "scheduled"
  const showCancelConfirm = confirmCancelId === appointment.id
  const showCompleteConfirm = confirmCompleteId === appointment.id

  return (
    <article
      data-testid={`appointment-card-${appointment.id}`}
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3.5 transition-shadow hover:shadow-xs"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base text-foreground tracking-tight flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary shrink-0" aria-hidden />
              {appointment.clinicName}
            </h3>
            <span
              className="inline-flex items-center rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] font-medium text-teal-800"
              title="Physical facility visit — distinct from national immunization milestone due date"
            >
              Clinic Visit (Physical Facility)
            </span>
          </div>
          <time
            dateTime={appointment.scheduledAt}
            className="text-xs text-muted-foreground flex items-center gap-1"
          >
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            {formatAppointmentDateTime(appointment.scheduledAt)}
          </time>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      {/* Purpose */}
      {appointment.purpose ? (
        <p className="text-sm text-foreground/90 bg-muted/30 rounded-lg p-2.5 border border-border/50">
          <strong className="text-xs uppercase text-muted-foreground block mb-0.5 tracking-wider">
            Visit Purpose
          </strong>
          {appointment.purpose}
        </p>
      ) : (
        <p className="text-xs italic text-muted-foreground">
          No specific clinical purpose specified.
        </p>
      )}

      {/* Boundary distinction callout (FR-051) */}
      <p className="text-[11px] text-muted-foreground bg-slate-50 border border-slate-200/80 rounded-md px-2.5 py-1">
        ℹ️ <strong>Separate from national EPI milestone:</strong> This scheduled appointment date is for your physical clinic consultation and is independent of the calendar-age vaccine due dates.
      </p>

      {/* Reminder preview panel with prominent 'Not sent' label (FR-052, BR-07) */}
      {appointment.status === "scheduled" && (
        <aside
          aria-label="Appointment reminder preview"
          className="rounded-lg border border-amber-300 bg-amber-50/90 p-3 flex flex-col gap-1.5"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold text-xs text-amber-900 flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-amber-700" aria-hidden />
              Appointment Reminder Preview
            </span>
            <span
              data-testid="reminder-not-sent-badge"
              className="rounded-md bg-amber-200/90 border border-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950 uppercase tracking-wider"
            >
              Not sent
            </span>
          </div>
          <p className="text-xs text-amber-900 font-mono bg-white/70 rounded p-2 border border-amber-200/80">
            "Reminder for {childName}: Clinic visit scheduled at {appointment.clinicName} on {formatAppointmentDateTime(appointment.scheduledAt)}. Please bring child's physical CHDR book and clinic card."
          </p>
          <p className="text-[11px] text-amber-800">
            SuwaDaru shows reminder previews only — no SMS, WhatsApp, or push notification is ever sent.
          </p>
        </aside>
      )}

      {/* Actions */}
      {isEditable && !showCancelConfirm && !showCompleteConfirm && (
        <div className="flex gap-2 flex-wrap pt-1 border-t border-border/40">
          <button
            type="button"
            onClick={() => onComplete(appointment.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/60 dark:text-green-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-green-700 dark:text-green-400" aria-hidden />
            {isSi ? "සම්පූර්ණයි" : "Mark as completed"}
          </button>
          <button
            type="button"
            onClick={() => onEdit(appointment)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" aria-hidden />
            {isSi ? "සංස්කරණය" : "Edit details"}
          </button>
          <button
            type="button"
            onClick={() => onCancel(appointment.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECDCA] bg-[#FFF1F0] dark:border-red-900/60 dark:bg-red-950/40 px-3 py-1.5 text-xs font-medium text-[#B91C1C] dark:text-red-300 hover:bg-[#FECDCA]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors cursor-pointer"
          >
            <XCircle className="h-3.5 w-3.5 text-[#E27D72]" aria-hidden />
            {isSi ? "අවලංගු කරන්න" : "Cancel appointment"}
          </button>
        </div>
      )}

      {/* Cancellation Confirmation alertdialog */}
      {showCancelConfirm && (
        <div
          role="alertdialog"
          aria-label="Confirm appointment cancellation"
          className="rounded-lg border border-[#FECDCA] bg-[#FFF1F0] p-3.5 flex flex-col gap-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[#B91C1C]">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            Cancel this clinic appointment?
          </div>
          <p className="text-xs text-muted-foreground">
            This will mark the visit at <strong>{appointment.clinicName}</strong> as cancelled and move it to your past visits archive.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onConfirmCancel}
              disabled={processing}
              className="rounded-lg bg-[#E27D72] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#d4665a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-colors cursor-pointer"
            >
              {processing ? "Cancelling…" : "Yes, cancel appointment"}
            </button>
            <button
              type="button"
              onClick={onDismissConfirm}
              disabled={processing}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-colors cursor-pointer"
            >
              Keep appointment
            </button>
          </div>
        </div>
      )}

      {/* Completion Confirmation alertdialog */}
      {showCompleteConfirm && (
        <div
          role="alertdialog"
          aria-label="Confirm appointment completion"
          className="rounded-lg border border-green-300 bg-green-50 p-3.5 flex flex-col gap-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold text-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-700" aria-hidden />
            Mark clinic visit as completed?
          </div>
          <p className="text-xs text-green-800">
            Marking this appointment as completed will record that <strong>{childName}</strong> attended the visit at <strong>{appointment.clinicName}</strong>.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onConfirmComplete}
              disabled={processing}
              className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-colors cursor-pointer"
            >
              {processing ? "Marking complete…" : "Yes, mark completed"}
            </button>
            <button
              type="button"
              onClick={onDismissConfirm}
              disabled={processing}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-colors cursor-pointer"
            >
              Keep scheduled
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

// ---------------------------------------------------------------------------
// Appointment Form Component
// ---------------------------------------------------------------------------
type FormProps = {
  form: AppointmentFormState
  child: Child
  isEdit: boolean
  onField: (field: string, value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

function AppointmentForm({
  form,
  child,
  isEdit,
  onField,
  onSubmit,
  onCancel,
}: FormProps) {
  const firstRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  return (
    <section
      aria-label={isEdit ? "Edit clinic appointment" : "Schedule new clinic appointment"}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col gap-4 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-primary/15 pb-3">
        <div>
          <h2 className="text-base font-semibold text-primary flex items-center gap-1.5">
            <CalendarCheck2 className="h-4 w-4" aria-hidden />
            {isEdit ? "Edit Clinic Appointment" : "Schedule New Clinic Appointment"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            For child: <strong>{child.name}</strong> (ID: {child.id})
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground bg-card/80 border border-border px-2 py-0.5 rounded">
          Local time (+05:30)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Clinic Name */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="appt-clinic" className="text-xs font-semibold">
            Healthcare Facility / Clinic Name <span className="text-[#E27D72]" aria-hidden>*</span>
          </label>
          <input
            ref={firstRef}
            id="appt-clinic"
            type="text"
            value={form.clinicName}
            onChange={(e) => onField("clinicName", e.target.value)}
            disabled={form.submitting}
            placeholder="e.g. MOH Clinic Dehiwala, Colombo or Lady Ridgeway Hospital"
            className={cn(
              "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              form.errors.clinicName && "border-[#E27D72] ring-1 ring-[#E27D72]",
            )}
            aria-describedby={form.errors.clinicName ? "err-clinic" : undefined}
            aria-invalid={!!form.errors.clinicName}
          />
          {form.errors.clinicName && (
            <p id="err-clinic" className="text-xs font-medium text-[#E27D72]" role="alert">
              {form.errors.clinicName}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label htmlFor="appt-date" className="text-xs font-semibold">
            Appointment Date <span className="text-[#E27D72]" aria-hidden>*</span>
          </label>
          <input
            id="appt-date"
            type="date"
            value={form.scheduledDate}
            onChange={(e) => onField("scheduledDate", e.target.value)}
            disabled={form.submitting}
            className={cn(
              "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              form.errors.scheduledDate && "border-[#E27D72] ring-1 ring-[#E27D72]",
            )}
            aria-describedby={form.errors.scheduledDate ? "err-date" : undefined}
            aria-invalid={!!form.errors.scheduledDate}
          />
          {form.errors.scheduledDate && (
            <p id="err-date" className="text-xs font-medium text-[#E27D72]" role="alert">
              {form.errors.scheduledDate}
            </p>
          )}
        </div>

        {/* Time */}
        <div className="flex flex-col gap-1">
          <label htmlFor="appt-time" className="text-xs font-semibold">
            Local Time (Sri Lanka, +05:30) <span className="text-[#E27D72]" aria-hidden>*</span>
          </label>
          <input
            id="appt-time"
            type="time"
            value={form.scheduledTime}
            onChange={(e) => onField("scheduledTime", e.target.value)}
            disabled={form.submitting}
            className={cn(
              "rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              form.errors.scheduledTime && "border-[#E27D72] ring-1 ring-[#E27D72]",
            )}
            aria-describedby={form.errors.scheduledTime ? "err-time" : undefined}
            aria-invalid={!!form.errors.scheduledTime}
          />
          {form.errors.scheduledTime && (
            <p id="err-time" className="text-xs font-medium text-[#E27D72]" role="alert">
              {form.errors.scheduledTime}
            </p>
          )}
        </div>

        {/* Purpose */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="appt-purpose" className="text-xs font-semibold">
            Purpose of Visit (optional)
          </label>
          <input
            id="appt-purpose"
            type="text"
            value={form.purpose}
            onChange={(e) => onField("purpose", e.target.value)}
            disabled={form.submitting}
            placeholder="e.g. 9-month development check and MMR vaccination"
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="appt-status" className="text-xs font-semibold">
            Appointment Status
          </label>
          <select
            id="appt-status"
            value={form.status}
            onChange={(e) => onField("status", e.target.value)}
            disabled={form.submitting}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <option value="scheduled">Scheduled (Upcoming visit)</option>
            <option value="completed">Completed (Attended visit)</option>
          </select>
          <p className="text-[11px] text-muted-foreground">
            To cancel an appointment, use the "Cancel appointment" action on the appointment card.
          </p>
        </div>
      </div>

      {form.errors.general && (
        <div className="rounded-lg border border-[#FECDCA] bg-[#FFF1F0] px-3 py-2 text-xs font-medium text-[#E27D72]" role="alert">
          {form.errors.general}
        </div>
      )}

      <div className="flex gap-2 flex-wrap pt-2 border-t border-[#A7F3D0]/50">
        <button
          type="button"
          onClick={onSubmit}
          disabled={form.submitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {form.submitting
            ? "Saving…"
            : isEdit
            ? "Save changes"
            : "Schedule appointment"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={form.submitting}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export function AppointmentsPage({ childId }: ChildFeaturePageProps) {
  const { language } = useLanguage()
  const isSi = language === "si"
  const [state, dispatch] = useReducer(reducer, { phase: "loading" })

  useEffect(() => {
    let cancelled = false
    let revision = 0
    async function load() {
      const current = ++revision
      try {
        const [child, appointments] = await Promise.all([
          resolveChild(childId),
          appointmentService.list(childId),
        ])
        if (!cancelled && current === revision) dispatch({ type: "LOADED", child, appointments })
      } catch (err) {
        if (!cancelled && current === revision) {
          const message =
            err instanceof AppError
              ? err.message
              : "Unable to load appointments for this child profile."
          dispatch({ type: "ERROR", message })
        }
      }
    }
    void load()
    const stop = watchRecords(["clinic_appointments","children"], () => { void load() })
    return () => { cancelled = true; stop() }
  }, [childId])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state.phase === "loading") {
    return (
      <div className="flex max-w-2xl flex-col gap-4" aria-busy="true" aria-label="Loading appointments">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-14 rounded-xl bg-muted animate-pulse" />
        {[1, 2].map((n) => (
          <div key={n} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state.phase === "error") {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <div className="rounded-xl border border-[#FECDCA] bg-[#FFF1F0] p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#E27D72]" aria-hidden />
            <h1 className="text-lg font-semibold text-foreground">Child record unavailable</h1>
          </div>
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <Link
            to={routes.dashboard}
            className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Ready ────────────────────────────────────────────────────────────────
  const { child, appointments, tab, showForm, form, confirmCancelId, confirmCompleteId } = state
  const ageMonths = ageInMonths(child.dateOfBirth)

  const upcoming = appointments.filter(isUpcoming)
  const past = appointments.filter((a) => !isUpcoming(a))
  const displayed = tab === "upcoming" ? upcoming : past

  async function handleSubmit() {
    if (state.phase !== "ready") return
    const { form: f } = state
    const errors: Record<string, string> = {}

    // Validation: Clinic Name
    if (!f.clinicName || !f.clinicName.trim()) {
      errors.clinicName = "Clinic name is required."
    }

    // Validation: Date
    if (!f.scheduledDate || !f.scheduledDate.trim()) {
      errors.scheduledDate = "Appointment date is required."
    } else {
      const parsedDate = Date.parse(f.scheduledDate)
      if (isNaN(parsedDate)) {
        errors.scheduledDate = "Please enter a valid appointment date."
      }
    }

    // Validation: Time
    if (!f.scheduledTime || !f.scheduledTime.trim()) {
      errors.scheduledTime = "Appointment time is required."
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
          clinicName: f.clinicName.trim(),
          purpose: f.purpose?.trim() || undefined,
          status: f.status,
        })
      } else {
        const created = await appointmentService.create({
          childId: child.id,
          scheduledAt,
          clinicName: f.clinicName.trim(),
          purpose: f.purpose?.trim() || undefined,
        })
        // If status was chosen as completed on creation, update it
        if (f.status === "completed") {
          appointment = await appointmentService.update(created.id, { status: "completed" })
        } else {
          appointment = created
        }
      }
      dispatch({ type: "SUBMIT_DONE", appointment })
    } catch (err) {
      const msg =
        err instanceof AppError ? err.message : "Unable to save appointment. Please check inputs."
      dispatch({ type: "FORM_ERRORS", errors: { general: msg } })
    }
  }

  async function handleConfirmCancel() {
    if (state.phase !== "ready" || !state.confirmCancelId) return
    try {
      const appointment = await appointmentService.cancel(state.confirmCancelId)
      dispatch({ type: "MUTATION_DONE", appointment })
    } catch {
      dispatch({ type: "DISMISS_CONFIRM" })
    }
  }

  async function handleConfirmComplete() {
    if (state.phase !== "ready" || !state.confirmCompleteId) return
    try {
      const appointment = await appointmentService.complete(state.confirmCompleteId)
      dispatch({ type: "MUTATION_DONE", appointment })
    } catch {
      dispatch({ type: "DISMISS_CONFIRM" })
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 max-w-2xl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isSi ? "MOH සායන හමුවීම්" : "Clinic Appointments"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isSi
              ? `${child.name} දරුවාගේ සායන සහ වෛද්‍ය හමුවීම් සටහන් • වයස: ${formatAge(ageMonths)}`
              : `Tracking physical clinic visits for ${child.name} • ${formatAge(ageMonths)} old`}
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => dispatch({ type: "SHOW_ADD_FORM" })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-opacity cursor-pointer shadow-xs"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            {isSi ? "නව හමුවීමක් එක් කරන්න" : "Schedule appointment"}
          </button>
        )}
      </div>

      {/* EPI Milestone Separation Banner (FR-051, BR-02) */}
      <aside
        aria-label="Clinical boundary notice"
        className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs leading-relaxed"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="text-muted-foreground">
          <strong className="text-foreground">
            {isSi
              ? "සායන හමුවීම් සහ ජාතික එන්නත් කාලසටහන (EPI):"
              : "Clinic Appointments vs National EPI Milestones:"}
          </strong>{" "}
          {isSi
            ? "සායන හමුවීම් යනු සෞඛ්‍ය මධ්‍යස්ථානයක (MOH සායනය, රෝහල හෝ පවුල් වෛද්‍යවරයා) සිදුකරන සෘජු හමුවීම් වේ. ඒවා ජාතික එන්නත් කාලසටහනේ දිනයන්ගෙන් වෙන්ව නිරීක්ෂණය කෙරේ."
            : "Clinic visits are scheduled consultations at a healthcare facility (MOH clinic, hospital, or GP). They are tracked separately from national EPI immunization calendar due dates."}
        </span>
      </aside>

      {/* Reminder Preview Disclaimer (FR-052, BR-07) */}
      <aside
        aria-label="Reminder disclaimer"
        className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/40 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200"
      >
        <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
        <span>
          <strong>{isSi ? "ආදර්ශන මතක් කිරීම් පමණි:" : "Reminder previews only:"}</strong>{" "}
          {isSi ? (
            <>
              සුවදරු <span className="font-bold underline">"යවන ලද්දක් නොවේ"</span> ලෙස ආදර්ශන මතක් කිරීම් පෙන්වයි. සැබෑ SMS හෝ Push දැනුම්දීම් යවනු නොලැබේ.
            </>
          ) : (
            <>
              SuwaDaru displays demonstration previews labeled{" "}
              <span className="font-bold underline">"Not sent"</span>. No real SMS, push, or email notifications are dispatched.
            </>
          )}
        </span>
      </aside>

      {/* Add / Edit Form */}
      {showForm && (
        <AppointmentForm
          form={form}
          child={child}
          isEdit={!!form.editingId}
          onField={(field, value) => dispatch({ type: "FORM_FIELD", field, value })}
          onSubmit={handleSubmit}
          onCancel={() => dispatch({ type: "HIDE_FORM" })}
        />
      )}

      {/* Tabs */}
      <div role="tablist" aria-label="Filter appointments by time" className="flex gap-2 border-b border-border">
        {(["upcoming", "past"] as AppointmentTab[]).map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-controls={`panel-${t}`}
            aria-selected={tab === t}
            type="button"
            onClick={() => dispatch({ type: "SET_TAB", tab: t })}
            className={cn(
              "rounded-t-lg px-4 py-2.5 text-sm font-semibold capitalize transition-colors cursor-pointer",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              tab === t
                ? "border-b-2 border-primary text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "upcoming" ? (isSi ? "ඉදිරි හමුවීම්" : "upcoming visits") : isSi ? "පසුගිය හමුවීම්" : "past visits"}
            {t === "upcoming" && upcoming.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {upcoming.length}
              </span>
            )}
            {t === "past" && past.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {past.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Appointment List Section */}
      <section
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        aria-label={`${tab} clinic visits`}
      >
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-xs">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30" aria-hidden />
            <div>
              <p className="font-semibold text-sm text-foreground">
                {isSi
                  ? `${child.name} සඳහා ${tab === "upcoming" ? "ඉදිරි" : "පසුගිය"} සායන හමුවීම් නොමැත`
                  : `No ${tab} appointments for ${child.name}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {tab === "upcoming"
                  ? isSi
                    ? "පහත බොත්තම භාවිතයෙන් ඔබේ දරුවාගේ මීළඟ සායන හෝ වෛද්‍ය හමුවීම සටහන් කරන්න."
                    : "Schedule your child's next clinic consultation, development review, or vaccination visit using the button below."
                  : isSi
                  ? "සම්පූර්ණ කරන ලද හෝ අවලංගු කරන ලද සායන හමුවීම් මෙහි සටහන් වේ."
                  : "Completed or cancelled clinic visits will appear here for your historical records."}
              </p>
            </div>
            {tab === "upcoming" && !showForm && (
              <button
                type="button"
                onClick={() => dispatch({ type: "SHOW_ADD_FORM" })}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-opacity cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" aria-hidden />
                {isSi ? "නව හමුවීමක් එක් කරන්න" : "Schedule new appointment"}
              </button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3.5 list-none p-0 m-0">
            {displayed.map((appt) => (
              <li key={appt.id}>
                <AppointmentCard
                  appointment={appt}
                  childName={child.name}
                  onEdit={(a) => dispatch({ type: "SHOW_EDIT_FORM", appointment: a })}
                  onCancel={(id) => dispatch({ type: "CONFIRM_CANCEL", appointmentId: id })}
                  onComplete={(id) => dispatch({ type: "CONFIRM_COMPLETE", appointmentId: id })}
                  confirmCancelId={confirmCancelId}
                  confirmCompleteId={confirmCompleteId}
                  onDismissConfirm={() => dispatch({ type: "DISMISS_CONFIRM" })}
                  onConfirmCancel={handleConfirmCancel}
                  onConfirmComplete={handleConfirmComplete}
                  processing={!!confirmCancelId || !!confirmCompleteId}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Demo Footer */}
      <footer className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        <strong>Caregiver records:</strong> Clinic appointments are saved to your account. No external reminders are dispatched. Always consult your official Child Health Development Record (CHDR) and your local Public Health Midwife (PHM).
      </footer>
    </div>
  )
}
