import { describe, expect, it } from "vitest"

import { aromaOverlap, categoryLook } from "./pairing"

describe("aromaOverlap", () => {
  it("is 1 for identical compound sets and 0 without overlap", () => {
    expect(aromaOverlap(50, 50, 50)).toBe(1)
    expect(aromaOverlap(0, 50, 80)).toBe(0)
  })

  it("does not reward compound-rich ingredients for size alone", () => {
    // Tea shares 117 of spinach's 137 compounds but has 391 of its own; pea shares 109 of 169.
    expect(aromaOverlap(109, 137, 169)).toBeGreaterThan(aromaOverlap(117, 137, 391))
  })
})

describe("categoryLook", () => {
  it("maps FlavorGraph categories to chip groups", () => {
    expect(categoryLook("Seafood").group).toBe("fish")
    expect(categoryLook("Beverage Alcoholic").group).toBe("other")
    expect(categoryLook(null).group).toBe("other")
  })
})
