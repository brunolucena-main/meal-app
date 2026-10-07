import { and, asc, count, desc, eq, inArray, max, ne } from "drizzle-orm"

import { per100g, perServing, recipeNutrition, type RecipeNutrition } from "@/lib/nutrition/recipe"
import type { FoodGroup } from "@/lib/food/types"
import { getCatalog, type CatalogFood } from "@/server/catalog"
import { db, ensureMigrated } from "@/server/db/client"
import { entries, recipeItems, recipes } from "@/server/db/user-schema"
import { getPortions, type FoodPortion } from "@/server/foods"

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
  /** The family's first recipe when this is a variant (src/lib/recipes/variants.ts). */
  parentId: number | null
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
    parentId: row.parentId,
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
  const [catalog, portions] = await Promise.all([catalogMap(), getPortions([...new Set(items.map((i) => i.foodId))])])
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

/** How many planned or logged items use this recipe. */
export async function recipeUsage(id: number): Promise<number> {
  const [{ n }] = await db.select({ n: count() }).from(entries).where(eq(entries.recipeId, id))
  return n
}

/**
 * Deletes a recipe and its ingredients. Refuses while days still use it, so deleting a recipe
 * can never silently change logged totals.
 */
export async function deleteRecipe(id: number): Promise<{ ok: true } | { ok: false; usedBy: number }> {
  const usedBy = await recipeUsage(id)
  if (usedBy > 0) return { ok: false, usedBy }
  // The family's first recipe is going: its oldest variant takes its place.
  const variants = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.parentId, id)).orderBy(asc(recipes.id))
  if (variants.length) {
    const [heir] = variants
    await db.update(recipes).set({ parentId: null }).where(eq(recipes.id, heir.id))
    await db.update(recipes).set({ parentId: heir.id }).where(and(eq(recipes.parentId, id), ne(recipes.id, heir.id)))
  }
  // Delete children explicitly: SQLite only cascades with foreign keys switched on.
  await db.delete(recipeItems).where(eq(recipeItems.recipeId, id))
  await db.delete(recipes).where(eq(recipes.id, id))
  return { ok: true }
}

/**
 * Copies a recipe with all its ingredients under a new name, as a variant in the same family.
 * Returns the new recipe's id, or null when the original doesn't exist.
 */
export async function createVariant(id: number, name: string): Promise<number | null> {
  await ensureMigrated()
  const row = (await db.select().from(recipes).where(eq(recipes.id, id)).limit(1))[0]
  if (!row) return null
  const items = await db.select().from(recipeItems).where(eq(recipeItems.recipeId, id)).orderBy(asc(recipeItems.position))
  const now = new Date()
  return db.transaction(async (tx) => {
    const [copy] = await tx
      .insert(recipes)
      .values({
        kind: row.kind,
        name,
        servings: row.servings,
        cookedGrams: row.cookedGrams,
        notes: row.notes,
        parentId: row.parentId ?? row.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: recipes.id })
    for (const item of items) {
      await tx.insert(recipeItems).values({ recipeId: copy.id, foodId: item.foodId, grams: item.grams, position: item.position })
    }
    return copy.id
  })
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

/** Swaps the ingredient's food, keeping its amount and place ("raspberries instead of blueberries"). */
export async function replaceRecipeItem(itemId: number, foodId: number) {
  const [item] = await db.update(recipeItems).set({ foodId }).where(eq(recipeItems.id, itemId)).returning()
  if (item) await updateRecipe(item.recipeId, {})
}

export async function removeRecipeItem(itemId: number) {
  const [item] = await db.delete(recipeItems).where(eq(recipeItems.id, itemId)).returning()
  if (item) await updateRecipe(item.recipeId, {})
}
