/**
 * LMS z-score used by the WHO Child Growth Standards tables.
 *
 * For L ≠ 0: z = ((weight / M)^L − 1) / (L × S)
 * For L = 0: z = ln(weight / M) / S
 *
 * This module does not interpolate L, M, or S between ages.
 * Callers must pass the parameters from the exact completed-day row.
 */
export function lmsZScore(
  weightKg: number,
  l: number,
  m: number,
  s: number,
): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null
  if (!Number.isFinite(l) || !Number.isFinite(m) || !Number.isFinite(s)) return null
  if (m <= 0 || s === 0) return null
  const zScore = l === 0
    ? Math.log(weightKg / m) / s
    : (Math.pow(weightKg / m, l) - 1) / (l * s)
  if (!Number.isFinite(zScore)) return null
  return zScore === 0 ? 0 : zScore
}
