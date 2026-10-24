import type { GrowthMeasurement, GrowthReferenceSeries } from "../../types/growth.ts"
import type { ChildSex } from "../../types/common.ts"
import { officialWhoWeightForAgeDataset, weightForAgeReferenceCurve } from "../../domain/health/growth/index.ts"

const DAY = 86_400_000

// Position dates within calendar months without collapsing separate observations.
export function chartAgeMonths(dateOfBirth: string, measuredOn: string): number {
  const birth = new Date(`${dateOfBirth}T00:00:00Z`)
  const measured = new Date(`${measuredOn}T00:00:00Z`).getTime()
  const anniversary = (months: number) => {
    const first = new Date(Date.UTC(birth.getUTCFullYear(), birth.getUTCMonth() + months, 1))
    const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
    return Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(birth.getUTCDate(), lastDay))
  }
  const date = new Date(measured)
  let months = (date.getUTCFullYear() - birth.getUTCFullYear()) * 12 + date.getUTCMonth() - birth.getUTCMonth()
  if (measured < anniversary(months)) months--
  return months + (measured - anniversary(months)) / (anniversary(months + 1) - anniversary(months))
}

export function resolveChartReference(
  child: { dateOfBirth: string; sex: ChildSex },
  reference: GrowthReferenceSeries,
): GrowthReferenceSeries {
  if (reference.points.length) return reference
  const curve = weightForAgeReferenceCurve({ sex: child.sex, dataset: officialWhoWeightForAgeDataset() })
  if (!curve) return reference
  const birth = new Date(`${child.dateOfBirth}T00:00:00Z`).getTime()
  return {
    ...reference,
    provenance: "who",
    sourceLabel: curve.provenance.sourceTitle,
    sourceVersion: "Expanded daily tables · 2026-10-24",
    points: curve.points.map(({ ageDays, ...weights }) => ({
      ...weights,
      ageMonths: chartAgeMonths(child.dateOfBirth, new Date(birth + ageDays * DAY).toISOString().slice(0, 10)),
    })).filter(point => point.ageMonths <= 60),
  }
}

export function buildChartData(dateOfBirth: string, measurements: GrowthMeasurement[], reference: GrowthReferenceSeries) {
  const references = reference.points.map(ref => ({
    ageMonths: ref.ageMonths,
    sdMinus2: ref.sdMinus2Kg,
    sdMinus1: ref.sdMinus1Kg,
    median: ref.medianKg,
    sdPlus1: ref.sdPlus1Kg,
    sdPlus2: ref.sdPlus2Kg,
  }))
  const observations = measurements
    .filter(m => m.weightKg != null && Number.isFinite(m.weightKg) && m.weightKg > 0)
    .map(m => ({ ageMonths: chartAgeMonths(dateOfBirth, m.measuredOn), measuredOn: m.measuredOn, weight: m.weightKg }))
  return [...references, ...observations].sort((a, b) => a.ageMonths - b.ageMonths)
}
