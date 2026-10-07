import { describe, expect, it } from "vitest"

import { groupFamilies, ingredientDiff, shortFoodName } from "./variants"

const yogurt = { foodId: 1, name: "Yogurt", grams: 200 }
const blueberries = { foodId: 2, name: "Blueberries", grams: 80 }
const raspberries = { foodId: 3, name: "Raspberries", grams: 80 }

describe("ingredientDiff", () => {
  it("lists swapped, added and resized ingredients", () => {
    const diff = ingredientDiff([yogurt, blueberries], [{ ...yogurt, grams: 150 }, raspberries])
    expect(diff.added.map((i) => i.name)).toEqual(["Raspberries"])
    expect(diff.removed.map((i) => i.name)).toEqual(["Blueberries"])
    expect(diff.changed).toEqual([{ foodId: 1, name: "Yogurt", from: 200, to: 150 }])
  })

  it("sums repeated foods and ignores rounding", () => {
    const diff = ingredientDiff([yogurt], [{ ...yogurt, grams: 100 }, { ...yogurt, grams: 100.2 }])
    expect(diff).toEqual({ added: [], removed: [], changed: [] })
  })
})

describe("groupFamilies", () => {
  it("keeps variants next to their recipe, families by most recent member", () => {
    const list = [
      { id: 5, parentId: 1 }, // most recently edited: a variant of 1
      { id: 4, parentId: null },
      { id: 1, parentId: null },
      { id: 3, parentId: 1 },
    ]
    expect(groupFamilies(list).map((r) => r.id)).toEqual([1, 3, 5, 4])
  })
})

describe("shortFoodName", () => {
  it("keeps the food, drops the details", () => {
    expect(shortFoodName("Blueberries, raw")).toBe("Blueberries")
    expect(shortFoodName("Fish, tuna, light, canned in water, drained solids")).toBe("Fish, tuna")
    expect(shortFoodName("Yogurt, Greek, plain, nonfat")).toBe("Yogurt, Greek")
    expect(shortFoodName("Lomitos de atún al natural (Día)")).toBe("Lomitos de atún al natural (Día)")
  })
})
