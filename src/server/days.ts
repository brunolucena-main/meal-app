import { and, asc, eq, gte, lte, max } from "drizzle-orm"

import type { FoodGroup } from "@/lib/food/types"
import { addDays, dayTotals, type DayTotals, type EntryStatus, type Slot } from "@/lib/nutrition/day"
import { NUTRIENTS, type NutrientKey } from "@/lib/nutrition/nutrients"
import { getCatalog } from "@/server/catalog"
import { db, ensureMigrated, libsql } from "@/server/db/client"
import { entries, shoppingChecks } from "@/server/db/user-schema"
import { getPortions, type FoodPortion } from "@/server/foods"
import { listRecipes, type RecipeView } from "@/server/recipes"

type Profile = Partial<Record<NutrientKey, number>>

export type EntryView = {
  id: number
  date: string
  slot: Slot
  status: EntryStatus
  kind: "food" | "recipe"
  /** Food id or recipe id. */
  refId: number
  name: string
  color: string
  group: FoodGroup
  allergens: string[]
  /** Grams for foods, servings for recipes. */
  amount: number
  nutrients: Profile
  partial: NutrientKey[]
}

export type DayView = { date: string; entries: EntryView[]; totals: DayTotals }

function missing(p: Profile): NutrientKey[] {
  return NUTRIENTS.filter((n) => p[n.key] === undefined).map((n) => n.key)
}

function scale(p: Profile, factor: number): Profile {
  const out: Profile = {}
  for (const [k, v] of Object.entries(p)) out[k as NutrientKey] = v * factor
  return out
}

const RECIPE_COLOR = "#7c6fd6"

async function resolve(rows: (typeof entries.$inferSelect)[]): Promise<EntryView[]> {
  const catalog = new Map((await getCatalog()).map((f) => [f.id, f]))
  const needRecipes = rows.some((r) => r.recipeId !== null)
  const recipes = needRecipes ? new Map((await listRecipes()).map((r) => [r.id, r])) : new Map<number, RecipeView>()
  const out: EntryView[] = []
  for (const r of rows) {
    const base = { id: r.id, date: r.date, slot: r.slot, status: r.status }
    if (r.foodId !== null) {
      const food = catalog.get(r.foodId)
      if (!food) continue
      const grams = r.grams ?? 0
      out.push({
        ...base,
        kind: "food",
        refId: food.id,
        name: food.description,
        color: food.color,
        group: food.group,
        allergens: food.allergens,
        amount: grams,
        nutrients: scale(food.profile, grams / 100),
        partial: missing(food.profile),
      })
    } else if (r.recipeId !== null) {
      const recipe = recipes.get(r.recipeId)
      if (!recipe) continue
      const servings = r.servings ?? 1
      out.push({
        ...base,
        kind: "recipe",
        refId: recipe.id,
        name: recipe.name,
        color: RECIPE_COLOR,
        group: "other",
        allergens: recipe.allergens,
        amount: servings,
        nutrients: scale(recipe.perServing, servings),
        partial: [...new Set([...(Object.keys(recipe.nutrition.partial) as NutrientKey[]), ...missing(recipe.perServing)])],
      })
    }
  }
  return out
}

export async function getDays(start: string, count: number): Promise<DayView[]> {
  await ensureMigrated()
  const end = addDays(start, count - 1)
  const rows = await db
    .select()
    .from(entries)
    .where(and(gte(entries.date, start), lte(entries.date, end)))
    .orderBy(asc(entries.date), asc(entries.position))
  const views = await resolve(rows)
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(start, i)
    const dayEntries = views.filter((v) => v.date === date)
    return { date, entries: dayEntries, totals: dayTotals(dayEntries) }
  })
}

export async function getDay(date: string): Promise<DayView> {
  return (await getDays(date, 1))[0]
}

/** Days with anything logged, most recent first, for the history list. */
export async function loggedDates(limit = 30): Promise<string[]> {
  await ensureMigrated()
  const result = await libsql.execute({
    sql: "SELECT DISTINCT date FROM entries WHERE status = 'eaten' ORDER BY date DESC LIMIT ?",
    args: [limit],
  })
  return result.rows.map((r) => String(r.date))
}

export type RecentItem = {
  kind: "food" | "recipe"
  refId: number
  name: string
  color: string
  group: FoodGroup
  /** Last used amount: grams for foods, servings for recipes. */
  amount: number
}

