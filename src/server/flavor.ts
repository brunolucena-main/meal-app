import { tagAllergens } from "@/lib/food/allergens"
import type { FoodGroup } from "@/lib/food/types"
import { AROMA_EXCLUDED_CATEGORIES, aromaOverlap, categoryLook } from "@/lib/flavor/pairing"
import { getCatalog } from "@/server/catalog"
import { libsql } from "@/server/db/client"

/** A FlavorGraph ingredient, with chip look from its USDA match (or its category). */
export type FlavorIngredient = {
  id: number
  name: string
  category: string | null
  compoundCount: number
  /** True when the aroma profile is a generic placeholder (see the import script). */
  genericAroma: boolean
  foodId: number | null
  color: string
  group: FoodGroup
  allergens: string[]
}

export type Pairing = FlavorIngredient & {
  /** Shared flavor compounds and their overlap score (0-1); null without compound data. */
  shared: number | null
  overlap: number | null
  /** Recipe co-occurrence score (0-1); null when never cooked together in the data. */
  together: number | null
}

type Row = Record<string, unknown>

// Explicit columns: a running server keeps working after the import rebuilds these tables.
const COLUMNS = "id, name, category, compound_count, aroma_weight, aroma_generic, food_id"

async function lookups() {
  const catalog = new Map((await getCatalog()).map((f) => [f.id, f]))
  return (r: Row): FlavorIngredient => {
    const foodId = r.food_id === null ? null : Number(r.food_id)
    const food = foodId !== null ? catalog.get(foodId) : undefined
    const look = food ? { group: food.group, color: food.color } : categoryLook((r.category as string | null) ?? null)
    const name = String(r.name)
    return {
      id: Number(r.id),
      name,
      category: (r.category as string | null) ?? null,
      compoundCount: Number(r.compound_count),
      genericAroma: Number(r.aroma_generic) === 1,
      foodId,
      ...look,
      allergens: [...new Set([...tagAllergens(name), ...(food?.allergens ?? [])])],
    }
  }
}

/** The curated FlavorGraph ingredients (about 600 everyday ones), alphabetically. */
export async function listFlavorIngredients(): Promise<FlavorIngredient[]> {
  const [toIngredient, result] = await Promise.all([
    lookups(),
    libsql.execute(`SELECT ${COLUMNS} FROM flavor_ingredients WHERE curated = 1 ORDER BY name`),
  ])
  return result.rows.map((r) => toIngredient(r as Row))
}

export async function getFlavorIngredient(id: number): Promise<FlavorIngredient | null> {
  const [toIngredient, result] = await Promise.all([
    lookups(),
    libsql.execute({ sql: `SELECT ${COLUMNS} FROM flavor_ingredients WHERE id = ?`, args: [id] }),
  ])
  const row = result.rows[0]
  return row ? toIngredient(row as Row) : null
}

/**
 * Every curated partner of an ingredient with both signals: shared aromas (overlap) and how
 * often recipes combine them. Callers sort and filter for each view.
 */
export async function getPartners(id: number): Promise<Pairing[]> {
  const [toIngredient, self, shared, together, partners] = await Promise.all([
    lookups(),
    libsql.execute({ sql: "SELECT compound_count, aroma_weight, aroma_generic FROM flavor_ingredients WHERE id = ?", args: [id] }),
    libsql.execute({
      sql: `SELECT b.ingredient_id AS id, COUNT(*) AS shared, SUM(w.idf) AS weight
            FROM flavor_compounds a
            JOIN flavor_compounds b ON a.compound_id = b.compound_id
            JOIN flavor_compound_weights w ON w.compound_id = a.compound_id
            WHERE a.ingredient_id = ? AND b.ingredient_id != ?
            GROUP BY b.ingredient_id`,
      args: [id, id],
    }),
    libsql.execute({ sql: "SELECT b AS id, score FROM flavor_cooccur WHERE a = ?", args: [id] }),
    libsql.execute({ sql: `SELECT ${COLUMNS} FROM flavor_ingredients WHERE curated = 1 AND id != ?`, args: [id] }),
  ])
  const mine = Number(self.rows[0]?.aroma_generic) === 1 ? 0 : Number(self.rows[0]?.compound_count ?? 0)
  const myWeight = Number(self.rows[0]?.aroma_weight ?? 0)
  const sharedBy = new Map(shared.rows.map((r) => [Number(r.id), { count: Number(r.shared), weight: Number(r.weight) }]))
  const weightOf = new Map(partners.rows.map((r) => [Number(r.id), Number(r.aroma_weight)]))
  const togetherBy = new Map(together.rows.map((r) => [Number(r.id), Number(r.score)]))
  return partners.rows.map((r) => {
    const ing = toIngredient(r as Row)
    const hasAromas =
      mine > 0 && ing.compoundCount > 0 && !ing.genericAroma && !AROMA_EXCLUDED_CATEGORIES.has(ing.category ?? "")
    const s = sharedBy.get(ing.id)
    return {
      ...ing,
      shared: hasAromas ? (s?.count ?? 0) : null,
      overlap: hasAromas ? aromaOverlap(s?.weight ?? 0, myWeight, weightOf.get(ing.id) ?? 0) : null,
      together: togetherBy.get(ing.id) ?? null,
    }
  })
}

/** Ingredient names for pickers (custom food flavor match); empty when the flavor data isn't imported. */
export async function flavorOptions(): Promise<{ id: number; name: string }[]> {
  try {
    const result = await libsql.execute("SELECT id, name FROM flavor_ingredients WHERE curated = 1 ORDER BY name")
    return result.rows.map((r) => ({ id: Number(r.id), name: String(r.name) }))
  } catch {
    return []
  }
}
