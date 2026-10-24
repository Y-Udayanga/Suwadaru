import type { ClinicAppointment } from "@/types"

const REMINDER_LEAD_MS = 7 * 24 * 60 * 60 * 1000

export type AppointmentTimingLabel = "upcoming" | "overdue" | "completed" | "cancelled"

/** A preview is never a delivery receipt. */
export interface AppointmentReminderPreview {
  appointmentId: string
  childId: string
  timingLabel: "upcoming" | "overdue"
  eligible: boolean
  deliveryState: "not_sent"
  previewText: string
  reason: string
}

export function appointmentTimingLabel(
  appointment: ClinicAppointment,
  now: Date,
): AppointmentTimingLabel {
  if (appointment.status === "completed" || appointment.status === "cancelled") {
    return appointment.status
  }
  const at = Date.parse(appointment.scheduledAt)
  if (Number.isNaN(at) || at >= now.getTime()) return "upcoming"
  return "overdue"
}

export function buildReminderPreview(
  appointment: ClinicAppointment,
  now: Date,
): AppointmentReminderPreview | null {
  if (appointment.status !== "scheduled") return null
  const at = Date.parse(appointment.scheduledAt)
  const timingLabel = appointmentTimingLabel(appointment, now)
  if (timingLabel !== "upcoming" && timingLabel !== "overdue") return null
  const when = Number.isNaN(at)
    ? appointment.scheduledAt
    : new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Colombo",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(at))
  const withinLead = !Number.isNaN(at) && at - now.getTime() <= REMINDER_LEAD_MS
  const eligible = withinLead
  const reason = Number.isNaN(at)
    ? "The visit time could not be read. No reminder has been sent."
    : eligible && timingLabel === "overdue"
      ? "This scheduled visit is past its time. A preview is available, and no reminder has been sent."
      : eligible
        ? "Eligible for a preview only. No SMS, email, or push message has been sent."
        : "A reminder preview becomes eligible within 7 days of the visit. No reminder has been sent."
  return {
    appointmentId: appointment.id,
    childId: appointment.childId,
    timingLabel,
    eligible,
    deliveryState: "not_sent",
    previewText: `Reminder preview: clinic visit at ${appointment.clinicName} on ${when}. Please bring the child's physical CHDR book and clinic card. This preview has not been sent.`,
    reason,
  }
}