/** Foods and meals used most recently (latest amount each), for one-tap re-adding. */
export async function recentItems(limit = 8): Promise<RecentItem[]> {
  await ensureMigrated()
  const result = await libsql.execute({
    sql: `SELECT food_id, recipe_id, grams, servings FROM entries e
          WHERE id = (SELECT id FROM entries x
                      WHERE x.food_id IS e.food_id AND x.recipe_id IS e.recipe_id
                      ORDER BY created_at DESC, id DESC LIMIT 1)
          ORDER BY created_at DESC, id DESC
          LIMIT ?`,
    args: [limit],
  })
  if (!result.rows.length) return []
  const catalog = new Map((await getCatalog()).map((f) => [f.id, f]))
  const recipes = new Map((await listRecipes()).map((r) => [r.id, r]))
  const out: RecentItem[] = []
  for (const r of result.rows) {
    if (r.food_id !== null) {
      const food = catalog.get(Number(r.food_id))
      if (food) out.push({ kind: "food", refId: food.id, name: food.description, color: food.color, group: food.group, amount: Number(r.grams) })
    } else if (r.recipe_id !== null) {
      const recipe = recipes.get(Number(r.recipe_id))
      if (recipe) out.push({ kind: "recipe", refId: recipe.id, name: recipe.name, color: RECIPE_COLOR, group: "other", amount: Number(r.servings) })
    }
  }
  return out
}

export async function addEntry(input: {
  date: string
  slot: Slot
  status: EntryStatus
  food?: { id: number; grams: number }
  recipe?: { id: number; servings: number }
}) {
  await ensureMigrated()
  const [{ last }] = await db.select({ last: max(entries.position) }).from(entries).where(eq(entries.date, input.date))
  await db.insert(entries).values({
    date: input.date,
    slot: input.slot,
    status: input.status,
    foodId: input.food?.id ?? null,
    grams: input.food?.grams ?? null,
    recipeId: input.recipe?.id ?? null,
    servings: input.recipe?.servings ?? null,
    position: (last ?? 0) + 1,
    createdAt: new Date(),
  })
}

export async function updateEntry(
  id: number,
  patch: Partial<{ status: EntryStatus; grams: number; servings: number; slot: Slot }>
) {
  await db.update(entries).set(patch).where(eq(entries.id, id))
}

export async function deleteEntry(id: number) {
  await db.delete(entries).where(eq(entries.id, id))
}

/** Copies one day's entries onto another date, as planned. */
export async function copyDay(from: string, to: string) {
  await ensureMigrated()
  const rows = await db.select().from(entries).where(eq(entries.date, from)).orderBy(asc(entries.position))
  const [{ last }] = await db.select({ last: max(entries.position) }).from(entries).where(eq(entries.date, to))
  let position = last ?? 0
  for (const r of rows) {
    position++
    await db.insert(entries).values({ ...r, id: undefined, date: to, status: "planned", position, createdAt: new Date() })
  }
}

export type ShoppingItem = {
  foodId: number
  name: string
  color: string
  group: FoodGroup
  category: string | null
  allergens: string[]
  grams: number
  portion: FoodPortion | null
  checked: boolean
}

/** Everything still planned for the week (Monday to Sunday), recipes expanded into ingredients. */
export async function shoppingList(week: string): Promise<ShoppingItem[]> {
  await ensureMigrated()
  const rows = await db
    .select()
    .from(entries)
    .where(and(gte(entries.date, week), lte(entries.date, addDays(week, 6)), eq(entries.status, "planned")))
  const recipes = new Map((await listRecipes()).map((r) => [r.id, r]))
  const grams = new Map<number, number>()
  const bump = (foodId: number, g: number) => grams.set(foodId, (grams.get(foodId) ?? 0) + g)
  for (const r of rows) {
    if (r.foodId !== null) bump(r.foodId, r.grams ?? 0)
    else if (r.recipeId !== null) {
      const recipe = recipes.get(r.recipeId)
      if (!recipe) continue
      const share = (r.servings ?? 1) / (recipe.servings || 1)
      for (const item of recipe.items) bump(item.foodId, item.grams * share)
    }
  }
  const ids = [...grams.keys()]
  if (!ids.length) return []
  const [catalog, portions, checks] = await Promise.all([
    getCatalog(),
    getPortions(ids),
    db.select().from(shoppingChecks).where(eq(shoppingChecks.week, week)),
  ])
  const byId = new Map(catalog.map((f) => [f.id, f]))
  const checked = new Set(checks.map((c) => c.foodId))
  return ids
    .map((id) => {
      const food = byId.get(id)!
      return {
        foodId: id,
        name: food.description,
        color: food.color,
        group: food.group,
        category: food.category,
        allergens: food.allergens,
        grams: grams.get(id)!,
        portion: portions.get(id)?.[0] ?? null,
        checked: checked.has(id),
      }
    })
    .sort((a, b) => (a.category ?? "").localeCompare(b.category ?? "") || a.name.localeCompare(b.name))
}

export async function setShoppingCheck(week: string, foodId: number, checked: boolean) {
  await ensureMigrated()
  if (checked) await db.insert(shoppingChecks).values({ week, foodId }).onConflictDoNothing()
  else await db.delete(shoppingChecks).where(and(eq(shoppingChecks.week, week), eq(shoppingChecks.foodId, foodId)))
}
