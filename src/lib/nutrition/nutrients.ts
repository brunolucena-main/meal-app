/**
 * The nutrients the app tracks, in display order. Amounts are stored per 100 g in `unit`
 * (USDA reports these nutrients in the same units, so no conversion is needed on import).
 *
 * `fdcIds` lists USDA FoodData Central nutrient ids in priority order: the first one a food
 * reports wins. Foundation Foods often report energy, fat or carbohydrate under a different id
 * than SR Legacy, hence the fallbacks.
 *
 * `dv` is the FDA Daily Value for adults (2016 labeling rule), used until personal targets
 * exist (session 4). `kind`: goal = more is better, limit = stay under, info = neither.
 */

export type NutrientGroup = "energy" | "macros" | "fats" | "minerals" | "vitamins"
export type NutrientKind = "goal" | "limit" | "info"
export type NutrientUnit = "kcal" | "g" | "mg" | "µg"

export type NutrientDef = {
  key: string
  name: string
  unit: NutrientUnit
  group: NutrientGroup
  kind: NutrientKind
  dv?: number
  fdcIds: readonly number[]
}

export const NUTRIENTS = [
  { key: "energy", name: "Energy", unit: "kcal", group: "energy", kind: "info", dv: 2000, fdcIds: [1008, 2048, 2047] },

  { key: "protein", name: "Protein", unit: "g", group: "macros", kind: "goal", dv: 50, fdcIds: [1003] },
  { key: "carbs", name: "Carbohydrate", unit: "g", group: "macros", kind: "info", dv: 275, fdcIds: [1005, 1050] },
  { key: "fiber", name: "Fiber", unit: "g", group: "macros", kind: "goal", dv: 28, fdcIds: [1079] },
  { key: "sugars", name: "Sugars", unit: "g", group: "macros", kind: "info", fdcIds: [2000, 1063] },
  { key: "addedSugars", name: "Added sugars", unit: "g", group: "macros", kind: "limit", dv: 50, fdcIds: [1235] },
  { key: "water", name: "Water", unit: "g", group: "macros", kind: "info", fdcIds: [1051] },

  { key: "fat", name: "Fat", unit: "g", group: "fats", kind: "info", dv: 78, fdcIds: [1004, 1085] },
  { key: "satFat", name: "Saturated fat", unit: "g", group: "fats", kind: "limit", dv: 20, fdcIds: [1258] },
  { key: "monoFat", name: "Monounsaturated fat", unit: "g", group: "fats", kind: "info", fdcIds: [1292] },
  { key: "polyFat", name: "Polyunsaturated fat", unit: "g", group: "fats", kind: "info", fdcIds: [1293] },
  { key: "transFat", name: "Trans fat", unit: "g", group: "fats", kind: "limit", fdcIds: [1257] },
  { key: "ala", name: "Omega-3 ALA", unit: "g", group: "fats", kind: "info", fdcIds: [1404] },
  { key: "epa", name: "Omega-3 EPA", unit: "g", group: "fats", kind: "info", fdcIds: [1278] },
  { key: "dha", name: "Omega-3 DHA", unit: "g", group: "fats", kind: "info", fdcIds: [1272] },
  { key: "cholesterol", name: "Cholesterol", unit: "mg", group: "fats", kind: "limit", dv: 300, fdcIds: [1253] },

  { key: "calcium", name: "Calcium", unit: "mg", group: "minerals", kind: "goal", dv: 1300, fdcIds: [1087] },
  { key: "iron", name: "Iron", unit: "mg", group: "minerals", kind: "goal", dv: 18, fdcIds: [1089] },
  { key: "magnesium", name: "Magnesium", unit: "mg", group: "minerals", kind: "goal", dv: 420, fdcIds: [1090] },
  { key: "phosphorus", name: "Phosphorus", unit: "mg", group: "minerals", kind: "goal", dv: 1250, fdcIds: [1091] },
  { key: "potassium", name: "Potassium", unit: "mg", group: "minerals", kind: "goal", dv: 4700, fdcIds: [1092] },
  { key: "sodium", name: "Sodium", unit: "mg", group: "minerals", kind: "limit", dv: 2300, fdcIds: [1093] },
  { key: "zinc", name: "Zinc", unit: "mg", group: "minerals", kind: "goal", dv: 11, fdcIds: [1095] },
  { key: "copper", name: "Copper", unit: "mg", group: "minerals", kind: "goal", dv: 0.9, fdcIds: [1098] },
  { key: "manganese", name: "Manganese", unit: "mg", group: "minerals", kind: "goal", dv: 2.3, fdcIds: [1101] },
  { key: "selenium", name: "Selenium", unit: "µg", group: "minerals", kind: "goal", dv: 55, fdcIds: [1103] },
  { key: "iodine", name: "Iodine", unit: "µg", group: "minerals", kind: "goal", dv: 150, fdcIds: [1100] },

  { key: "vitA", name: "Vitamin A", unit: "µg", group: "vitamins", kind: "goal", dv: 900, fdcIds: [1106] },
  { key: "vitC", name: "Vitamin C", unit: "mg", group: "vitamins", kind: "goal", dv: 90, fdcIds: [1162] },
  { key: "vitD", name: "Vitamin D", unit: "µg", group: "vitamins", kind: "goal", dv: 20, fdcIds: [1114] },
  { key: "vitE", name: "Vitamin E", unit: "mg", group: "vitamins", kind: "goal", dv: 15, fdcIds: [1109] },
  { key: "vitK", name: "Vitamin K", unit: "µg", group: "vitamins", kind: "goal", dv: 120, fdcIds: [1185] },
  { key: "thiamin", name: "Thiamin (B1)", unit: "mg", group: "vitamins", kind: "goal", dv: 1.2, fdcIds: [1165] },
  { key: "riboflavin", name: "Riboflavin (B2)", unit: "mg", group: "vitamins", kind: "goal", dv: 1.3, fdcIds: [1166] },
  { key: "niacin", name: "Niacin (B3)", unit: "mg", group: "vitamins", kind: "goal", dv: 16, fdcIds: [1167] },
  { key: "pantothenic", name: "Pantothenic acid (B5)", unit: "mg", group: "vitamins", kind: "goal", dv: 5, fdcIds: [1170] },
  { key: "vitB6", name: "Vitamin B6", unit: "mg", group: "vitamins", kind: "goal", dv: 1.7, fdcIds: [1175] },
  // DFE when reported; Foundation Foods often only report total folate (equal for unfortified foods).
  { key: "folate", name: "Folate", unit: "µg", group: "vitamins", kind: "goal", dv: 400, fdcIds: [1190, 1177] },
  { key: "vitB12", name: "Vitamin B12", unit: "µg", group: "vitamins", kind: "goal", dv: 2.4, fdcIds: [1178] },
  { key: "choline", name: "Choline", unit: "mg", group: "vitamins", kind: "goal", dv: 550, fdcIds: [1180] },
] as const satisfies readonly NutrientDef[]

export type NutrientKey = (typeof NUTRIENTS)[number]["key"]

export const NUTRIENT_BY_KEY = {} as Record<NutrientKey, NutrientDef>
for (const n of NUTRIENTS) NUTRIENT_BY_KEY[n.key] = n

export const NUTRIENT_GROUP_LABELS: Record<NutrientGroup, string> = {
  energy: "Energy",
  macros: "Macronutrients",
  fats: "Fats",
  minerals: "Minerals",
  vitamins: "Vitamins",
}

/**
 * Picks one value per tracked nutrient from a food's raw USDA amounts (keyed by FDC nutrient id).
 * Nutrients the food doesn't report are left out: missing is never turned into zero.
 */
export function resolveNutrients(amountsById: ReadonlyMap<number, number>): Partial<Record<NutrientKey, number>> {
  const out: Partial<Record<NutrientKey, number>> = {}
  for (const n of NUTRIENTS) {
    for (const id of n.fdcIds) {
      const amount = amountsById.get(id)
      if (amount !== undefined && Number.isFinite(amount)) {
        out[n.key] = amount
        break
      }
    }
  }
  return out
}
