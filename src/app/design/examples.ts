import type { ChipFood } from "@/components/food/ingredient-chip"
import type { CompareGroup } from "@/components/nutrition/compare-table"

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

export const compareGroups: CompareGroup[] = [
  {
    label: "Energy and macros",
    rows: [
      { key: "energy", label: "Energy", unit: "kcal", dv: 2000, kind: "info", values: [23, 35, 34] },
      { key: "protein", label: "Protein", unit: "g", dv: 50, kind: "goal", values: [2.9, 2.9, 2.8] },
      { key: "carbs", label: "Carbohydrate", unit: "g", dv: 275, kind: "info", values: [3.6, 4.4, 6.6] },
      { key: "fat", label: "Fat", unit: "g", dv: 78, kind: "info", values: [0.4, 1.5, 0.4] },
      { key: "fiber", label: "Fiber", unit: "g", dv: 28, kind: "goal", values: [2.2, 4.1, 2.6] },
    ],
  },
  {
    label: "Minerals",
    rows: [
      { key: "calcium", label: "Calcium", unit: "mg", dv: 1300, kind: "goal", values: [99, 254, 47] },
      { key: "iron", label: "Iron", unit: "mg", dv: 18, kind: "goal", values: [2.7, 1.6, 0.73] },
      { key: "magnesium", label: "Magnesium", unit: "mg", dv: 420, kind: "goal", values: [79, 33, 21] },
      { key: "potassium", label: "Potassium", unit: "mg", dv: 4700, kind: "goal", values: [558, 348, 316] },
      { key: "sodium", label: "Sodium", unit: "mg", dv: 2300, kind: "limit", values: [79, 53, 33] },
      { key: "iodine", label: "Iodine", unit: "µg", dv: 150, kind: "goal", values: [null, null, null] },
    ],
  },
  {
    label: "Vitamins",
    rows: [
      { key: "vitc", label: "Vitamin C", unit: "mg", dv: 90, kind: "goal", values: [28.1, 93.4, 89.2] },
      { key: "vitk", label: "Vitamin K", unit: "µg", dv: 120, kind: "goal", values: [483, 390, 102] },
    ],
  },
]
