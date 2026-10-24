/**
 * Calendar date in ISO 8601 `YYYY-MM-DD` form.
 * No time and no timezone. Used for birthdays and measurement dates.
 * Age milestones use calendar-month arithmetic, not a 30-day multiplier.
 */
export type IsoDate = string

/**
 * Instant in ISO 8601 with an explicit UTC offset, for example
 * `2026-11-02T09:30:00+05:30`. Appointments use this so the scheduled
 * moment is unambiguous. Screens may display it in Asia/Colombo.
 * Do not store a local wall time without an offset.
 */
export type IsoDateTime = string

/** Sex category used only to select a WHO growth reference. */
export type ChildSex = "male" | "female"

/** Who entered a record. Verified is reserved for a future health-worker flow. */
export type RecordSource = "demo" | "parent_reported" | "health_worker_verified"

/**
 * Kilograms. Persist the number, never a formatted string such as "7.2 kg".
 */
export type Kilograms = number

/**
 * Centimetres. Persist the number, never a formatted string such as "68 cm".
 */
export type Centimetres = number
