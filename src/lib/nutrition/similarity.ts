/**
 * Nutritional similarity, for "what can I use instead of X?".
 *
 * Each food becomes a vector of its nutrients per 100 g, each expressed as a share of the daily
 * target (so mg and µg are comparable and matter in proportion to what you need), then
 * log-compressed so one huge value (vitamin K in greens) can't drown out everything else.
 * Similarity is exp(-distance): 1 for identical profiles, falling toward 0. Distance is a
 * weighted RMS over the nutrients both foods report, and the score is discounted by how much of
 * the original's profile the candidate covers. Missing values are skipped, never treated as zero.
 *
 * Foods copied from a label often report only 5-8 nutrients, so the bar for "enough shared
 * nutrients" is 8 or everything the original reports, whichever is lower (but at least 4).
 */
import { NUTRIENT_BY_KEY, type NutrientKey } from "./nutrients"
import type { Targets } from "./targets"

export type Profile = Partial<Record<NutrientKey, number>>

/** Nutrients that describe a food, with weights. Energy and macros set its basic character. */
export const SIMILARITY_FEATURES: [NutrientKey, number][] = [
  ["energy", 3],
  ["protein", 2],
  ["carbs", 2],
  ["fat", 2],
  ["fiber", 1.5],
  ["sugars", 1.5],
  ["satFat", 1],
  ["sodium", 1],
  ["potassium", 1],
  ["calcium", 1],
  ["iron", 1],
  ["magnesium", 1],
  ["phosphorus", 1],
  ["zinc", 1],
  ["vitA", 1],
  ["vitC", 1],
  ["vitE", 1],
  ["vitK", 1],
  ["folate", 1],
  ["vitB6", 1],
  ["vitB12", 1],
  ["thiamin", 1],
  ["riboflavin", 1],
  ["niacin", 1],
]

/** Scale for nutrients without a target (sugars has no Daily Value). */
const FALLBACK_SCALE: Partial<Record<NutrientKey, number>> = { sugars: 50 }

export const MIN_SHARED_FEATURES = 8
/** Below this many scored nutrients a food can't be compared at all. */
export const MIN_FEATURES = 4

export type Vector = Map<NutrientKey, number>

export function toVector(profile: Profile, targets: Targets): Vector {
  const v: Vector = new Map()
  for (const [key] of SIMILARITY_FEATURES) {
    const amount = profile[key]
    const scale = targets[key] ?? NUTRIENT_BY_KEY[key].dv ?? FALLBACK_SCALE[key]
    if (amount === undefined || !scale) continue
    v.set(key, Math.log1p((amount / scale) * 10))
  }
  return v
}

/** Whether a food reports enough scored nutrients to look for foods like it. */
export const comparable = (v: Vector) => v.size >= MIN_FEATURES

/**
 * 0-1, 1 = same profile, for `b` as a stand-in for `a` (the original). Null when they share
 * too few reported nutrients to judge. Symmetric when both report the same nutrients.
 */
export function similarity(a: Vector, b: Vector): number | null {
  let sum = 0
  let weights = 0
  let shared = 0
  for (const [key, weight] of SIMILARITY_FEATURES) {
    const x = a.get(key)
    const y = b.get(key)
    if (x === undefined || y === undefined) continue
    sum += weight * (x - y) ** 2
    weights += weight
    shared++
  }
  if (!comparable(a) || shared < Math.min(MIN_SHARED_FEATURES, a.size)) return null
  return Math.exp(-Math.sqrt(sum / weights)) * Math.sqrt(shared / a.size)
}

/** USDA names that open with a category ("Fish, salmon, ...") need two parts to name the food. */
const GENERIC_HEADS = new Set([
  "alcoholic beverage", "babyfood", "beans", "beef", "beverages", "bread", "candies", "cereals",
  "cheese", "chicken", "cookies", "crackers", "crustaceans", "egg", "fast foods", "fish",
  "game meat", "lamb", "milk", "mollusks", "nuts", "oil", "pork", "restaurant", "sauce", "seeds",
  "snacks", "soup", "spices", "turkey", "veal", "yogurt",
])

/** Key shared by variants of one food ("Spinach, raw" and "Spinach, cooked, boiled"). */
export function variantKey(description: string): string {
  const parts = description.toLowerCase().split(",").map((s) => s.trim())
  return GENERIC_HEADS.has(parts[0]) && parts[1] ? `${parts[0]}, ${parts[1]}` : parts[0]
}
