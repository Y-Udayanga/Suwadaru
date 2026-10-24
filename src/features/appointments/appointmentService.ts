/**
 * Mock appointment service adapter for Feature B — Appointments.
 *
 * Promise-based adapter satisfying `AppointmentService` from `@/services/contracts`.
 *
 * BOUNDARY DOCUMENTATION:
 *   - `cancel` sets status to `"cancelled"` and does NOT claim a reminder
 *     was sent (BR-07, BRD FR-052).
 *   - In-memory session state for CRUD operations.
 *
 * INTEGRATION IMPORTS NEEDED FROM FRONTEND A (when B1 lands):
 *   import type { AppointmentService } from "@/services/contracts"
 *   import { AppError } from "@/services/contracts"
 *   — Already imported below.
 */

import type { AppointmentService } from "@/services/contracts"
import { AppError } from "@/services/contracts"
import type {
  ClinicAppointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "@/types"
import { MOCK_APPOINTMENTS } from "./mockData"

const sessionAppointments: Record<string, ClinicAppointment[]> =
  Object.fromEntries(
    Object.entries(MOCK_APPOINTMENTS).map(([k, v]) => [k, [...v]]),
  )

const MOCK_DELAY = 400

function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function findById(
  childId: string,
  appointmentId: string,
): ClinicAppointment | undefined {
  return (sessionAppointments[childId] ?? []).find(
    (a) => a.id === appointmentId,
  )
}

export interface AppointmentServiceWithExtras extends AppointmentService {
  complete(appointmentId: string): Promise<ClinicAppointment>
  resetToDemo(): void
}

export const appointmentService: AppointmentServiceWithExtras = {
  async list(childId: string): Promise<ClinicAppointment[]> {
    await delay()
    return sessionAppointments[childId] ? [...sessionAppointments[childId]] : []
  },

  async create(input: CreateAppointmentInput): Promise<ClinicAppointment> {
    await delay()
    if (input.clinicName?.includes("[simulate-error]")) {
      throw new AppError("unavailable", "Simulated service failure. Please retry.")
    }
    if (!input.clinicName || !input.clinicName.trim()) {
      throw new AppError("validation", "Clinic name is required.")
    }
    if (!input.scheduledAt || isNaN(Date.parse(input.scheduledAt))) {
      throw new AppError("validation", "Valid appointment date and time is required.")
    }
    const appointment: ClinicAppointment = {
      id: `appt_${input.childId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      childId: input.childId,
      scheduledAt: input.scheduledAt,
      clinicName: input.clinicName.trim(),
      purpose: input.purpose?.trim() || undefined,
      status: "scheduled",
    }
    const existing = sessionAppointments[input.childId] ?? []
    sessionAppointments[input.childId] = [...existing, appointment]
    return appointment
  },

  async update(
    appointmentId: string,
    input: UpdateAppointmentInput,
  ): Promise<ClinicAppointment> {
    await delay()
    if (input.clinicName !== undefined && !input.clinicName.trim()) {
      throw new AppError("validation", "Clinic name cannot be empty.")
    }
    if (input.scheduledAt !== undefined && isNaN(Date.parse(input.scheduledAt))) {
      throw new AppError("validation", "Valid appointment date and time is required.")
    }

    for (const childId of Object.keys(sessionAppointments)) {
      const appt = findById(childId, appointmentId)
      if (appt) {
        const updated: ClinicAppointment = {
          ...appt,
          scheduledAt: input.scheduledAt ?? appt.scheduledAt,
          clinicName: input.clinicName ? input.clinicName.trim() : appt.clinicName,
          purpose: input.purpose !== undefined ? input.purpose.trim() || undefined : appt.purpose,
          status: input.status ?? appt.status,
        }
        sessionAppointments[childId] = sessionAppointments[childId].map(
          (a) => (a.id === appointmentId ? updated : a),
        )
        return updated
      }
    }
    throw new AppError(
      "not_found",
      `Appointment "${appointmentId}" not found.`,
    )
  },

  async cancel(appointmentId: string): Promise<ClinicAppointment> {
    await delay()
    for (const childId of Object.keys(sessionAppointments)) {
      const appt = findById(childId, appointmentId)
      if (appt) {
        const cancelled: ClinicAppointment = {
          ...appt,
          status: "cancelled",
        }
        sessionAppointments[childId] = sessionAppointments[childId].map(
          (a) => (a.id === appointmentId ? cancelled : a),
        )
        return cancelled
      }
    }
    throw new AppError(
      "not_found",
      `Appointment "${appointmentId}" not found.`,
    )
  },

  async complete(appointmentId: string): Promise<ClinicAppointment> {
    await delay()
    for (const childId of Object.keys(sessionAppointments)) {
      const appt = findById(childId, appointmentId)
      if (appt) {
        const completed: ClinicAppointment = {
          ...appt,
          status: "completed",
        }
        sessionAppointments[childId] = sessionAppointments[childId].map(
          (a) => (a.id === appointmentId ? completed : a),
        )
        return completed
      }
    }
    throw new AppError(
      "not_found",
      `Appointment "${appointmentId}" not found.`,
    )
  },

  resetToDemo(): void {
    for (const key of Object.keys(sessionAppointments)) {
      delete sessionAppointments[key]
    }
    for (const [k, v] of Object.entries(MOCK_APPOINTMENTS)) {
      sessionAppointments[k] = [...v]
    }
  },
}

