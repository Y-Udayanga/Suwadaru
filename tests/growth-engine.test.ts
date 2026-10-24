import assert from "node:assert/strict"
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import zlib from "node:zlib"
import { fileURLToPath } from "node:url"
import {
  assessWeightForAge,
  lmsZScore,
  officialWhoWeightForAgeDataset,
  weightForAgeReferenceCurve,
  WHO_WFA_PROVENANCE,
} from "../src/domain/health/growth/index.ts"
import type { WhoDayRow } from "../src/domain/health/growth/types.ts"

const dataset = officialWhoWeightForAgeDataset()
const dataDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/domain/health/growth/data/who",
)

function plusDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

function assess(overrides: Partial<Parameters<typeof assessWeightForAge>[0]> = {}) {
  if (!dataset) throw new Error("official dataset failed to load")
  return assessWeightForAge({
    sex: "male",
    dateOfBirth: "2024-01-01",
    measuredOn: "2024-01-01",
    today: "2026-01-01",
    weight: { value: 3.3464, unit: "kg" },
    dataset,
    ...overrides,
  })
}

function unzip(buffer: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>()
  let offset = 0
  while (offset + 30 < buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) break
    const method = buffer.readUInt16LE(offset + 8)
    const compressedSize = buffer.readUInt32LE(offset + 18)
    const nameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)
    const nameStart = offset + 30
    const name = buffer.toString("utf8", nameStart, nameStart + nameLength)
    const dataStart = nameStart + nameLength + extraLength
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize)
    files.set(name, method === 0 ? compressed : zlib.inflateRawSync(compressed))
    offset = dataStart + compressedSize
  }
  return files
}

