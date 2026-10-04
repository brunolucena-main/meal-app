import { describe, expect, it } from "vitest"

import { contrast, tasteProfile } from "./tastes"

describe("tasteProfile", () => {
  it("tags tastes by name", () => {
    expect(tasteProfile("lemon_juice").sour).toBe(2)
    expect(tasteProfile("radicchio").bitter).toBe(2)
    expect(tasteProfile("soy_sauce").umami).toBe(2)
    expect(tasteProfile("jalapeno").spicy).toBe(2)
  })

  it("matches whole words only", () => {
    expect(tasteProfile("graham_cracker_crumb").umami).toBeUndefined()
    expect(tasteProfile("smoked_ham").umami).toBe(1)
    expect(tasteProfile("pineapple").sour).toBeUndefined()
  })

  it("reads sweet, salty and rich from nutrients", () => {
    expect(tasteProfile("heavy_cream", { fat: 36, sugars: 3, sodium: 27 })).toEqual({ rich: 2 })
    expect(tasteProfile("raisin", { sugars: 59, fat: 0.5 }).sweet).toBe(2)
    expect(tasteProfile("feta_cheese", { sodium: 1116, fat: 21 })).toMatchObject({ salty: 2, rich: 2 })
  })
})

describe("contrast", () => {
  const spinach = tasteProfile("spinach", { sugars: 0.4, sodium: 79, fat: 0.4 })
  const cream = tasteProfile("heavy_cream", { fat: 36, sugars: 3, sodium: 27 })

  it("finds a balancing contrast", () => {
    const c = contrast(spinach, cream)!
    expect(c.reason).toBe("Richness softens bitterness")
    expect(contrast(cream, tasteProfile("lemon"))!.reason).toBe("Acid cuts richness")
  })

  it("returns null when tastes don't balance", () => {
    expect(contrast(spinach, tasteProfile("kale"))).toBeNull()
  })

  it("doesn't pair a taste with something just as strong in it", () => {
    const butter = { rich: 2 as const }
    expect(contrast(butter, { rich: 2, sour: 1 })).toBeNull()
  })
})
