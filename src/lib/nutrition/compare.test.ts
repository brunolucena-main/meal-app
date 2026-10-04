import { describe, expect, it } from "vitest"

import { basisFactor, bestIndex, compareFoods, standouts, winCounts } from "./compare"
import { NUTRIENT_BY_KEY } from "./nutrients"

// Approximate USDA SR Legacy values per 100 g, raw.
const spinach = { profile: { energy: 23, protein: 2.86, iron: 2.71, calcium: 99, vitC: 28.1, sodium: 79 }, servingGrams: 30 }
const kale = { profile: { energy: 35, protein: 2.92, iron: 1.6, calcium: 254, vitC: 93.4, sodium: 53 }, servingGrams: 21 }

const row = (c: ReturnType<typeof compareFoods>, key: string) => c.rows.find((r) => r.nutrient.key === key)!

describe("basisFactor", () => {
  it("scales per 100 g, per 100 kcal and per serving", () => {
    expect(basisFactor(spinach, "100g")).toBe(1)
    expect(basisFactor(spinach, "100kcal")).toBeCloseTo(100 / 23)
    expect(basisFactor(spinach, "serving")).toBeCloseTo(0.3)
  })

  it("refuses bases that can't apply", () => {
    expect(basisFactor({ profile: {} }, "100kcal")).toBeNull()
    expect(basisFactor({ profile: { energy: 0 } }, "100kcal")).toBeNull()
    expect(basisFactor({ profile: { energy: 23 } }, "serving")).toBeNull()
  })
})

describe("bestIndex", () => {
  it("picks the highest goal and the lowest limit", () => {
    expect(bestIndex("goal", [1, 3, 2])).toBe(1)
    expect(bestIndex("limit", [79, 53, 60])).toBe(1)
    expect(bestIndex("info", [1, 3])).toBeNull()
  })

  it("ignores missing values and needs two known values", () => {
    expect(bestIndex("goal", [null, 3, 2])).toBe(1)
    expect(bestIndex("goal", [null, 3, null])).toBeNull()
  })

  it("calls near-equal values a tie", () => {
    expect(bestIndex("goal", [2.86, 2.87])).toBeNull()
    expect(bestIndex("goal", [2.86, 2.92])).toBe(1)
  })
})

describe("compareFoods", () => {
  it("compares per 100 g with % of Daily Value", () => {
    const c = compareFoods([spinach, kale], "100g")
    expect(row(c, "iron").values).toEqual([2.71, 1.6])
    expect(row(c, "iron").best).toBe(0)
    expect(row(c, "calcium").best).toBe(1)
    expect(row(c, "sodium").best).toBe(1) // limit: lower wins
    expect(row(c, "vitC").pctDv[1]).toBeCloseTo((93.4 / 90) * 100)
  })

  it("changes the picture per 100 kcal", () => {
    const c = compareFoods([spinach, kale], "100kcal")
    expect(row(c, "energy").values[0]).toBeCloseTo(100)
    expect(row(c, "energy").values[1]).toBeCloseTo(100)
    // Per 100 kcal spinach brings more protein, since it has fewer calories.
    expect(row(c, "protein").best).toBe(0)
  })

  it("keeps gaps as null, never zero", () => {
    const c = compareFoods([spinach, kale], "100g")
    expect(row(c, "iodine").values).toEqual([null, null])
    expect(row(c, "iodine").best).toBeNull()
  })

  it("uses personal targets over Daily Values when given", () => {
    const c = compareFoods([spinach], "100g", undefined, { iron: 8 })
    expect(row(c, "iron").pctDv[0]).toBeCloseTo((2.71 / 8) * 100)
  })

  it("blanks a food entirely when the basis can't apply to it", () => {
    const water = { profile: { energy: 0, sodium: 4 } }
    const c = compareFoods([spinach, water], "100kcal")
    expect(c.factors[1]).toBeNull()
    expect(row(c, "sodium").values[1]).toBeNull()
  })
})

describe("summaries", () => {
  it("lists where each food clearly leads", () => {
    const c = compareFoods([spinach, kale], "100g")
    const [forSpinach, forKale] = standouts(c)
    expect(forKale[0]).toMatchObject({ nutrient: NUTRIENT_BY_KEY.vitC })
    expect(forKale[0].ratio).toBeCloseTo(93.4 / 28.1)
    expect(forKale.map((x) => x.nutrient.key)).toContain("calcium")
    expect(forSpinach.map((x) => x.nutrient.key)).toEqual(["iron"])
  })

  it("counts wins only where every food has data", () => {
    const c = compareFoods([spinach, kale], "100g")
    // Contested: protein, calcium, iron, sodium, vitC. Spinach wins iron; kale the other four.
    expect(winCounts(c)).toEqual({ wins: [1, 4], contested: 5 })
  })
})
