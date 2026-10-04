/**
 * Integration tests for the database layer. They run against a throwaway copy of
 * data/meal-app.db (which must exist: run the imports first), so your real data is untouched.
 * Skipped automatically when the database hasn't been built.
 */
import { copyFileSync, existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

const source = path.join(process.cwd(), "data", "meal-app.db")
const hasDb = existsSync(source)
const dir = mkdtempSync(path.join(tmpdir(), "meal-app-test-"))

// Must be set before any server module creates its database client.
process.env.DATABASE_URL = `file:${path.join(dir, "test.db").replace(/\\/g, "/")}`

type Modules = {
  days: typeof import("./days")
  recipes: typeof import("./recipes")
  backup: typeof import("./backup")
  foods: typeof import("./foods")
}
let m: Modules

beforeAll(async () => {
  if (!hasDb) return
  copyFileSync(source, path.join(dir, "test.db"))
  m = {
    days: await import("./days"),
    recipes: await import("./recipes"),
    backup: await import("./backup"),
    foods: await import("./foods"),
  }
  // Start from empty user tables in the copy.
  await m.backup.importData({ app: "meal-app", version: 1, settings: [], recipes: [], recipeItems: [], entries: [], shoppingChecks: [] })
})

afterAll(async () => {
  // Windows keeps the file locked while the connection is open.
  if (hasDb) (await import("./db/client")).libsql.close()
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // Best effort: the OS cleans its temp folder eventually.
  }
})

describe.skipIf(!hasDb)("database layer", () => {
  it("finds foods by plain ingredient name first", async () => {
    const [first] = await m.foods.searchFoods("spinach", 1)
    expect(first.description).toBe("Spinach, raw")
  })

  it("sums a recipe, plans a serving, and expands it on the shopping list", async () => {
    const [oats] = await m.foods.searchFoods("oats rolled", 1)
    const [milk] = await m.foods.searchFoods("milk whole", 1)
    const id = await m.recipes.createRecipe("recipe")
    await m.recipes.updateRecipe(id, { servings: 2 })
    await m.recipes.addRecipeItem(id, oats.id, 80)
    await m.recipes.addRecipeItem(id, milk.id, 250)
    const recipe = (await m.recipes.getRecipe(id))!
    expect(recipe.nutrition.totalGrams).toBe(330)
    expect(recipe.perServing.energy).toBeCloseTo(recipe.nutrition.totals.energy! / 2)

    // A Monday, so the whole plan falls in one shopping week.
    await m.days.addEntry({ date: "2030-01-07", slot: "breakfast", status: "planned", recipe: { id, servings: 1 } })
    await m.days.addEntry({ date: "2030-01-07", slot: "lunch", status: "eaten", food: { id: oats.id, grams: 40 } })
    const day = await m.days.getDay("2030-01-07")
    expect(day.totals.planned.energy).toBeCloseTo(recipe.perServing.energy!)
    expect(day.totals.projected.energy).toBeCloseTo(recipe.perServing.energy! + (oats.energyKcal! * 40) / 100)

    const list = await m.days.shoppingList("2030-01-07")
    expect(list.find((i) => i.foodId === oats.id)?.grams).toBeCloseTo(40) // half of 80 g; eaten food isn't on the list
    expect(list.find((i) => i.foodId === milk.id)?.grams).toBeCloseTo(125)

    expect((await m.recipes.deleteRecipe(id)).ok).toBe(false)
  })

  it("round-trips a backup", async () => {
    const before = await m.backup.exportData()
    await m.backup.importData(JSON.parse(JSON.stringify(before)))
    const after = await m.backup.exportData()
    expect({ ...after, exportedAt: "" }).toEqual({ ...before, exportedAt: "" })
  })
})
