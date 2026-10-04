import type { ChipFood } from "@/components/food/ingredient-chip"
import { compareFoods as compare, type Comparison } from "@/lib/nutrition/compare"
import { NUTRIENT_BY_KEY } from "@/lib/nutrition/nutrients"

// Example content for the style guide only. Approximate USDA SR Legacy values, raw, per 100 g.

export const chipExamples: ChipFood[] = [
  { name: "Spinach", color: "#2f6b34", group: "leafy" },
  { name: "Kale", color: "#31584a", group: "leafy" },
  { name: "Broccoli", color: "#4a7f3a", group: "vegetable" },
  { name: "Garlic", color: "#ece3cf", group: "vegetable" },
  { name: "Tomato", color: "#d8402a", group: "fruit" },
  { name: "Lemon", color: "#f1d23a", group: "fruit" },
  { name: "Lentils", color: "#b8682e", group: "legume" },
  { name: "Chickpeas", color: "#d9b56f", group: "legume" },
  { name: "Oats", color: "#d6c193", group: "grain" },
  { name: "Feta", color: "#f2efe6", group: "dairy" },
  { name: "Chicken breast", color: "#e9c7a4", group: "meat" },
  { name: "Salmon", color: "#f08a63", group: "fish" },
  { name: "Nutmeg", color: "#8a5a33", group: "herb" },
  { name: "Olive oil", color: "#b5a632", group: "fat" },
  { name: "Hazelnut", color: "#9a6331", group: "nut", allergen: "hazelnut" },
  { name: "Praline paste", color: "#b07a45", group: "nut", allergen: "hazelnut" },
]

export const compareFoods: ChipFood[] = [
  { name: "Spinach", color: "#2f6b34", group: "leafy" },
  { name: "Kale", color: "#31584a", group: "leafy" },
  { name: "Broccoli", color: "#4a7f3a", group: "vegetable" },
]

const exampleProfiles = [
  { energy: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, calcium: 99, iron: 2.7, magnesium: 79, potassium: 558, sodium: 79, vitC: 28.1, vitK: 483 },
  { energy: 35, protein: 2.9, carbs: 4.4, fat: 1.5, fiber: 4.1, calcium: 254, iron: 1.6, magnesium: 33, potassium: 348, sodium: 53, vitC: 93.4, vitK: 390 },
  { energy: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, calcium: 47, iron: 0.73, magnesium: 21, potassium: 316, sodium: 33, vitC: 89.2, vitK: 102 },
]

const exampleNutrients = (
  ["energy", "protein", "carbs", "fat", "fiber", "calcium", "iron", "magnesium", "potassium", "sodium", "iodine", "vitC", "vitK"] as const
).map((k) => NUTRIENT_BY_KEY[k])

export const exampleComparison: Comparison = compare(
  exampleProfiles.map((profile) => ({ profile })),
  "100g",
  exampleNutrients
)
