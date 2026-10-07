import { describe, expect, it } from "vitest"

import { bestBridge, fit, flavorMatcher, nameCandidates, rankCompanions, rarePairs, singular } from "./guide"
import { balanceGaps, dishTasteProfile } from "./tastes"

describe("matching recipe foods to FlavorGraph", () => {
  const usda: Record<number, string> = { 1: "Blueberries, raw", 2: "Oil, olive, salad or cooking", 3: "Yogurt, plain, whole milk" }
  const match = flavorMatcher(
    [
      { id: 10, name: "Blueberry", foodId: 1 },
      { id: 11, name: "Olive oil", foodId: null },
      { id: 12, name: "Greek yogurt", foodId: null },
      { id: 13, name: "Yogurt", foodId: 3 },
    ],
    (id) => usda[id]
  )

  it("uses the same USDA food, another form of it, or the name", () => {
    expect(match({ id: 1, description: "Blueberries, raw" })).toBe(10)
    expect(match({ id: 99, description: "Blueberries, frozen, unsweetened" })).toBe(10)
    expect(match({ id: 2, description: "Oil, olive, salad or cooking" })).toBe(11)
    expect(match({ id: 98, description: "Yogurt, Greek, plain, nonfat" })).toBe(12) // "greek yogurt" before "yogurt"
    expect(match({ id: 97, description: "Yogurt, vanilla, low fat" })).toBe(13)
    expect(match({ id: 900000001, description: "Lomitos de atún al natural (Día)" })).toBeNull()
  })

  it("reads names out of USDA descriptions", () => {
    expect(nameCandidates("Oil, olive, salad or cooking")).toEqual(["olive oil", "olive", "oil"])
    expect(nameCandidates("Fish, tuna, light")).toEqual(["tuna fish", "tuna", "fish"])
    expect(nameCandidates("Yogurt, vanilla, low fat")).toEqual(["vanilla yogurt", "yogurt"])
    expect(singular("Berries")).toBe("berry")
    expect(singular("Tomatoes")).toBe("tomato")
    expect(singular("Swiss")).toBe("swiss")
  })
})

describe("dish tastes and balance", () => {
  it("takes sweet, salty, rich from the dish and tags from ingredient names", () => {
    const dish = dishTasteProfile(
      [
        { name: "Bananas, raw", grams: 120 },
        { name: "Lemon juice, raw", grams: 5 }, // dominant sour: counts in any amount
        { name: "Spinach, raw", grams: 3 }, // mild bitter, under 5% of the dish: ignored
      ],
      { sugars: 11, sodium: 2, fat: 0.3 }
    )
    expect(dish).toEqual({ sweet: 1, sour: 2 })
  })

  it("names the contrasts a dish is missing", () => {
    const gaps = balanceGaps({ rich: 2, sweet: 1 })
    expect(gaps[0]).toMatchObject({ mine: "rich", theirs: "sour", strength: 2 })
    // One suggestion per missing taste.
    expect(new Set(gaps.map((g) => g.theirs)).size).toBe(gaps.length)
    expect(balanceGaps({ rich: 2, sour: 1, bitter: 1, spicy: 1 }).find((g) => g.mine === "rich")).toBeUndefined()
  })
})

describe("ranking additions", () => {
  // 1 oats, 2 banana, 3 cinnamon, 4 tuna, 5 honey
  const edges = new Map<string, number>([
    ["1-3", 0.5],
    ["2-3", 0.4],
    ["1-5", 0.6],
    ["1-2", 0.6],
  ])
  const together = (a: number, b: number) => edges.get(`${Math.min(a, b)}-${Math.max(a, b)}`)

  it("prefers ingredients that suit the whole recipe", () => {
    const ranked = rankCompanions([1, 2], [3, 4, 5], together)
    expect(ranked.map((c) => c.id)).toEqual([3, 5]) // cinnamon goes with both; honey only with oats
    expect(ranked[0].with).toEqual([1, 2])
    expect(fit([1, 2], 3, together)).toBeCloseTo(0.45)
  })

  it("finds rarely combined pairs and a bridge between them", () => {
    expect(rarePairs([1, 2, 4], together)).toEqual([
      [1, 4],
      [2, 4],
    ])
    const a = new Map([
      [3, 0.5],
      [5, 0.6],
    ])
    const b = new Map([
      [3, 0.4],
      [5, 0.1],
    ])
    expect(bestBridge(a, b, () => true)).toEqual({ id: 3, strength: 0.4 })
    expect(bestBridge(a, b, (id) => id !== 3)).toEqual({ id: 5, strength: 0.1 })
  })
})
