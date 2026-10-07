import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { cache } from "react"

import { db, ensureMigrated } from "@/server/db/client"
import { recipeItems, recipes } from "@/server/db/user-schema"

/**
 * The recipe you're adding to from the flavor pages (Pairings, Opposites, Bridges, Flavor map).
 * Set when you open them from a recipe's flavor guide (/recipes/[id]/explore), cleared with Done.
 */
export const COOKING_COOKIE = "cooking"

export type Cooking = { id: number; name: string; foodIds: Set<number> }

/** Once per request: several add buttons on one page share the lookup. */
export const getCooking = cache(async (): Promise<Cooking | null> => {
  const id = Number((await cookies()).get(COOKING_COOKIE)?.value)
  if (!Number.isInteger(id) || id <= 0) return null
  await ensureMigrated()
  const row = (await db.select({ id: recipes.id, name: recipes.name }).from(recipes).where(eq(recipes.id, id)).limit(1))[0]
  if (!row) return null
  const items = await db.select({ foodId: recipeItems.foodId }).from(recipeItems).where(eq(recipeItems.recipeId, id))
  return { id: row.id, name: row.name, foodIds: new Set(items.map((i) => i.foodId)) }
})
