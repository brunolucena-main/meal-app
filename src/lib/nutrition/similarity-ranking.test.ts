import { describe, expect, it } from "vitest"

import { rankFood } from "./ranking"
import { similarity, toVector, variantKey } from "./similarity"
import { computeTargets, DEFAULT_PROFILE } from "./targets"

const targets = computeTargets(DEFAULT_PROFILE)

// Approximate USDA values per 100 g.
const base = { thiamin: 0.08, riboflavin: 0.19, niacin: 0.72, vitB6: 0.2, folate: 194, vitE: 2, zinc: 0.53, phosphorus: 49 }
const spinach = { ...base, energy: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugars: 0.4, sodium: 79, potassium: 558, calcium: 99, iron: 2.7, magnesium: 79, vitA: 469, vitC: 28, vitK: 483 }
const chard = { ...base, energy: 19, protein: 1.8, carbs: 3.7, fat: 0.2, fiber: 1.6, sugars: 1.1, sodium: 213, potassium: 379, calcium: 51, iron: 1.8, magnesium: 81, vitA: 306, vitC: 30, vitK: 830 }
const oil = { energy: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugars: 0, sodium: 2, potassium: 1, calcium: 1, iron: 0.6, vitE: 14, vitK: 60, magnesium: 0 }

describe("similarity", () => {
  it("is 1 for identical profiles and symmetric", () => {
    const a = toVector(spinach, targets)
    const b = toVector(chard, targets)
    expect(similarity(a, a)).toBeCloseTo(1)
    expect(similarity(a, b)).toBeCloseTo(similarity(b, a)!)
  })

  it("finds another leafy green closer than an oil", () => {
    const s = toVector(spinach, targets)
    expect(similarity(s, toVector(chard, targets))!).toBeGreaterThan(similarity(s, toVector(oil, targets))!)
  })

  it("refuses to judge with too few shared nutrients", () => {
    expect(similarity(toVector(spinach, targets), toVector({ energy: 20, protein: 2 }, targets))).toBeNull()
    expect(similarity(toVector({ energy: 20, protein: 2, fat: 1 }, targets), toVector(spinach, targets))).toBeNull()
  })

  it("compares a food copied from a label (few nutrients) with fully reported ones", () => {
    // Canned tuna in water from a label: no carbs, no vitamins.
    const label = toVector({ energy: 88, protein: 20.7, fat: 0.6, satFat: 0.23, sodium: 467 }, targets)
    const usdaTuna = toVector({ ...base, energy: 86, protein: 19.4, carbs: 0, fat: 0.96, satFat: 0.23, sodium: 247, potassium: 179, calcium: 14, iron: 1.5 }, targets)
    const tunaScore = similarity(label, usdaTuna)
    expect(tunaScore).not.toBeNull()
    // The USDA food reporting more nutrients than the label is not held against it.
    expect(tunaScore!).toBeGreaterThan(0.6)
    expect(tunaScore!).toBeGreaterThan(similarity(label, toVector(oil, targets)) ?? 0)
  })
})

describe("variantKey", () => {
  it("groups variants of one food", () => {
    expect(variantKey("Spinach, raw")).toBe(variantKey("Spinach, cooked, boiled, drained"))
    expect(variantKey("Fish, salmon, Atlantic, raw")).toBe("fish, salmon")
    expect(variantKey("Fish, salmon, raw")).not.toBe(variantKey("Fish, cod, Atlantic, raw"))
  })
})

describe("rankFood", () => {
  it("scores coverage of what you want, capped per nutrient", () => {
    const r = rankFood(spinach, { magnesium: 420 }, "100g", targets)!
    expect(r.coverage.magnesium).toBeCloseTo(79 / 420)
    expect(r.score).toBeCloseTo(79 / 420)
    const k = rankFood(spinach, { vitK: 120 }, "100g", targets)!
    expect(k.score).toBe(1)
  })

  it("leaves out foods missing a wanted nutrient", () => {
    expect(rankFood({ energy: 50 }, { magnesium: 420 }, "100g", targets)).toBeNull()
  })

  it("per 100 kcal, penalizes foods that burn the sodium budget fast", () => {
    const salty = { ...spinach, sodium: 1200 }
    const plain = rankFood(spinach, { magnesium: 420 }, "100kcal", targets)!
    const r = rankFood(salty, { magnesium: 420 }, "100kcal", targets)!
    expect(r.score).toBeLessThan(plain.score)
    expect(r.flags).toContain("sodium")
  })
})
