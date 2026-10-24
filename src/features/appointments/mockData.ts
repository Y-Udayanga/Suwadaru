/**
 * Fictional appointment mock data for Frontend B health pages.
 *
 * All appointments are synthetic demo records. No real clinic details,
 * contact information, or personal data.
 *
 * INTEGRATION NOTE FOR FRONTEND A:
 *   When `appointmentService` from `@/services/contracts` is wired, replace
 *   the mock adapter in `./appointmentService.ts` with the real import.
 */

import type { ClinicAppointment } from "@/types"

// ---------------------------------------------------------------------------
// Fictional appointments — Nethmi (child_nethmi_demo).
// ---------------------------------------------------------------------------
export const NETHMI_APPOINTMENTS: ClinicAppointment[] = [
  {
    id: "appt_nethmi_01",
    childId: "child_nethmi_demo",
    scheduledAt: "2026-04-22T09:00:00+05:30",
    clinicName: "Sample Clinic, Colombo",
    purpose: "9-month growth review and MMR 1 vaccination",
    status: "completed",
  },
  {
    id: "appt_nethmi_02",
    childId: "child_nethmi_demo",
    scheduledAt: "2026-11-15T10:30:00+05:30",
    clinicName: "Sample Clinic, Colombo",
    purpose: "12-month review and Japanese Encephalitis vaccine",
    status: "scheduled",
  },
  {
    id: "appt_nethmi_03",
    childId: "child_nethmi_demo",
    scheduledAt: "2026-09-03T08:00:00+05:30",
    clinicName: "Sample Clinic, Colombo",
    purpose: "Weight check — parent concern",
    status: "cancelled",
  },
]

// ---------------------------------------------------------------------------
// Fictional appointments — Kavindu (child_kavindu_demo).
// ---------------------------------------------------------------------------
export const KAVINDU_APPOINTMENTS: ClinicAppointment[] = [
  {
    id: "appt_kavindu_01",
    childId: "child_kavindu_demo",
    scheduledAt: "2026-05-06T09:30:00+05:30",
    clinicName: "Sample Clinic, Colombo",
    purpose: "2-month immunisation (Pentavalent 1, OPV 1, fIPV 1)",
    status: "completed",
  },
  {
    id: "appt_kavindu_02",
    childId: "child_kavindu_demo",
    scheduledAt: "2026-11-30T11:00:00+05:30",
    clinicName: "Sample Clinic, Colombo",
    purpose: "9-month check and MMR 1",
    status: "scheduled",
  },
]

export const MOCK_APPOINTMENTS: Record<string, ClinicAppointment[]> = {
  child_nethmi_demo: NETHMI_APPOINTMENTS,
  child_kavindu_demo: KAVINDU_APPOINTMENTS,
}
