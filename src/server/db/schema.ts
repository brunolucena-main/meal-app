import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

/*
  USDA reference tables. They are rebuilt from scratch by `npm run data:import`
  (scripts/import-usda.ts creates them with matching SQL), so they never hold user data.
  Food ids are USDA FDC ids, which stay stable across imports.
*/

export const foods = sqliteTable("foods", {
  id: integer("id").primaryKey(),
  description: text("description").notNull(),
  source: text("source", { enum: ["foundation", "sr_legacy"] }).notNull(),
  category: text("category"),
  group: text("food_group").notNull(),
  color: text("color").notNull(),
  /** Comma-separated allergen tags, e.g. "hazelnut"; null when none. */
  allergens: text("allergens"),
  /** Denormalized for result lists. */
  energyKcal: real("energy_kcal"),
  proteinG: real("protein_g"),
  nutrientCount: integer("nutrient_count").notNull(),
})

export const foodNutrients = sqliteTable(
  "food_nutrients",
  {
    foodId: integer("food_id").notNull(),
    nutrient: text("nutrient").notNull(),
    /** Per 100 g, in the unit of the nutrient catalog (src/lib/nutrition/nutrients.ts). */
    amount: real("amount").notNull(),
  },
  (t) => [primaryKey({ columns: [t.foodId, t.nutrient] })]
)

export const foodPortions = sqliteTable("food_portions", {
  id: integer("id").primaryKey(),
  foodId: integer("food_id").notNull(),
  label: text("label").notNull(),
  gramWeight: real("gram_weight").notNull(),
  seq: integer("seq").notNull(),
})
