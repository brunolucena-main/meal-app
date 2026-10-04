/**
 * Recipe nutrition: sums ingredient profiles (per 100 g) by weight.
 *
 * When an ingredient has no value for a nutrient, the total is a lower bound, not the truth.
 * Those nutrients are reported as partial, with the ingredients that lack data, instead of
 * pretending the missing amount is zero.
 */
import { NUTRIENTS, type NutrientKey } from "./nutrients"

export type Profile = Partial<Record<NutrientKey, number>>

export type RecipeIngredient = { foodId: number; name: string; grams: number; profile: Profile }

export type RecipeNutrition = {
  totalGrams: number
  /** Whole recipe. */
  totals: Profile
  /** Nutrients where some ingredient has no data: the total is a minimum. Value: ingredient names. */
  partial: Partial<Record<NutrientKey, string[]>>
}

export function recipeNutrition(ingredients: RecipeIngredient[]): RecipeNutrition {
  const totals: Profile = {}
  const partial: Partial<Record<NutrientKey, string[]>> = {}
  const totalGrams = ingredients.reduce((sum, i) => sum + i.grams, 0)
  for (const n of NUTRIENTS) {
    let sum = 0
    let any = false
    const missing: string[] = []
    for (const ing of ingredients) {
      if (ing.grams <= 0) continue
      const per100 = ing.profile[n.key]
      if (per100 === undefined) {
        missing.push(ing.name)
        continue
      }
      sum += (per100 * ing.grams) / 100
      any = true
    }
    if (any) totals[n.key] = sum
    if (any && missing.length) partial[n.key] = missing
  }
  return { totalGrams, totals, partial }
}

/** Scales a whole-recipe profile to one serving. */
export function perServing(totals: Profile, servings: number): Profile {
  const out: Profile = {}
  const s = servings > 0 ? servings : 1
  for (const [k, v] of Object.entries(totals)) out[k as NutrientKey] = v / s
  return out
}

/**
 * Per 100 g of the finished dish. `cookedGrams` is the weight after cooking (water lost or
 * absorbed); without it, the raw ingredient weight is used.
 */
export function per100g(totals: Profile, totalGrams: number, cookedGrams?: number): Profile {
  const weight = cookedGrams && cookedGrams > 0 ? cookedGrams : totalGrams
  const out: Profile = {}
  if (weight <= 0) return out
  for (const [k, v] of Object.entries(totals)) out[k as NutrientKey] = (v / weight) * 100
  return out
}
