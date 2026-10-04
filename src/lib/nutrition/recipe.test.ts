import { describe, expect, it } from "vitest"

import { per100g, perServing, recipeNutrition } from "./recipe"

const oats = { foodId: 1, name: "Oats", grams: 80, profile: { energy: 379, protein: 13.2, fiber: 10.1, iron: 4.3 } }
const milk = { foodId: 2, name: "Milk", grams: 250, profile: { energy: 50, protein: 3.3, calcium: 120 } }

describe("recipeNutrition", () => {
  it("sums by weight", () => {
    const r = recipeNutrition([oats, milk])
    expect(r.totalGrams).toBe(330)
    expect(r.totals.energy).toBeCloseTo(379 * 0.8 + 50 * 2.5)
    expect(r.totals.protein).toBeCloseTo(13.2 * 0.8 + 3.3 * 2.5)
  })

  it("marks totals as partial when an ingredient lacks data", () => {
    const r = recipeNutrition([oats, milk])
    expect(r.totals.calcium).toBeCloseTo(300)
    expect(r.partial.calcium).toEqual(["Oats"])
    expect(r.partial.energy).toBeUndefined()
  })

  it("leaves a nutrient out when no ingredient reports it", () => {
    expect(recipeNutrition([oats, milk]).totals.iodine).toBeUndefined()
  })

  it("ignores zero-gram rows", () => {
    expect(recipeNutrition([{ ...oats, grams: 0 }, milk]).partial.calcium).toBeUndefined()
  })
})

describe("scaling", () => {
  const { totals, totalGrams } = recipeNutrition([oats, milk])

  it("divides by servings", () => {
    expect(perServing(totals, 2).energy).toBeCloseTo(totals.energy! / 2)
  })

  it("uses the cooked weight for per 100 g when given", () => {
    expect(per100g(totals, totalGrams).energy).toBeCloseTo((totals.energy! / 330) * 100)
    expect(per100g(totals, totalGrams, 300).energy).toBeCloseTo((totals.energy! / 300) * 100)
  })
})
