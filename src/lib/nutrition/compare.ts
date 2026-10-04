/**
 * Comparison engine: lines foods up nutrient by nutrient on a common basis.
 *
 * Profiles are per 100 g (as stored). A basis turns each profile into the amounts you'd compare:
 *   - "100g":    as stored
 *   - "100kcal": scaled so every food supplies 100 kcal (needs an energy value above zero)
 *   - "serving": scaled to each food's own serving weight in grams
 *
 * Missing values stay missing: they never count as zero, never win, and are reported as gaps.
 */
import { NUTRIENTS, type NutrientDef, type NutrientKey } from "./nutrients"

export type Profile = Partial<Record<NutrientKey, number>>
export type Basis = "100g" | "100kcal" | "serving"

export type CompareInput = {
  /** Per 100 g. */
  profile: Profile
  /** Grams in one serving; only used by the "serving" basis. */
  servingGrams?: number
}

/** Multiplier from per-100 g to the basis, or null when the basis can't apply to this food. */
export function basisFactor(input: CompareInput, basis: Basis): number | null {
  switch (basis) {
    case "100g":
      return 1
    case "100kcal": {
      const kcal = input.profile.energy
      return kcal !== undefined && kcal > 0 ? 100 / kcal : null
    }
    case "serving":
      return input.servingGrams !== undefined && input.servingGrams > 0 ? input.servingGrams / 100 : null
  }
}

export type CompareRow = {
  nutrient: NutrientDef
  /** One per food, on the chosen basis; null = no data (or the basis doesn't apply). */
  values: (number | null)[]
  /** Share of the Daily Value (or personal target), in percent; null without a value or DV. */
  pctDv: (number | null)[]
  /** Index of the best value: highest for goals, lowest for limits; null for info rows or ties. */
  best: number | null
}

export type Comparison = {
  basis: Basis
  factors: (number | null)[]
  rows: CompareRow[]
}

/** Best value among the known ones. Needs at least two values to call a winner; ties have none. */
export function bestIndex(kind: NutrientDef["kind"], values: (number | null)[]): number | null {
  if (kind === "info") return null
  const known = values.flatMap((v, i) => (v === null ? [] : [{ v, i }]))
  if (known.length < 2) return null
  known.sort((a, b) => (kind === "goal" ? b.v - a.v : a.v - b.v))
  // Treat values within 0.5% of each other as a tie, so rounding noise doesn't pick winners.
  const [first, second] = known
  return Math.abs(first.v - second.v) <= Math.abs(first.v) * 0.005 ? null : first.i
}

export function compareFoods(
  inputs: CompareInput[],
  basis: Basis,
  nutrients: readonly NutrientDef[] = NUTRIENTS,
  targets: Partial<Record<NutrientKey, number>> = {}
): Comparison {
  const factors = inputs.map((input) => basisFactor(input, basis))
  const rows = nutrients.map((nutrient) => {
    const values = inputs.map((input, i) => {
      const raw = input.profile[nutrient.key as NutrientKey]
      const factor = factors[i]
      return raw === undefined || factor === null ? null : raw * factor
    })
    const target = targets[nutrient.key as NutrientKey] ?? nutrient.dv
    const pctDv = values.map((v) => (v === null || !target ? null : (v / target) * 100))
    return { nutrient, values, pctDv, best: bestIndex(nutrient.kind, values) }
  })
  return { basis, factors, rows }
}

export type Standout = {
  nutrient: NutrientDef
  /** Best value divided by the runner-up; Infinity when the runner-up is zero. */
  ratio: number
}

/**
 * For each food, the nutrients where it clearly leads: it has the best value, at least `minRatio`
 * times the runner-up, and at least `minPctDv` of the Daily Value (so "4x the copper" doesn't
 * count when both amounts are trivial). Goal nutrients only.
 */
export function standouts(comparison: Comparison, perFood = 3, minRatio = 1.5, minPctDv = 5): Standout[][] {
  const out: Standout[][] = comparison.factors.map(() => [])
  for (const row of comparison.rows) {
    if (row.best === null || row.nutrient.kind !== "goal") continue
    const best = row.values[row.best]
    const pct = row.pctDv[row.best]
    if (best === null || pct === null || pct < minPctDv) continue
    const runnerUp = Math.max(...row.values.filter((v, i): v is number => i !== row.best && v !== null))
    const ratio = runnerUp === 0 ? Infinity : best / runnerUp
    if (ratio >= minRatio) out[row.best].push({ nutrient: row.nutrient, ratio })
  }
  return out.map((list) => list.sort((x, y) => y.ratio - x.ratio).slice(0, perFood))
}

/** Wins per food over the goal and limit nutrients where every food has data. */
export function winCounts(comparison: Comparison): { wins: number[]; contested: number } {
  const wins = comparison.factors.map(() => 0)
  let contested = 0
  for (const row of comparison.rows) {
    if (row.nutrient.kind === "info" || row.values.some((v) => v === null)) continue
    contested++
    if (row.best !== null) wins[row.best]++
  }
  return { wins, contested }
}
