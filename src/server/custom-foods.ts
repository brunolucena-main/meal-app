import { count, eq, max } from "drizzle-orm"

import { CUSTOM_FOOD_BASE, customFoodDescription, customFoodLook, type CustomFoodInput } from "@/lib/food/custom"
import type { NutrientKey } from "@/lib/nutrition/nutrients"
import { db, ensureMigrated } from "@/server/db/client"
import { customFoods, entries, recipeItems, shoppingChecks } from "@/server/db/user-schema"
import type { FoodDetail } from "@/server/foods"

export type CustomFoodRow = typeof customFoods.$inferSelect

/** A custom food in the same shape as a USDA one. Portion ids are positions (1, 2, ...). */
export function toFoodDetail(row: CustomFoodRow): FoodDetail {
  const nutrients = row.nutrients as Partial<Record<NutrientKey, number>>
  return {
    id: row.id,
    description: customFoodDescription(row.name, row.brand),
    source: "custom",
    category: row.category,
    ...customFoodLook(row),
    allergens: row.allergens,
    energyKcal: nutrients.energy ?? null,
    proteinG: nutrients.protein ?? null,
    nutrientCount: Object.keys(nutrients).length,
    nutrients,
    portions: row.portions.map((p, i) => ({ id: i + 1, label: p.label, gramWeight: p.gramWeight })),
  }
}

export async function listCustomFoods(): Promise<FoodDetail[]> {
  await ensureMigrated()
  const rows = await db.select().from(customFoods)
  return rows.map(toFoodDetail).sort((a, b) => a.description.localeCompare(b.description))
}

export async function getCustomFoodRow(id: number): Promise<CustomFoodRow | null> {
  await ensureMigrated()
  return (await db.select().from(customFoods).where(eq(customFoods.id, id)).limit(1))[0] ?? null
}

export async function createCustomFood(food: CustomFoodInput): Promise<number> {
  await ensureMigrated()
  const now = new Date()
  return db.transaction(async (tx) => {
    const [{ last }] = await tx.select({ last: max(customFoods.id) }).from(customFoods)
    const id = Math.max(last ?? 0, CUSTOM_FOOD_BASE) + 1
    await tx.insert(customFoods).values({ id, ...food, createdAt: now, updatedAt: now })
    return id
  })
}

export async function updateCustomFood(id: number, food: CustomFoodInput) {
  await ensureMigrated()
  await db.update(customFoods).set({ ...food, updatedAt: new Date() }).where(eq(customFoods.id, id))
}

/** Planned or logged items and recipe ingredients that use the food. */
export async function customFoodUsage(id: number): Promise<number> {
  await ensureMigrated()
  const [[e], [r]] = await Promise.all([
    db.select({ n: count() }).from(entries).where(eq(entries.foodId, id)),
    db.select({ n: count() }).from(recipeItems).where(eq(recipeItems.foodId, id)),
  ])
  return e.n + r.n
}

/** Refused while the food is in use, so logs and recipes stay accurate. */
export async function deleteCustomFood(id: number): Promise<{ ok: true } | { ok: false; usedBy: number }> {
  const usedBy = await customFoodUsage(id)
  if (usedBy > 0) return { ok: false, usedBy }
  await db.delete(shoppingChecks).where(eq(shoppingChecks.foodId, id))
  await db.delete(customFoods).where(eq(customFoods.id, id))
  return { ok: true }
}
