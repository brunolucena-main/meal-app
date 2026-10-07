import { db, ensureMigrated } from "@/server/db/client"
import { customFoods, entries, recipeItems, recipes, settings, shoppingChecks } from "@/server/db/user-schema"

/**
 * Backup of everything the user created (not the USDA or FlavorGraph reference data, which the
 * import scripts rebuild). Plain JSON, so it is easy to inspect and survives schema changes
 * that only add columns.
 */
/** 2 added custom foods; version 1 files still restore (with no custom foods). */
export const BACKUP_VERSION = 2

export type Backup = {
  app: "meal-app"
  version: number
  exportedAt: string
  settings: (typeof settings.$inferSelect)[]
  customFoods: (typeof customFoods.$inferSelect)[]
  recipes: (typeof recipes.$inferSelect)[]
  recipeItems: (typeof recipeItems.$inferSelect)[]
  entries: (typeof entries.$inferSelect)[]
  shoppingChecks: (typeof shoppingChecks.$inferSelect)[]
}

export async function exportData(): Promise<Backup> {
  await ensureMigrated()
  const [s, cf, r, ri, e, sc] = await Promise.all([
    db.select().from(settings),
    db.select().from(customFoods),
    db.select().from(recipes),
    db.select().from(recipeItems),
    db.select().from(entries),
    db.select().from(shoppingChecks),
  ])
  return {
    app: "meal-app",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: s,
    customFoods: cf,
    recipes: r,
    recipeItems: ri,
    entries: e,
    shoppingChecks: sc,
  }
}

export async function dataCounts() {
  const b = await exportData()
  return {
    recipes: b.recipes.length,
    entries: b.entries.length,
    days: new Set(b.entries.map((e) => e.date)).size,
    customFoods: b.customFoods.length,
    profileSaved: b.settings[0]?.profileSaved ?? false,
  }
}

/** Timestamps come back from JSON as strings; Drizzle wants Dates. */
const toDate = (v: unknown) => new Date(v as string | number)

/** Replaces all user data with the backup's. Throws with a readable message when the file is wrong. */
export async function importData(raw: unknown): Promise<void> {
  const b = raw as Partial<Backup>
  if (!b || b.app !== "meal-app" || typeof b.version !== "number") {
    throw new Error("This file isn't a Meal App backup.")
  }
  if (b.version > BACKUP_VERSION) {
    throw new Error("This backup comes from a newer version of the app.")
  }
  const list = <T,>(v: T[] | undefined) => (Array.isArray(v) ? v : [])
  await ensureMigrated()
  await db.transaction(async (tx) => {
    await tx.delete(shoppingChecks)
    await tx.delete(entries)
    await tx.delete(recipeItems)
    await tx.delete(recipes)
    await tx.delete(settings)
    await tx.delete(customFoods)
    for (const row of list(b.settings)) await tx.insert(settings).values({ ...row, updatedAt: toDate(row.updatedAt) })
    for (const row of list(b.customFoods)) {
      await tx.insert(customFoods).values({ ...row, createdAt: toDate(row.createdAt), updatedAt: toDate(row.updatedAt) })
    }
    for (const row of list(b.recipes)) {
      await tx.insert(recipes).values({ ...row, createdAt: toDate(row.createdAt), updatedAt: toDate(row.updatedAt) })
    }
    for (const row of list(b.recipeItems)) await tx.insert(recipeItems).values(row)
    for (const row of list(b.entries)) await tx.insert(entries).values({ ...row, createdAt: toDate(row.createdAt) })
    for (const row of list(b.shoppingChecks)) await tx.insert(shoppingChecks).values(row)
  })
}
