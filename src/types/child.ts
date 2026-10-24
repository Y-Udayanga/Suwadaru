import type { ChildSex, IsoDate, Kilograms } from "./common"

export interface Child {
  id: string
  name: string
  /** ISO 8601 date-only (`YYYY-MM-DD`). Must not be in the future. */
  dateOfBirth: IsoDate
  /** Used to select a sex-specific growth reference. */
  sex: ChildSex
  /** Birth weight in kilograms. */
  birthWeightKg?: Kilograms
  clinicName?: string
}

export interface CreateChildInput {
  name: string
  dateOfBirth: IsoDate
  sex: ChildSex
  birthWeightKg?: Kilograms
  clinicName?: string
}

export interface UpdateChildInput {
  name?: string
  dateOfBirth?: IsoDate
  sex?: ChildSex
  birthWeightKg?: Kilograms
  clinicName?: string
}
