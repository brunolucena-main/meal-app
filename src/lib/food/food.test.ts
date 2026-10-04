import { describe, expect, it } from "vitest"

import { tagAllergens } from "./allergens"
import { classifyGroup, representativeColor } from "./classify"

describe("classifyGroup", () => {
  it("splits leafy greens out of vegetables", () => {
    expect(classifyGroup("Spinach, raw", "Vegetables and Vegetable Products")).toBe("leafy")
    expect(classifyGroup("Kale, cooked, boiled", "Vegetables and Vegetable Products")).toBe("leafy")
    expect(classifyGroup("Carrots, raw", "Vegetables and Vegetable Products")).toBe("vegetable")
  })

  it("falls back to other for unmapped categories", () => {
    expect(classifyGroup("Cola", "Beverages")).toBe("other")
    expect(classifyGroup("Mystery", null)).toBe("other")
  })
})

describe("representativeColor", () => {
  it("prefers specific ingredient colors over group defaults", () => {
    expect(representativeColor("Sweet potato, raw", "vegetable")).toBe("#d9692b")
    expect(representativeColor("Potatoes, raw", "vegetable")).toBe("#c9a46a")
    expect(representativeColor("Radishes, raw", "vegetable")).toBe("#6a9a3a")
  })
})

describe("tagAllergens", () => {
  it("catches hazelnut under its other names", () => {
    expect(tagAllergens("Nuts, hazelnuts or filberts, raw")).toEqual(["hazelnut"])
    expect(tagAllergens("Candies, praline, prepared-from-recipe")).toEqual(["hazelnut"])
    expect(tagAllergens("Chocolate-flavored hazelnut spread")).toEqual(["hazelnut"])
    expect(tagAllergens("Nuts, mixed nuts, dry roasted, with peanuts")).toEqual(["hazelnut"])
  })

  it("leaves other nuts alone", () => {
    expect(tagAllergens("Nuts, almonds")).toEqual([])
    expect(tagAllergens("Nuts, walnuts, english")).toEqual([])
  })
})
