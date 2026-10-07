/**
 * Flavor guide for a recipe: links the recipe's foods to FlavorGraph ingredients and ranks what
 * to add next. Pure functions; the server feeds them the graph (src/server/flavor-guide.ts).
 */
import { variantKey } from "../nutrition/similarity"

/** "Blueberries" -> "blueberry", "Tomatoes" -> "tomato": enough to line up names. */
export function singular(word: string) {
  const w = word.toLowerCase().trim()
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`
  if (w.endsWith("oes") && w.length > 4) return w.slice(0, -2)
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1)
  return w
}

const normalize = (name: string) => name.toLowerCase().split(/\s+/).map(singular).join(" ")

/** USDA names that open with a category, so the second part is the food ("Fish, tuna"). */
const CATEGORY_HEADS = new Set([
  "alcoholic beverage", "beans", "beverages", "candies", "cereals", "crustaceans", "fish", "game meat",
  "mollusks", "nuts", "oil", "seeds", "spices",
])

/**
 * Names a food might go by in FlavorGraph, most specific first, from its USDA-style
 * description: "Oil, olive, salad or cooking" -> "olive oil", "olive", "oil";
 * "Yogurt, vanilla, low fat" -> "vanilla yogurt", "yogurt" (the food is yogurt, not vanilla).
 */
export function nameCandidates(description: string): string[] {
  const parts = description
    .split(",")
    .map((s) => s.replace(/\(.*?\)/g, "").trim())
    .filter(Boolean)
  const [first, second] = parts
  const out = !second ? [first] : CATEGORY_HEADS.has(first.toLowerCase()) ? [`${second} ${first}`, second, first] : [`${second} ${first}`, first]
  return out.map(normalize)
}

export type FlavorRef = { id: number; name: string; foodId: number | null }

/**
 * Finds the FlavorGraph ingredient for a food: the one matched to the same USDA food, else one
 * matched to another form of it ("Blueberries, frozen" -> the blueberry matched to "Blueberries,
 * raw"), else one with the same name. Null when FlavorGraph doesn't know the food.
 */
export function flavorMatcher(ingredients: FlavorRef[], describe: (foodId: number) => string | undefined) {
  const byFood = new Map<number, number>()
  const byVariant = new Map<string, number>()
  const byName = new Map<string, number>()
  for (const i of ingredients) {
    byName.set(normalize(i.name), byName.get(normalize(i.name)) ?? i.id)
    if (i.foodId === null) continue
    byFood.set(i.foodId, i.id)
    const description = describe(i.foodId)
    if (description && !byVariant.has(variantKey(description))) byVariant.set(variantKey(description), i.id)
  }
  return (food: { id: number; description: string }): number | null => {
    const direct = byFood.get(food.id) ?? byVariant.get(variantKey(food.description))
    if (direct !== undefined) return direct
    for (const name of nameCandidates(food.description)) {
      const hit = byName.get(name)
      if (hit !== undefined) return hit
    }
    return null
  }
}

type Together = (a: number, b: number) => number | undefined

export type Companion = { id: number; score: number; with: number[] }

/**
 * Ingredients that go with the recipe as a whole: the average cooked-together score with each
 * of the recipe's ingredients, so one that suits all of them beats one that suits a single one.
 * `with` lists the recipe ingredients it is often cooked with (score >= 0.1).
 */
export function rankCompanions(recipe: number[], candidates: number[], together: Together, limit = 10): Companion[] {
  if (!recipe.length) return []
  const out: Companion[] = []
  for (const c of candidates) {
    if (recipe.includes(c)) continue
    let sum = 0
    const withIds: number[] = []
    for (const r of recipe) {
      const s = together(r, c) ?? 0
      sum += s
      if (s >= 0.1) withIds.push(r)
    }
    if (withIds.length) out.push({ id: c, score: sum / recipe.length, with: withIds })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** How well a candidate fits the recipe: its average cooked-together score with the recipe's ingredients. */
export function fit(recipe: number[], candidate: number, together: Together) {
  if (!recipe.length) return 0
  return recipe.reduce((sum, r) => sum + (together(r, candidate) ?? 0), 0) / recipe.length
}

/** Pairs of the recipe's ingredients that recipes rarely combine (score below 0.05 or none). */
export function rarePairs(recipe: number[], together: Together): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i < recipe.length; i++) {
    for (let j = i + 1; j < recipe.length; j++) {
      if ((together(recipe[i], recipe[j]) ?? 0) < 0.05) out.push([recipe[i], recipe[j]])
    }
  }
  return out
}

/** The ingredient recipes combine most with both a and b (by the weaker of the two links). */
export function bestBridge(
  partnersOfA: Map<number, number>,
  partnersOfB: Map<number, number>,
  allowed: (id: number) => boolean
): { id: number; strength: number } | null {
  let best: { id: number; strength: number } | null = null
  for (const [z, withA] of partnersOfA) {
    const withB = partnersOfB.get(z)
    if (withB === undefined || !allowed(z)) continue
    const strength = Math.min(withA, withB)
    if (!best || strength > best.strength) best = { id: z, strength }
  }
  return best
}
