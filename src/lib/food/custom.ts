import { ALLERGENS, tagAllergens, type Allergen } from "./allergens"
import { classifyGroup, representativeColor } from "./classify"
import type { FoodGroup } from "./types"
import { NUTRIENTS, type NutrientKey } from "../nutrition/nutrients"

/** Custom food ids start above this, well clear of USDA FDC ids (7 digits today). */
export const CUSTOM_FOOD_BASE = 900_000_000

export const isCustomFoodId = (id: number) => id > CUSTOM_FOOD_BASE

/** Sodium in mg from salt in g (food labels in Europe list salt: salt = sodium x 2.5). */
export const saltToSodiumMg = (saltG: number) => saltG * 400
export const sodiumMgToSalt = (sodiumMg: number) => sodiumMg / 400

/** Categories offered for custom foods (USDA's, so they translate and group like the rest). */
export const CUSTOM_FOOD_CATEGORIES = [
  "Dairy and Egg Products",
  "Beverages",
  "Breakfast Cereals",
  "Cereal Grains and Pasta",
  "Baked Products",
  "Fruits and Fruit Juices",
  "Vegetables and Vegetable Products",
  "Legumes and Legume Products",
  "Nut and Seed Products",
  "Beef Products",
  "Pork Products",
  "Poultry Products",
  "Sausages and Luncheon Meats",
  "Finfish and Shellfish Products",
  "Fats and Oils",
  "Spices and Herbs",
  "Soups, Sauces, and Gravies",
  "Snacks",
  "Sweets",
  "Meals, Entrees, and Side Dishes",
] as const

export type CustomFoodInput = {
  name: string
  brand: string | null
  category: string | null
  /** Per 100 g. */
  nutrients: Partial<Record<NutrientKey, number>>
  portions: { label: string; gramWeight: number }[]
  allergens: string[]
}

export type CustomFoodForm = {
  name: string
  brand?: string
  category?: string
  /** The label column the values come from, in grams (100, or a serving size). */
  basisGrams: string
  /** Raw field text per nutrient key; blank means "not on the label". */
  nutrients: Partial<Record<NutrientKey, string>>
  /** Salt in g, used for sodium when sodium itself is blank. */
  salt?: string
  portions: { label: string; grams: string }[]
  allergens: string[]
}

export type ParseResult = { ok: true; food: CustomFoodInput } | { ok: false; error: string }

const MAX_PORTIONS = 12

function num(raw: string | undefined): number | undefined | null {
  const text = (raw ?? "").trim().replace(",", ".")
  if (!text) return undefined
  const n = Number(text)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Display name: "Semi-skimmed milk (Hacendado)". */
export function customFoodDescription(name: string, brand: string | null) {
  return brand ? `${name} (${brand})` : name
}

export function customFoodLook(food: Pick<CustomFoodInput, "name" | "brand" | "category">): { group: FoodGroup; color: string } {
  const description = customFoodDescription(food.name, food.brand).toLowerCase()
  const group = classifyGroup(description, food.category)
  return { group, color: representativeColor(description, group) }
}

/**
 * Validates the form and scales the label's values to per 100 g. Blank fields stay missing
 * (never zero). Allergens: the ones ticked plus any the name reveals (e.g. "praline").
 * Errors are English keys for t().
 */
export function parseCustomFoodForm(form: CustomFoodForm): ParseResult {
  const name = form.name.trim().slice(0, 120)
  if (!name) return { ok: false, error: "Give the food a name." }
  const brand = form.brand?.trim().slice(0, 80) || null
  const category = CUSTOM_FOOD_CATEGORIES.find((c) => c === form.category) ?? null

  const basis = num(form.basisGrams)
  if (!basis) return { ok: false, error: "Enter the amount the label values are for, in grams." }
  const factor = 100 / basis

  const nutrients: Partial<Record<NutrientKey, number>> = {}
  for (const n of NUTRIENTS) {
    const v = num(form.nutrients[n.key])
    if (v === null) return { ok: false, error: "Nutrient values must be numbers of zero or more." }
    if (v !== undefined) nutrients[n.key] = v * factor
  }
  if (nutrients.sodium === undefined) {
    const salt = num(form.salt)
    if (salt === null) return { ok: false, error: "Nutrient values must be numbers of zero or more." }
    if (salt !== undefined) nutrients.sodium = saltToSodiumMg(salt) * factor
  }
  if (Object.keys(nutrients).length === 0) return { ok: false, error: "Enter at least one nutrient value." }
  const mass = (["protein", "fat", "carbs", "fiber", "water"] as const).reduce((s, k) => s + (nutrients[k] ?? 0), 0)
  // Fiber is counted inside carbohydrate on US labels, so allow a little over 100 g.
  if (mass > 130) return { ok: false, error: "Protein, fat and carbohydrate add up to more than the food weighs. Check the amount the values are for." }

  const portions: CustomFoodInput["portions"] = []
  for (const p of form.portions) {
    const label = p.label.trim().slice(0, 60)
    const grams = num(p.grams)
    if (!label && grams === undefined) continue
    if (!label) return { ok: false, error: "Each portion needs a name, e.g. “1 glass”." }
    if (!grams) return { ok: false, error: "Each portion needs its weight in grams." }
    portions.push({ label, gramWeight: grams })
  }

  const named = tagAllergens(`${name} ${brand ?? ""}`)
  const allergens = ALLERGENS.filter((a: Allergen) => form.allergens.includes(a) || named.includes(a))

  return { ok: true, food: { name, brand, category, nutrients, portions: portions.slice(0, MAX_PORTIONS), allergens } }
}

/** Field text for a number: up to 3 decimals, no trailing zeros. */
export const fieldText = (n: number) => String(Math.round(n * 1000) / 1000)

/** What the edit form starts with: a stored food's values (per 100 g), or blanks. */
export type CustomFoodFormValues = {
  name: string
  brand: string
  category: string
  nutrients: Partial<Record<NutrientKey, string>>
  portions: { label: string; grams: string }[]
  allergens: string[]
}

export function toFormValues(food?: CustomFoodInput): CustomFoodFormValues {
  if (!food) return { name: "", brand: "", category: "", nutrients: {}, portions: [], allergens: [] }
  return {
    name: food.name,
    brand: food.brand ?? "",
    category: food.category ?? "",
    nutrients: Object.fromEntries(Object.entries(food.nutrients).map(([k, v]) => [k, fieldText(v ?? 0)])),
    portions: food.portions.map((p) => ({ label: p.label, grams: fieldText(p.gramWeight) })),
    allergens: food.allergens,
  }
}

/** Prefix match on every query word, the same way USDA search works ("mil" finds milk). */
export function matchesQuery(text: string, query: string) {
  const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  if (!words.length) return false
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  return words.every((w) => tokens.some((t) => t.startsWith(w)))
}
