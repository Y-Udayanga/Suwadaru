/**
 * Caregiver health records.
 * Pass the browser client from `src/utils/supabase.ts` (publishable key and
 * the signed-in JWT). These functions do not create a service-role client.
 */
export {
  addVaccinationRecord,
  getVaccinationRecords,
  getVaccineSchedule,
  updateVaccinationRecord,
} from "./vaccinations.ts"
export {
  addGrowthMeasurement,
  getGrowthAssessment,
  getGrowthMeasurements,
} from "./growth.ts"
export {
  cancelClinicAppointment,
  completeClinicAppointment,
  createClinicAppointment,
  getClinicAppointments,
  getOverdueClinicAppointments,
  getUpcomingClinicAppointments,
  listAppointmentReminderPreviews,
  updateClinicAppointment,
} from "./appointments.ts"
export {
  appointmentTimingLabel,
  buildReminderPreview,
  type AppointmentReminderPreview,
  type AppointmentTimingLabel,
} from "./reminders.ts"
export {
  askNutritionAssistant,
  type NutritionAssistantReply,
  type NutritionSafetyCategory,
} from "./nutrition.ts"
export {
  createCaregiverChild,
  getCaregiverChild,
  listCaregiverChildren,
  updateCaregiverChild,
} from "./children.ts"
export { hasCaregiverSession, isPersistedChildId, requireCaregiverSession } from "./session.ts"
