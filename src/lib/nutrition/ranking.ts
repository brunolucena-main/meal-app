/**
 * "Best sources": rank foods by how much of what you need they supply.
 *
 * For each wanted nutrient, a food scores the share of the wanted amount it covers on the chosen
 * basis (capped at 100%, so one nutrient can't dominate). The score is the average over the
 * wanted nutrients. Per 100 kcal, foods that also spend your sodium, saturated fat or added
 * sugar budget faster than your energy budget lose points. A food missing any wanted nutrient
 * is left out rather than scored as zero.
 */
import type { NutrientKey } from "./nutrients"
import type { Targets } from "./targets"

export type Profile = Partial<Record<NutrientKey, number>>
export type RankBasis = "100kcal" | "100g"

const LIMITS: NutrientKey[] = ["sodium", "satFat", "addedSugars"]

export type RankResult = {
  score: number
  /** Share of the wanted amount covered, per wanted nutrient, on the basis (uncapped). */
  coverage: Partial<Record<NutrientKey, number>>
  /** Limit nutrients used faster than energy (per 100 kcal basis only). */
  flags: NutrientKey[]
}

export function rankFood(
  profile: Profile,
  wanted: Partial<Record<NutrientKey, number>>,
  basis: RankBasis,
  targets: Targets
): RankResult | null {
  const kcal = profile.energy
  let factor = 1
  if (basis === "100kcal") {
    if (kcal === undefined || kcal <= 0) return null
    factor = 100 / kcal
  }
  const keys = Object.keys(wanted) as NutrientKey[]
  if (keys.length === 0) return null

  const coverage: Partial<Record<NutrientKey, number>> = {}
  let total = 0
  for (const key of keys) {
    const amount = profile[key]
    const want = wanted[key]
    if (amount === undefined || !want) return null
    coverage[key] = (amount * factor) / want
    total += Math.min(coverage[key]!, 1)
  }
  let score = total / keys.length

  const flags: NutrientKey[] = []
  if (basis === "100kcal" && targets.energy) {
    const energyShare = 100 / targets.energy
    for (const key of LIMITS) {
      const amount = profile[key]
      const limit = targets[key]
      if (amount === undefined || !limit) continue
      const excess = (amount * factor) / limit - energyShare
      if (excess > energyShare) flags.push(key)
      if (excess > 0) score -= excess * 0.5
    }
  }
  return { score, coverage, flags }
}
