import type {
  ClinicAppointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "@/types"

/**
 * Clinic appointment boundary. Times use an ISO 8601 offset, not an EPI due date.
 * Throw AppError for expected failures. `cancel` sets status to `cancelled`
 * and does not claim a reminder was sent.
 */
export interface AppointmentService {
  list(childId: string): Promise<ClinicAppointment[]>
  create(input: CreateAppointmentInput): Promise<ClinicAppointment>
  update(
    appointmentId: string,
    input: UpdateAppointmentInput,
  ): Promise<ClinicAppointment>
  cancel(appointmentId: string): Promise<ClinicAppointment>
}
