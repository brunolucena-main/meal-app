import { asc, desc, eq, inArray, max } from "drizzle-orm"

import { per100g, perServing, recipeNutrition, type RecipeNutrition } from "@/lib/nutrition/recipe"
import type { FoodGroup } from "@/lib/food/types"
import { getCatalog, type CatalogFood } from "@/server/catalog"
import { db, ensureMigrated, libsql } from "@/server/db/client"
import { recipeItems, recipes } from "@/server/db/user-schema"
import type { FoodPortion } from "@/server/foods"

export type RecipeKind = "recipe" | "meal"

export type RecipeItemView = {
  id: number
  foodId: number
  grams: number
  name: string
  color: string
  group: FoodGroup
  allergens: string[]
  portions: FoodPortion[]
}

export type RecipeView = {
  id: number
  kind: RecipeKind
  name: string
  servings: number
  cookedGrams: number | null
  notes: string | null
  items: RecipeItemView[]
  nutrition: RecipeNutrition
  perServing: RecipeNutrition["totals"]
  per100g: RecipeNutrition["totals"]
  allergens: string[]
}

function build(
  row: typeof recipes.$inferSelect,
  items: (typeof recipeItems.$inferSelect)[],
  catalog: Map<number, CatalogFood>,
  portions: Map<number, FoodPortion[]>
): RecipeView {
  const views: RecipeItemView[] = []
  for (const item of items) {
    const food = catalog.get(item.foodId)
    if (!food) continue
    views.push({
      id: item.id,
      foodId: item.foodId,
      grams: item.grams,
      name: food.description,
      color: food.color,
      group: food.group,
      allergens: food.allergens,
      portions: portions.get(item.foodId) ?? [],
    })
  }
  const nutrition = recipeNutrition(
    views.map((v) => ({ foodId: v.foodId, name: v.name, grams: v.grams, profile: catalog.get(v.foodId)!.profile }))
  )
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    servings: row.servings,
    cookedGrams: row.cookedGrams,
    notes: row.notes,
    items: views,
    nutrition,
    perServing: perServing(nutrition.totals, row.servings),
    per100g: per100g(nutrition.totals, nutrition.totalGrams, row.cookedGrams ?? undefined),
    allergens: [...new Set(views.flatMap((v) => v.allergens))],
  }
}

async function catalogMap() {
  return new Map((await getCatalog()).map((f) => [f.id, f]))
}

async function portionsFor(foodIds: number[]): Promise<Map<number, FoodPortion[]>> {
  const out = new Map<number, FoodPortion[]>()
  if (!foodIds.length) return out
  const result = await libsql.execute({
    sql: `SELECT id, food_id, label, gram_weight FROM food_portions WHERE food_id IN (${foodIds.map(() => "?").join(",")}) ORDER BY seq, id`,
    args: foodIds,
  })
  for (const r of result.rows) {
    const list = out.get(Number(r.food_id)) ?? []
    list.push({ id: Number(r.id), label: String(r.label), gramWeight: Number(r.gram_weight) })
    out.set(Number(r.food_id), list)
  }
  return out
}

export async function listRecipes(): Promise<RecipeView[]> {
  await ensureMigrated()
  const rows = await db.select().from(recipes).orderBy(desc(recipes.updatedAt))
  if (!rows.length) return []
  const items = await db
    .select()
    .from(recipeItems)
    .where(inArray(recipeItems.recipeId, rows.map((r) => r.id)))
    .orderBy(asc(recipeItems.position))
  const catalog = await catalogMap()
  return rows.map((r) => build(r, items.filter((i) => i.recipeId === r.id), catalog, new Map()))
}

export async function getRecipe(id: number): Promise<RecipeView | null> {
  await ensureMigrated()
  const row = (await db.select().from(recipes).where(eq(recipes.id, id)).limit(1))[0]
  if (!row) return null
  const items = await db.select().from(recipeItems).where(eq(recipeItems.recipeId, id)).orderBy(asc(recipeItems.position))
  const [catalog, portions] = await Promise.all([catalogMap(), portionsFor([...new Set(items.map((i) => i.foodId))])])
  return build(row, items, catalog, portions)
}

export async function createRecipe(kind: RecipeKind): Promise<number> {
  await ensureMigrated()
  const now = new Date()
  const [row] = await db
    .insert(recipes)
    .values({ kind, name: kind === "meal" ? "New meal" : "New recipe", servings: kind === "meal" ? 1 : 2, createdAt: now, updatedAt: now })
    .returning({ id: recipes.id })
  return row.id
}

export async function updateRecipe(
  id: number,
  patch: Partial<Pick<typeof recipes.$inferInsert, "name" | "servings" | "cookedGrams" | "notes" | "kind">>
) {
  await db.update(recipes).set({ ...patch, updatedAt: new Date() }).where(eq(recipes.id, id))
}

export async function deleteRecipe(id: number) {
  // Delete children explicitly: SQLite only cascades with foreign keys switched on.
  await db.delete(recipeItems).where(eq(recipeItems.recipeId, id))
  await db.delete(recipes).where(eq(recipes.id, id))
}

export async function addRecipeItem(recipeId: number, foodId: number, grams: number) {
  const [{ last }] = await db
    .select({ last: max(recipeItems.position) })
    .from(recipeItems)
    .where(eq(recipeItems.recipeId, recipeId))
  await db.insert(recipeItems).values({ recipeId, foodId, grams, position: (last ?? 0) + 1 })
  await updateRecipe(recipeId, {})
}

export async function updateRecipeItem(itemId: number, grams: number) {
  const [item] = await db.update(recipeItems).set({ grams }).where(eq(recipeItems.id, itemId)).returning()
  if (item) await updateRecipe(item.recipeId, {})
}

export async function removeRecipeItem(itemId: number) {
  const [item] = await db.delete(recipeItems).where(eq(recipeItems.id, itemId)).returning()
  if (item) await updateRecipe(item.recipeId, {})
}
