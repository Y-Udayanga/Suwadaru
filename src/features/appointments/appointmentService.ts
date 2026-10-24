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

export const appointmentService: AppointmentService = {
  async list(childId) {
    await delay()
    return sessionAppointments[childId] ?? []
  },

  async create(input: CreateAppointmentInput) {
    await delay()
    if (!input.scheduledAt) {
      throw new AppError("validation", "Appointment date/time is required.")
    }
    if (!input.clinicName.trim()) {
      throw new AppError("validation", "Clinic name is required.")
    }
    const appointment: ClinicAppointment = {
      id: `appt_${input.childId}_${Date.now()}`,
      childId: input.childId,
      scheduledAt: input.scheduledAt,
      clinicName: input.clinicName,
      purpose: input.purpose,
      status: "scheduled",
    }
    const existing = sessionAppointments[input.childId] ?? []
    sessionAppointments[input.childId] = [...existing, appointment]
    return appointment
  },

  async update(appointmentId, input: UpdateAppointmentInput) {
    await delay()
    let found: ClinicAppointment | undefined
    for (const childId of Object.keys(sessionAppointments)) {
      const appt = findById(childId, appointmentId)
      if (appt) {
        found = appt
        const updated: ClinicAppointment = { ...appt, ...input }
        sessionAppointments[childId] = sessionAppointments[childId].map(
          (a) => (a.id === appointmentId ? updated : a),
        )
        return updated
      }
    }
    if (!found) {
      throw new AppError(
        "not_found",
        `Appointment "${appointmentId}" not found.`,
      )
    }
    throw new AppError("unavailable", "Unexpected error updating appointment.")
  },

  async cancel(appointmentId) {
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
}
