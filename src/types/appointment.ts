import type { IsoDateTime } from "./common"

export type AppointmentStatus = "scheduled" | "completed" | "cancelled"

/**
 * A clinic visit. `scheduledAt` is the appointment instant, not an EPI due date.
 */
export interface ClinicAppointment {
  id: string
  childId: string
  /** ISO 8601 date-time with an explicit offset. */
  scheduledAt: IsoDateTime
  clinicName: string
  purpose?: string
  status: AppointmentStatus
}

export interface CreateAppointmentInput {
  childId: string
  scheduledAt: IsoDateTime
  clinicName: string
  purpose?: string
}

export interface UpdateAppointmentInput {
  scheduledAt?: IsoDateTime
  clinicName?: string
  purpose?: string
  /** Cancellation goes through AppointmentService.cancel. */
  status?: Exclude<AppointmentStatus, "cancelled">
}