function workbookRows(fileName: string): Array<Record<string, number>> {
  const bytes = fs.readFileSync(path.join(dataDir, fileName))
  const files = unzip(bytes)
  const sharedXml = files.get("xl/sharedStrings.xml")?.toString("utf8") ?? ""
  const sheetXml = files.get("xl/worksheets/sheet1.xml")?.toString("utf8") ?? ""
  const shared = [...sharedXml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((match) => match[1])
  const rows = [...sheetXml.matchAll(/<row[^>]*>(.*?)<\/row>/g)].map((row) =>
    [...row[1].matchAll(/<c [^>]*r="([A-Z]+)\d+"([^>]*)>(?:<v>([^<]*)<\/v>)?/g)].map(
      (cell) => ({
        shared: cell[2].includes('t="s"'),
        raw: cell[3] ?? "",
      }),
    ),
  )
  const header = rows[0].map((cell) => shared[Number(cell.raw)])
  return rows.slice(1).map((row) =>
    Object.fromEntries(header.map((name, index) => [name, Number(row[index]?.raw)])),
  )
}

describe("WHO weight-for-age engine", () => {
  it("loads both sex tables from the pinned WHO workbooks", () => {
    assert.ok(dataset)
    if (!dataset) return
    assert.equal(dataset.provenance.clinicallyApproved, false)
    assert.equal(dataset.provenance.endorsement, "none")
    assert.equal(dataset.provenance.interpolation, "none")
    assert.equal(dataset.provenance.ageUnit, "completed_days")
    assert.equal(dataset.male.rows.length, 1857)
    assert.equal(dataset.female.rows.length, 1857)
    assert.equal(dataset.male.rows[0]?.ageDays, 0)
    assert.equal(dataset.male.rows[1856]?.ageDays, 1856)

    for (const file of WHO_WFA_PROVENANCE.files) {
      const bytes = fs.readFileSync(path.join(dataDir, file.fileName))
      const hash = crypto.createHash("sha256").update(bytes).digest("hex")
      assert.equal(hash, file.sha256)
      const parsed = workbookRows(file.fileName)
      const table = file.sex === "male" ? dataset.male.rows : dataset.female.rows
      assert.equal(parsed.length, table.length)
      parsed.forEach((source, day) => {
        const row = table[day]
        assert.equal(source.Day, day)
        assert.equal(row?.l, source.L)
        assert.equal(row?.m, source.M)
        assert.equal(row?.s, source.S)
        assert.equal(row?.sdMinus2Kg, source.SD2neg)
        assert.equal(row?.sdMinus1Kg, source.SD1neg)
        assert.equal(row?.medianKg, source.SD0)
        assert.equal(row?.sdPlus1Kg, source.SD1)
        assert.equal(row?.sdPlus2Kg, source.SD2)
      })
    }
  })

  it("matches the published birth LMS values for boys and girls", () => {
    const boys = dataset?.male.rows[0]
    const girls = dataset?.female.rows[0]
    assert.equal(boys?.l, 0.3487)
    assert.equal(boys?.m, 3.3464)
    assert.equal(boys?.s, 0.14602)
    assert.equal(girls?.l, 0.3809)
    assert.equal(girls?.m, 3.2322)
    assert.equal(girls?.s, 0.14171)
  })

  it("reproduces the published SD columns with the LMS formula", () => {
    for (const row of [dataset?.male.rows[0], dataset?.female.rows[0], dataset?.male.rows[1856]]) {
      assert.ok(row)
      if (!row) continue
      const atMinus2 = lmsZScore(row.sdMinus2Kg, row.l, row.m, row.s)
      const atMedian = lmsZScore(row.medianKg, row.l, row.m, row.s)
      const atPlus2 = lmsZScore(row.sdPlus2Kg, row.l, row.m, row.s)
      assert.ok(atMinus2 !== null && Math.abs(atMinus2 + 2) < 0.01)
      assert.ok(atMedian !== null && Math.abs(atMedian) < 0.01)
      assert.ok(atPlus2 !== null && Math.abs(atPlus2 - 2) < 0.01)
      assert.equal(lmsZScore(row.m, row.l, row.m, row.s), 0)
    }
  })

  it("selects a different table for male and female infants", () => {
    const male = assess({ sex: "male", weight: { value: 3.3, unit: "kg" } })
    const female = assess({ sex: "female", weight: { value: 3.3, unit: "kg" } })
    assert.equal(male.interpretationAvailable, true)
    assert.equal(female.interpretationAvailable, true)
    assert.notEqual(male.objective?.zScore, female.objective?.zScore)
    assert.equal(male.objective?.m, 3.3464)
    assert.equal(female.objective?.m, 3.2322)
    assert.equal(male.interpretation.clinicalCategory, "not_assessed")
    assert.match(male.interpretation.professionalGuidance, /does not diagnose malnutrition, overweight/)
    assert.equal(male.objective === null, false)
    assert.notEqual(male.interpretation.message, String(male.objective?.zScore))
  })

  it("uses completed calendar days at birth and at the table edge", () => {
    const birth = assess()
    assert.equal(birth.objective?.ageDays, 0)
    assert.equal(birth.referenceAtAge?.sdMinus2Kg, dataset?.male.rows[0]?.sdMinus2Kg)

    const measuredOn = plusDays("2020-01-01", 1856)
    const edge = assess({
      dateOfBirth: "2020-01-01",
      measuredOn,
      today: measuredOn,
      weight: { value: dataset?.male.rows[1856]?.m ?? 0, unit: "kg" },
    })
    assert.equal(edge.interpretationAvailable, true)
    assert.equal(edge.objective?.ageDays, 1856)
    assert.equal(edge.objective?.zScore, 0)

    const past = assess({
      dateOfBirth: "2020-01-01",
      measuredOn: plusDays("2020-01-01", 1857),
      today: plusDays("2020-01-01", 1857),
    })
    assert.equal(past.interpretationAvailable, false)
    assert.equal(past.reason, "unsupported_age")
    assert.equal(past.objective, null)
  })

  it("counts a leap-day span in calendar days rather than 30-day months", () => {
    const result = assess({
      dateOfBirth: "2024-02-28",
      measuredOn: "2024-03-01",
      today: "2024-03-01",
    })
    assert.equal(result.objective?.ageDays, 2)
    const thirtyDays = assess({
      dateOfBirth: "2024-01-01",
      measuredOn: "2024-01-31",
      today: "2024-01-31",
    })
    assert.equal(thirtyDays.objective?.ageDays, 30)
    assert.notEqual(thirtyDays.objective?.l, dataset?.male.rows[0]?.l)
  })

  it("rejects dates before birth, future dates, and malformed dates", () => {
    assert.equal(
      assess({ measuredOn: "2023-12-31" }).reason,
      "measurement_before_birth",
    )
    assert.equal(
      assess({ measuredOn: "2026-01-02", today: "2026-01-01" }).reason,
      "measurement_in_future",
    )
    assert.equal(assess({ dateOfBirth: "2024-02-31" }).reason, "invalid_date")
  })

  it("rejects missing, non-positive, and non-kilogram weights without converting them", () => {
    assert.equal(assess({ weight: undefined }).reason, "measurement_missing_weight")
    for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(
        assess({ weight: { value, unit: "kg" } }).reason,
        "invalid_weight",
        String(value),
      )
    }
    const grams = assess({ weight: { value: 3346.4, unit: "g" } })
    const pounds = assess({ weight: { value: 7.4, unit: "lb" } })
    assert.equal(grams.reason, "invalid_unit")
    assert.equal(pounds.reason, "invalid_unit")
    assert.equal(grams.objective, null)
    assert.equal(pounds.objective, null)
  })

  it("returns no z-score when the source tables are missing or the curves are synthetic", () => {
    const missing = assessWeightForAge({
      sex: "female",
      dateOfBirth: "2024-01-01",
      measuredOn: "2024-01-01",
      today: "2024-01-01",
      weight: { value: 3.2, unit: "kg" },
      dataset: null,
    })
    assert.equal(missing.interpretationAvailable, false)
    assert.equal(missing.reason, "reference_dataset_missing")
    assert.equal(missing.objective, null)

    const synthetic = assess({ referenceKind: "synthetic_demo" })
    assert.equal(synthetic.interpretationAvailable, false)
    assert.equal(synthetic.reason, "synthetic_reference_cannot_be_scored")
    assert.equal(synthetic.objective, null)
  })

  it("exposes the published SD curves without adding days", () => {
    const curve = weightForAgeReferenceCurve({ dataset, sex: "female" })
    assert.equal(curve?.points.length, 1857)
    assert.equal(curve?.points[0]?.ageDays, 0)
    assert.equal(curve?.points[0]?.medianKg, dataset?.female.rows[0]?.medianKg)
    assert.equal(curve?.points[1856]?.sdPlus2Kg, dataset?.female.rows[1856]?.sdPlus2Kg)
    const ages = new Set(curve?.points.map((point) => point.ageDays))
    assert.equal(ages.size, 1857)
  })

  it("still calculates a finite z-score on the row whose L is closest to zero", () => {
    const closest = dataset?.male.rows.reduce<WhoDayRow | null>((best, row) => {
      if (!best || Math.abs(row.l) < Math.abs(best.l)) return row
      return best
    }, null)
    assert.ok(closest)
    if (!closest) return
    assert.notEqual(closest.l, 0)
    const result = assess({
      dateOfBirth: "2020-01-01",
      measuredOn: plusDays("2020-01-01", closest.ageDays),
      today: plusDays("2020-01-01", closest.ageDays),
      weight: { value: closest.sdMinus1Kg, unit: "kg" },
    })
    assert.equal(result.interpretationAvailable, true)
    assert.ok(result.objective && Math.abs(result.objective.zScore + 1) < 0.01)
  })
})
