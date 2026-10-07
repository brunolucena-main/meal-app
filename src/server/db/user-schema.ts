import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

import type { Profile, Targets } from "@/lib/nutrition/targets"

/*
  User data. Managed by Drizzle migrations (`npm run db:generate` after editing this file;
  migrations in /drizzle are applied automatically on first use). Kept apart from the USDA
  reference schema, which the import script rebuilds.
*/

/** Single-row settings table (id = 1). */
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  profile: text("profile", { mode: "json" }).$type<Profile>().notNull(),
  targetOverrides: text("target_overrides", { mode: "json" }).$type<Targets>().notNull(),
  allergies: text("allergies", { mode: "json" }).$type<string[]>().notNull(),
  /** False until the user saves their own profile; the app then shows example targets. */
  profileSaved: integer("profile_saved", { mode: "boolean" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

/**
 * Recipes and reusable meals ("my usual breakfast"). Same structure: a meal is a recipe whose
 * ingredients are eaten as one serving.
 */
export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["recipe", "meal"] }).notNull(),
  name: text("name").notNull(),
  servings: real("servings").notNull(),
  /** Weight of the finished dish, when cooking changes it; used for per-100 g values. */
  cookedGrams: real("cooked_grams"),
  notes: text("notes"),
  /**
   * Set on variants: the recipe of the family they were made from ("Yogurt bowl, raspberries"
   * from "Yogurt bowl, blueberries"). Always the family's first recipe, never a variant.
   */
  parentId: integer("parent_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

export const recipeItems = sqliteTable(
  "recipe_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    /** USDA FDC id (foods table). */
    foodId: integer("food_id").notNull(),
    grams: real("grams").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [index("recipe_items_recipe").on(t.recipeId)]
)

/**
 * What you plan and what you eat, one row per item. An entry is either a food (grams) or a
 * recipe/meal (servings). "planned" entries become "eaten" when you log them.
 */
export const entries = sqliteTable(
  "entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Local calendar date, YYYY-MM-DD. */
    date: text("date").notNull(),
    slot: text("slot", { enum: ["breakfast", "lunch", "dinner", "snack"] }).notNull(),
    status: text("status", { enum: ["planned", "eaten"] }).notNull(),
    foodId: integer("food_id"),
    grams: real("grams"),
    recipeId: integer("recipe_id"),
    servings: real("servings"),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("entries_date").on(t.date)]
)

/** Ticked items on a week's shopping list. */
export const shoppingChecks = sqliteTable(
  "shopping_checks",
  {
    /** Monday of the week, YYYY-MM-DD. */
    week: text("week").notNull(),
    foodId: integer("food_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.week, t.foodId] })]
)


/**
 * Foods you add by hand (a brand of milk from your store). Ids start above CUSTOM_FOOD_BASE so
 * they never clash with USDA FDC ids and work everywhere a food id does (entries, recipes,
 * shopping). Kept here rather than in the USDA tables, which the import rebuilds.
 */
export const customFoods = sqliteTable("custom_foods", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  /** A USDA food category name, for grouping and colors; null when none fits. */
  category: text("category"),
  /** Per 100 g, in the units of the nutrient catalog. Missing nutrients are absent, not zero. */
  nutrients: text("nutrients", { mode: "json" }).$type<Partial<Record<string, number>>>().notNull(),
  portions: text("portions", { mode: "json" }).$type<{ label: string; gramWeight: number }[]>().notNull(),
  allergens: text("allergens", { mode: "json" }).$type<string[]>().notNull(),
  /** The FlavorGraph ingredient it is (canned tuna -> tuna), for flavor ideas in recipes. */
  flavorId: integer("flavor_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})
