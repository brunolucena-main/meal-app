/**
 * Flavor pairing signals from FlavorGraph.
 *
 * Shared aromas: flavor compounds two ingredients have in common (from FlavorDB). Raw counts
 * favor compound-rich foods (tea lists ~390 compounds and "shares" with everything), and many
 * compounds occur in nearly every plant. So each compound is weighted by rarity
 * (idf = ln(ingredients with aroma data / ingredients with this compound)) and pairs are ranked by
 * weighted overlap: shared weight / sqrt(weight A x weight B), a cosine similarity on compound sets.
 *
 * Cooked together: FlavorGraph's ingredient-ingredient score from recipe co-occurrence (0-1).
 */
import type { FoodGroup } from "@/lib/food/types"

/** Cosine overlap of two compound sets. Works on counts or on rarity-weighted sums. */
export function aromaOverlap(shared: number, totalA: number, totalB: number): number {
  if (shared <= 0 || totalA <= 0 || totalB <= 0) return 0
  return shared / Math.sqrt(totalA * totalB)
}

/** Categories that inherit their base ingredient's compounds (biscuit from wheat): not real pairings. */
export const AROMA_EXCLUDED_CATEGORIES = new Set(["Bakery/Dessert/Snack", "Dish/End Product", "ETC"])

const CATEGORY_GROUPS: Record<string, FoodGroup> = {
  "Plant/Vegetable": "vegetable",
  Fruit: "fruit",
  "Cereal/Crop/Bean": "grain",
  Dairy: "dairy",
  Seafood: "fish",
  "Meat/Animal Product": "meat",
  "Nut/Seed": "nut",
  Spice: "herb",
  Flower: "herb",
  "Essential Oil/Fat": "fat",
  Fungus: "vegetable",
}

const GROUP_COLORS: Partial<Record<FoodGroup, string>> = {
  vegetable: "#6a9a3a",
  fruit: "#d9483b",
  grain: "#d6b77a",
  dairy: "#f1ead8",
  fish: "#e98a6b",
  meat: "#c8735f",
  nut: "#a0703c",
  herb: "#7a8f3e",
  fat: "#d6b84a",
  other: "#a7a3b5",
}

/** Chip look for an ingredient with no USDA match, from its FlavorGraph category. */
export function categoryLook(category: string | null): { group: FoodGroup; color: string } {
  const group = (category && CATEGORY_GROUPS[category]) || "other"
  return { group, color: GROUP_COLORS[group] ?? GROUP_COLORS.other! }
}
