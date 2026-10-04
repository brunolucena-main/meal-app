import type { FoodGroup } from "@/lib/food/types"
import type { NutrientKey } from "@/lib/nutrition/nutrients"
import { libsql } from "@/server/db/client"
import type { FoodSource } from "@/server/foods"

/** Every food with its full profile, for whole-catalog scans (substitutes, best sources). */
export type CatalogFood = {
  id: number
  description: string
  source: FoodSource
  category: string | null
  group: FoodGroup
  color: string
  allergens: string[]
  profile: Partial<Record<NutrientKey, number>>
}

const cache = globalThis as unknown as { catalog?: Promise<CatalogFood[]> }

async function load(): Promise<CatalogFood[]> {
  const [foods, nutrients] = await libsql.batch(
    [
      "SELECT id, description, source, category, food_group, color, allergens FROM foods",
      "SELECT food_id, nutrient, amount FROM food_nutrients",
    ],
    "read"
  )
  const byId = new Map<number, CatalogFood>()
  for (const r of foods.rows) {
    byId.set(Number(r.id), {
      id: Number(r.id),
      description: String(r.description),
      source: r.source as FoodSource,
      category: (r.category as string | null) ?? null,
      group: r.food_group as FoodGroup,
      color: String(r.color),
      allergens: r.allergens ? String(r.allergens).split(",") : [],
      profile: {},
    })
  }
  for (const r of nutrients.rows) {
    const food = byId.get(Number(r.food_id))
    if (food) food.profile[r.nutrient as NutrientKey] = Number(r.amount)
  }
  return [...byId.values()]
}

/** Loaded once per server process (about 8,000 foods); re-run the import and restart to refresh. */
export function getCatalog(): Promise<CatalogFood[]> {
  cache.catalog ??= load()
  return cache.catalog
}
