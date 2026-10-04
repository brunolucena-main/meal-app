import { describe, expect, it } from "vitest"

import { NUTRIENTS, resolveNutrients } from "./nutrients"

describe("resolveNutrients", () => {
  it("uses the first reported id in priority order", () => {
    // SR Legacy energy (1008) wins over Atwater specific (2048).
    expect(resolveNutrients(new Map([[1008, 23], [2048, 21]])).energy).toBe(23)
    // Foundation Foods without 1008 fall back to Atwater specific, then general.
    expect(resolveNutrients(new Map([[2048, 21], [2047, 22]])).energy).toBe(21)
    expect(resolveNutrients(new Map([[2047, 22]])).energy).toBe(22)
  })

  it("leaves missing nutrients out instead of turning them into zero", () => {
    const out = resolveNutrients(new Map([[1003, 2.9]]))
    expect(out).toEqual({ protein: 2.9 })
    expect("iodine" in out).toBe(false)
  })

  it("keeps real zeros", () => {
    expect(resolveNutrients(new Map([[1253, 0]])).cholesterol).toBe(0)
  })

  it("has unique keys and ids", () => {
    const keys = NUTRIENTS.map((n) => n.key)
    expect(new Set(keys).size).toBe(keys.length)
    const ids = NUTRIENTS.flatMap((n) => [...n.fdcIds])
    expect(new Set(ids).size).toBe(ids.length)
  })
})
