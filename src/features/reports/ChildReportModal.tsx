import { useEffect, useState } from "react"
import { Printer, X, FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import type { Child, ClinicAppointment, GrowthMeasurement, VaccinationMilestone, VaccinationRecord } from "@/types"
import { resolveChild, ageInMonths, formatAge } from "@/features/childResolver"
import { vaccinationService } from "@/features/vaccinations/vaccinationService"
import { growthService } from "@/features/growth/growthService"
import { appointmentService } from "@/features/appointments/appointmentService"
import { useLanguage } from "@/hooks/useLanguage"
import { formatAppointmentDateTime } from "@/features/appointments/appointmentHelpers"

interface ChildReportModalProps {
  childId: string
  isOpen: boolean
  onClose: () => void
}

export function ChildReportModal({ childId, isOpen, onClose }: ChildReportModalProps) {
  const { language, t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [child, setChild] = useState<Child | null>(null)
  const [milestones, setMilestones] = useState<VaccinationMilestone[]>([])
  const [vaccineRecords, setVaccineRecords] = useState<VaccinationRecord[]>([])
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([])
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [generatedDate] = useState(() => new Date().toISOString().split("T")[0])

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    async function loadAllData() {
      setLoading(true)
      setError(null)
      try {
        const [resolvedChild, scheduleData, recordsData, growthData, apptData] =
          await Promise.all([
            resolveChild(childId),
            vaccinationService.getSchedule(childId),
            vaccinationService.getRecords(childId),
            growthService.list(childId),
            appointmentService.list(childId),
          ])

        if (!cancelled) {
          setChild(resolvedChild)
          setMilestones(Array.isArray(scheduleData) ? scheduleData : [])
          setVaccineRecords(recordsData)
          setMeasurements(growthData)
          setAppointments(apptData)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load records for report generation.")
          setLoading(false)
        }
      }
    }

    loadAllData()

    return () => {
      cancelled = true
    }
  }, [childId, isOpen])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const ageMonthsCount = child ? ageInMonths(child.dateOfBirth) : 0
  const isSinhala = language === "si"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Action Bar (Hidden when printed) */}
        <div className="no-print flex items-center justify-between border-b border-border/80 bg-muted/30 px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
            <FileText className="size-4.5 text-primary" aria-hidden />
            <span id="report-modal-title">
              {isSinhala
                ? "ඩිජිටල් CHDR සෞඛ්‍ය සාරාංශ වාර්තාව"
                : "Digital CHDR Health Summary Report"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !!error}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 cursor-pointer shadow-xs transition-all"
            >
              <Printer className="size-3.5" aria-hidden />
              <span>{isSinhala ? "මුද්‍රණය / PDF සුරකින්න" : "Print / Save PDF"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer transition-colors"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-background/50">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm font-medium">{t("common.loading")}</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive text-sm flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && child && (
            <div id="printable-chdr-report" className="printable-report flex flex-col gap-6 text-foreground">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-primary/80 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl sm:text-2xl text-primary tracking-tight">
                      SuwaDaru • සුවදරු
                    </span>
                    <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary uppercase">
                      CHDR Companion
                    </span>
                  </div>
                  <h1 className="text-base sm:text-lg font-bold text-foreground mt-1">
                    {isSinhala
                      ? "ළමා සෞඛ්‍ය සංවර්ධන වාර්තා සාරාංශය"
                      : "Child Health & Development Record Summary"}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {isSinhala
                      ? "ශ්‍රී ලංකා ළමා සෞඛ්‍ය සංවර්ධන වාර්තාවේ (CHDR) ඩිජිටල් සහකාර සටහන"
                      : "Official Companion to Sri Lanka Child Health Development Record (CHDR)"}
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs text-muted-foreground flex flex-col gap-0.5">
                  <p>
                    <strong>{isSinhala ? "වාර්තා දිනය" : "Generated Date"}:</strong>{" "}
                    {generatedDate}
                  </p>
                  <p>
                    <strong>{isSinhala ? "වාර්තා අංකය" : "Report ID"}:</strong>{" "}
                    CHDR-{child.id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
                    ✓ Verified Digital Export
                  </p>
                </div>
              </div>

              {/* Child Demographics Card */}
              <div className="rounded-xl border border-border bg-card/90 p-4 sm:p-5 flex flex-col gap-3 shadow-2xs">
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-2">
                  {isSinhala ? "1. දරුවාගේ මූලික විස්තර (Child Identification)" : "1. Child Identification & Demographics"}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                  <div>
                    <span className="text-muted-foreground block">{isSinhala ? "දරුවාගේ නම" : "Child Name"}:</span>
                    <strong className="text-sm text-foreground">{child.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{isSinhala ? "උපන් දිනය" : "Date of Birth"}:</span>
                    <strong className="text-foreground">{child.dateOfBirth}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{isSinhala ? "වත්මන් වයස" : "Current Age"}:</span>
                    <strong className="text-foreground">{formatAge(ageMonthsCount)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{isSinhala ? "ස්ත්‍රී / පුරුෂ" : "Sex"}:</span>
                    <strong className="text-foreground capitalize">{child.sex}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{isSinhala ? "උපත් බර" : "Birth Weight"}:</span>
                    <strong className="text-foreground">{child.birthWeightKg ? `${child.birthWeightKg} kg` : "Not recorded"}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">{isSinhala ? "ලියාපදිංචි සායනය" : "Registered Health Clinic"}:</span>
                    <strong className="text-foreground">{child.clinicName || "Primary MOH Clinic"}</strong>
                  </div>
                </div>
              </div>

              {/* Immunization Milestones Table */}
              <div className="flex flex-col gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                  {isSinhala
                    ? "2. ජාතික ප්‍රතිශක්තිකරණ එන්නත් සටහන් (National EPI Schedule)"
                    : "2. National Immunization Milestones & Records (EPI)"}
                </h2>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/60 text-foreground font-semibold">
                      <tr>
                        <th className="p-2.5 border-b border-border">{isSinhala ? "වයස" : "Milestone Age"}</th>
                        <th className="p-2.5 border-b border-border">{isSinhala ? "එන්නත" : "Vaccine Name"}</th>
                        <th className="p-2.5 border-b border-border">{isSinhala ? "නියමිත දිනය" : "Due Date"}</th>
                        <th className="p-2.5 border-b border-border">{isSinhala ? "ලබාදුන් දිනය" : "Administered"}</th>
                        <th className="p-2.5 border-b border-border">{isSinhala ? "තත්වය" : "Status & Source"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {milestones.map((m) => {
                        const rec = vaccineRecords.find((r) => r.vaccineCode === m.vaccineCode)
                        const isGiven = !!rec?.administeredOn

                        return (
                          <tr key={m.id} className="hover:bg-muted/30">
                            <td className="p-2.5 font-medium">
                              {m.birthWindow ? (isSinhala ? "උපතේදී" : "At Birth") : `${m.ageMonths} ${isSinhala ? "මාස" : "months"}`}
                            </td>
                            <td className="p-2.5 font-semibold text-foreground">
                              {m.vaccineName} ({m.vaccineCode})
                            </td>
                            <td className="p-2.5 text-muted-foreground">{m.dueDate}</td>
                            <td className="p-2.5">
                              {isGiven ? (
                                <span className="font-semibold text-green-700 dark:text-green-400">
                                  {rec.administeredOn}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">{isSinhala ? "ලබාදී නැත" : "Pending"}</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {isGiven ? (
                                <span className="inline-flex items-center gap-1 rounded bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 px-2 py-0.5 text-[11px] font-semibold">
                                  <CheckCircle2 className="size-3" />
                                  {isSinhala ? "දෙමාපියන් සටහන් කළ" : "Parent reported"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-muted text-muted-foreground px-2 py-0.5 text-[11px]">
                                  <Clock className="size-3" />
                                  {isSinhala ? "ඉදිරියට නියමිත" : "Scheduled"}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Growth Measurements Table */}
              <div className="flex flex-col gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                  {isSinhala
                    ? "3. ළමා වර්ධන මිනුම් ඉතිහාසය (Growth Measurements History)"
                    : "3. Growth Monitoring History (Weight, Height, Head Circumference)"}
                </h2>
                {measurements.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border">
                    {isSinhala ? "වර්ධන මිනුම් සටහන් කර නැත." : "No growth measurements recorded yet."}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/60 text-foreground font-semibold">
                        <tr>
                          <th className="p-2.5 border-b border-border">{isSinhala ? "දිනය" : "Date Recorded"}</th>
                          <th className="p-2.5 border-b border-border">{isSinhala ? "බර (kg)" : "Weight (kg)"}</th>
                          <th className="p-2.5 border-b border-border">{isSinhala ? "උස (cm)" : "Height / Length (cm)"}</th>
                          <th className="p-2.5 border-b border-border">{isSinhala ? "හිසේ වටප්‍රමාණය (cm)" : "Head Circ. (cm)"}</th>
                          <th className="p-2.5 border-b border-border">{isSinhala ? "මූලාශ්‍රය" : "Source"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {measurements.map((g) => (
                          <tr key={g.id} className="hover:bg-muted/30">
                            <td className="p-2.5 font-medium">{g.measuredOn}</td>
                            <td className="p-2.5 font-bold text-foreground">{g.weightKg ? `${g.weightKg} kg` : "—"}</td>
                            <td className="p-2.5">{g.lengthHeightCm ? `${g.lengthHeightCm} cm` : "—"}</td>
                            <td className="p-2.5">{g.headCircumferenceCm ? `${g.headCircumferenceCm} cm` : "—"}</td>
                            <td className="p-2.5 capitalize text-muted-foreground">{g.source.replace("_", " ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Clinic Appointments Table */}
              <div className="flex flex-col gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                  {isSinhala ? "4. සායන හමුවීම් සටහන් (Clinic Appointments)" : "4. Clinic Appointments & Consultations"}
                </h2>
                {appointments.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border">
                    {isSinhala ? "සායන හමුවීම් සටහන් කර නැත." : "No clinic visits recorded."}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/60 text-foreground font-semibold">
                        <tr>
                          <th className="p-2.5 border-b border-border">{isSinhala ? "නියමිත දිනය සහ වේලාව" : "Scheduled Date & Time"}</th>
                          <th className="p-2.5 border-b border-border">{isSinhala ? "සායනය" : "Healthcare Facility"}</th>
                          <th className="p-2.5 border-b border-border">{isSinhala ? "අරමුණ" : "Visit Purpose"}</th>
                          <th className="p-2.5 border-b border-border">{isSinhala ? "තත්වය" : "Status"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {appointments.map((a) => (
                          <tr key={a.id} className="hover:bg-muted/30">
                            <td className="p-2.5 font-medium">{formatAppointmentDateTime(a.scheduledAt)}</td>
                            <td className="p-2.5 font-semibold text-foreground">{a.clinicName}</td>
                            <td className="p-2.5 text-muted-foreground">{a.purpose || "General pediatric checkup"}</td>
                            <td className="p-2.5 capitalize">
                              <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold">
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Disclaimer & Advisory */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-950 flex flex-col gap-1.5 leading-relaxed">
                <p className="font-bold">
                  ⚠️ {isSinhala ? "වැදගත් වෛද්‍ය සහ නීතිමය උපදේශය" : "Clinical & Legal Boundary Advisory"}:
                </p>
                <p>
                  {isSinhala
                    ? "මෙම සාරාංශ වාර්තාව දෙමාපියන්ගේ පහසුව සඳහා සකස් කරන ලද නිල නොවන ඩිජිටල් සටහනකි. සෞඛ්‍ය අමාත්‍යාංශය මඟින් නිකුත් කර ඇති නිල කහ පැහැති ළමා සෞඛ්‍ය සංවර්ධන වාර්තාව (CHDR) හෝ පවුල් සෞඛ්‍ය සේවා නිලධාරිනියගේ (PHM) / වෛද්‍යවරයාගේ සෘජු උපදෙස් වෙනුවට මෙය භාවිත කළ නොහැක."
                    : "This digital summary is an unofficial companion record for caregiver convenience. It does not replace the physical Child Health Development Record (CHDR) issued by the Ministry of Health, Sri Lanka. Always verify all immunization doses and growth trends directly with your Public Health Midwife (PHM) or Medical Officer of Health (MOH)."}
                </p>
              </div>

              {/* Sign-off section */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border/80 text-xs text-muted-foreground">
                <div>
                  <p className="mb-8">{isSinhala ? "දෙමාපිය / භාරකරු අත්සන:" : "Parent / Caregiver Signature:"}</p>
                  <div className="border-t border-dashed border-foreground/40 w-48" />
                </div>
                <div>
                  <p className="mb-8">{isSinhala ? "වෛද්‍ය නිලධාරී / PHM අත්සන සහ නිල මුද්‍රාව:" : "Medical Officer / PHM Signature & Stamp:"}</p>
                  <div className="border-t border-dashed border-foreground/40 w-48" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
