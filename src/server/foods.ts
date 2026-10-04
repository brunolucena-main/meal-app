import type { FoodGroup } from "@/lib/food/types"
import type { NutrientKey } from "@/lib/nutrition/nutrients"
import { libsql } from "@/server/db/client"

export type FoodSource = "foundation" | "sr_legacy"

export type FoodSummary = {
  id: number
  description: string
  source: FoodSource
  category: string | null
  group: FoodGroup
  color: string
  allergens: string[]
  energyKcal: number | null
  proteinG: number | null
  nutrientCount: number
}

export type FoodPortion = { id: number; label: string; gramWeight: number }

export type FoodDetail = FoodSummary & {
  nutrients: Partial<Record<NutrientKey, number>>
  portions: FoodPortion[]
}

type Row = Record<string, unknown>

function toSummary(r: Row): FoodSummary {
  return {
    id: Number(r.id),
    description: String(r.description),
    source: r.source as FoodSource,
    category: (r.category as string | null) ?? null,
    group: r.food_group as FoodGroup,
    color: String(r.color),
    allergens: r.allergens ? String(r.allergens).split(",") : [],
    energyKcal: r.energy_kcal === null ? null : Number(r.energy_kcal),
    proteinG: r.protein_g === null ? null : Number(r.protein_g),
    nutrientCount: Number(r.nutrient_count),
  }
}

/**
 * Full-text search over USDA descriptions. Every word matches as a prefix ("spin" finds spinach).
 *
 * Ranking: plain ingredient entries first. USDA names them "Spinach, raw" or, for fish, nuts,
 * beans, cheeses and oils, "Fish, salmon, ..." / "Nuts, almonds, ...", so the first word counts as
 * plain when it is the whole first or second part of the name ("milk" matches "Milk, whole",
 * not "Fish, milkfish"). Then raw over prepared, then names starting
 * with the word, then text relevance, then shorter names.
 */
export async function searchFoods(query: string, limit = 40): Promise<FoodSummary[]> {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  if (words.length === 0) return []
  const match = words.map((w) => `"${w}"*`).join(" ")
  const first = words[0] ?? ""
  const result = await libsql.execute({
    sql: `
      SELECT f.*, bm25(foods_fts) AS score
      FROM foods_fts JOIN foods f ON f.id = foods_fts.rowid
      WHERE foods_fts MATCH :match
      ORDER BY
        (
          lower(f.description) LIKE :plain OR lower(f.description) LIKE :plural
          OR (instr(f.description, ', ') > 0 AND (
            substr(lower(f.description), instr(f.description, ', ') + 2) || ',' LIKE :plain
            OR substr(lower(f.description), instr(f.description, ', ') + 2) || ',' LIKE :plural
          ))
        ) DESC,
        (lower(f.description) LIKE '%raw%') DESC,
        (lower(f.description) LIKE :starts) DESC,
        score,
        length(f.description)
      LIMIT :limit`,
    args: {
      match,
      word: first,
      plain: `${first},%`,
      plural: `${first}s,%`,
      starts: `${first}%`,
      limit,
    },
  })
  return result.rows.map((r) => toSummary(r as Row))
}

export async function getFood(id: number): Promise<FoodDetail | null> {
  const [food, nutrients, portions] = await libsql.batch(
    [
      { sql: "SELECT * FROM foods WHERE id = ?", args: [id] },
      { sql: "SELECT nutrient, amount FROM food_nutrients WHERE food_id = ?", args: [id] },
      { sql: "SELECT id, label, gram_weight FROM food_portions WHERE food_id = ? ORDER BY seq, id", args: [id] },
    ],
    "read"
  )
  const row = food.rows[0]
  if (!row) return null
  return {
    ...toSummary(row as Row),
    nutrients: Object.fromEntries(nutrients.rows.map((r) => [String(r.nutrient), Number(r.amount)])),
    portions: portions.rows.map((r) => ({ id: Number(r.id), label: String(r.label), gramWeight: Number(r.gram_weight) })),
  }
}

export const SOURCE_LABELS: Record<FoodSource, string> = {
  foundation: "USDA Foundation",
  sr_legacy: "USDA SR Legacy",
}
