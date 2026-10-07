import { variantKey } from "../nutrition/similarity"

/**
 * Recipe variants: copies of a recipe that differ in a few ingredients ("with top crust" and
 * "without", "blueberries" and "raspberries"). A family is the first recipe plus every variant
 * made from it (or from one of its variants).
 */

export type VariantItem = { foodId: number; name: string; grams: number }

export type IngredientDiff = {
  added: VariantItem[]
  removed: VariantItem[]
  /** Same food, different amount. */
  changed: { foodId: number; name: string; from: number; to: number }[]
}

/** Differences below this many grams are rounding, not a change. */
const GRAM_TOLERANCE = 0.5

function totals(items: VariantItem[]) {
  const out = new Map<number, VariantItem>()
  for (const i of items) {
    const prev = out.get(i.foodId)
    out.set(i.foodId, { ...i, grams: (prev?.grams ?? 0) + i.grams })
  }
  return out
}

/** What `other` changes relative to `base`, by food (repeated foods are summed). */
export function ingredientDiff(base: VariantItem[], other: VariantItem[]): IngredientDiff {
  const a = totals(base)
  const b = totals(other)
  const diff: IngredientDiff = { added: [], removed: [], changed: [] }
  for (const [id, item] of b) {
    const was = a.get(id)
    if (!was) diff.added.push(item)
    else if (Math.abs(was.grams - item.grams) > GRAM_TOLERANCE) diff.changed.push({ foodId: id, name: item.name, from: was.grams, to: item.grams })
  }
  for (const [id, item] of a) if (!b.has(id)) diff.removed.push(item)
  return diff
}

export const familyId = (r: { id: number; parentId: number | null }) => r.parentId ?? r.id

/**
 * Keeps families together: families in the order their most recent member appears, and within
 * a family the first recipe, then variants oldest first. Input order is "most recent first".
 */
export function groupFamilies<R extends { id: number; parentId: number | null }>(recipes: R[]): R[] {
  const families = new Map<number, R[]>()
  for (const r of recipes) {
    const list = families.get(familyId(r)) ?? []
    list.push(r)
    families.set(familyId(r), list)
  }
  return [...families.values()].flatMap((list) => list.sort((x, y) => (x.parentId === null ? -1 : y.parentId === null ? 1 : x.id - y.id)))
}

/** "Blueberries, raw" -> "Blueberries"; "Fish, tuna, light, canned" -> "Tuna". For compact lists. */
export function shortFoodName(description: string) {
  const parts = description.split(",").map((s) => s.trim())
  if (parts[1] && variantKey(description).includes(", ")) return parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
  return parts[0]
}
