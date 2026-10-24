/**
 * Pure date-time and presentation helpers for Clinic Appointments.
 */

export function apptToIsoDateTime(date: string, time: string): string {
  // Combines date + time and appends Sri Lanka Standard Time offset (+05:30).
  const cleanTime = time.trim() || "09:00"
  return `${date}T${cleanTime}:00+05:30`
}

export function isoDateTimeToLocal(isoDateTime: string): { date: string; time: string } {
  try {
    const d = new Date(isoDateTime)
    if (isNaN(d.getTime())) {
      return { date: isoDateTime.slice(0, 10), time: "09:00" }
    }
    const date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" }) // YYYY-MM-DD
    const time = d.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    return { date, time }
  } catch {
    return { date: isoDateTime.slice(0, 10), time: "09:00" }
  }
}

export function formatAppointmentDateTime(isoDateTime: string): string {
  try {
    const d = new Date(isoDateTime)
    if (isNaN(d.getTime())) return isoDateTime
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d) + " (SLST, UTC+05:30)"
  } catch {
    return isoDateTime
  }
}
