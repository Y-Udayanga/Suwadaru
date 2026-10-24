import type { ChildSex } from "../../../types/common.ts"
import { wfaBoysTable, wfaGirlsTable } from "./data/who/wfa-tables.generated.ts"
import type { WhoDayRow, WhoSexTable, WhoWeightForAgeDataset } from "./types.ts"
import { WHO_WFA_PROVENANCE } from "./who-provenance.ts"

const EXPECTED_DAYS = WHO_WFA_PROVENANCE.ageMaxDays + 1

/**
 * Official weight-for-age tables extracted from the WHO expanded workbooks.
 * Returns null if a generated column is missing a day. It does not invent rows.
 */
export function officialWhoWeightForAgeDataset(): WhoWeightForAgeDataset | null {
  const male = sexTable("male", wfaBoysTable)
  const female = sexTable("female", wfaGirlsTable)
  if (!male || !female) return null
  return { provenance: WHO_WFA_PROVENANCE, male, female }
}

export function sexTableFor(
  dataset: WhoWeightForAgeDataset,
  sex: ChildSex,
): WhoSexTable {
  return sex === "male" ? dataset.male : dataset.female
}

export function rowAtExactDay(
  table: WhoSexTable,
  ageDays: number,
): WhoDayRow | null {
  if (!Number.isInteger(ageDays) || ageDays < 0 || ageDays > WHO_WFA_PROVENANCE.ageMaxDays) {
    return null
  }
  return table.rows[ageDays] ?? null
}

function sexTable(
  sex: ChildSex,
  columns: typeof wfaBoysTable,
): WhoSexTable | null {
  const length = columns.l.length
  const columnsMatch =
    columns.m.length === length &&
    columns.s.length === length &&
    columns.sdMinus2Kg.length === length &&
    columns.sdMinus1Kg.length === length &&
    columns.medianKg.length === length &&
    columns.sdPlus1Kg.length === length &&
    columns.sdPlus2Kg.length === length
  if (!columnsMatch || length !== EXPECTED_DAYS) return null
  const rows: WhoDayRow[] = []
  for (let ageDays = 0; ageDays < length; ageDays += 1) {
    rows.push({
      ageDays,
      l: columns.l[ageDays],
      m: columns.m[ageDays],
      s: columns.s[ageDays],
      sdMinus2Kg: columns.sdMinus2Kg[ageDays],
      sdMinus1Kg: columns.sdMinus1Kg[ageDays],
      medianKg: columns.medianKg[ageDays],
      sdPlus1Kg: columns.sdPlus1Kg[ageDays],
      sdPlus2Kg: columns.sdPlus2Kg[ageDays],
    })
  }
  return { sex, rows }
}
