import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

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

