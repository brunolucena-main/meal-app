import { describe, expect, it } from "vitest"

import { customFoodLook, isCustomFoodId, matchesQuery, parseCustomFoodForm, toFormValues, type CustomFoodForm } from "./custom"

const base: CustomFoodForm = { name: "Semi-skimmed milk", brand: "Hacendado", basisGrams: "100", nutrients: {}, portions: [], allergens: [] }

describe("parseCustomFoodForm", () => {
  it("keeps blank nutrients missing, not zero", () => {
    const r = parseCustomFoodForm({ ...base, nutrients: { energy: "46", protein: "3,1", fat: "" } })
    expect(r).toEqual(expect.objectContaining({ ok: true }))
    if (!r.ok) return
    expect(r.food.nutrients).toEqual({ energy: 46, protein: 3.1 })
    expect("fat" in r.food.nutrients).toBe(false)
  })

  it("scales per-serving label values to per 100 g", () => {
    const r = parseCustomFoodForm({ ...base, basisGrams: "250", nutrients: { energy: "115", calcium: "300" } })
    if (!r.ok) throw new Error(r.error)
    expect(r.food.nutrients.energy).toBeCloseTo(46)
    expect(r.food.nutrients.calcium).toBeCloseTo(120)
  })

  it("turns salt into sodium when sodium is blank", () => {
    const r = parseCustomFoodForm({ ...base, nutrients: { energy: "46" }, salt: "0.13" })
    if (!r.ok) throw new Error(r.error)
    expect(r.food.nutrients.sodium).toBeCloseTo(52)
    const both = parseCustomFoodForm({ ...base, nutrients: { sodium: "40" }, salt: "0.13" })
    if (!both.ok) throw new Error(both.error)
    expect(both.food.nutrients.sodium).toBe(40)
  })

  it("rejects bad input", () => {
    expect(parseCustomFoodForm({ ...base, name: " " }).ok).toBe(false)
    expect(parseCustomFoodForm({ ...base, basisGrams: "0", nutrients: { energy: "1" } }).ok).toBe(false)
    expect(parseCustomFoodForm({ ...base, nutrients: {} }).ok).toBe(false)
    expect(parseCustomFoodForm({ ...base, nutrients: { protein: "-1" } }).ok).toBe(false)
    expect(parseCustomFoodForm({ ...base, nutrients: { protein: "abc" } }).ok).toBe(false)
    expect(parseCustomFoodForm({ ...base, nutrients: { protein: "60", carbs: "80" } }).ok).toBe(false)
    expect(parseCustomFoodForm({ ...base, nutrients: { energy: "1" }, portions: [{ label: "1 glass", grams: "" }] }).ok).toBe(false)
  })

  it("keeps filled portions, skips empty rows", () => {
    const r = parseCustomFoodForm({
      ...base,
      nutrients: { energy: "46" },
      portions: [
        { label: "1 glass", grams: "250" },
        { label: "", grams: "" },
      ],
    })
    if (!r.ok) throw new Error(r.error)
    expect(r.food.portions).toEqual([{ label: "1 glass", gramWeight: 250 }])
  })

  it("tags allergens from the name and from the ticked boxes", () => {
    const named = parseCustomFoodForm({ ...base, name: "Praline spread", nutrients: { energy: "540" } })
    if (!named.ok) throw new Error(named.error)
    expect(named.food.allergens).toEqual(["hazelnut"])
    const ticked = parseCustomFoodForm({ ...base, nutrients: { energy: "46" }, allergens: ["hazelnut", "nonsense"] })
    if (!ticked.ok) throw new Error(ticked.error)
    expect(ticked.food.allergens).toEqual(["hazelnut"])
  })
})

describe("custom food helpers", () => {
  it("ids stay clear of USDA ids", () => {
    expect(isCustomFoodId(2_705_000)).toBe(false)
    expect(isCustomFoodId(900_000_001)).toBe(true)
  })

  it("matches every query word as a prefix", () => {
    expect(matchesQuery("Semi-skimmed milk (Hacendado)", "milk haci")).toBe(false)
    expect(matchesQuery("Semi-skimmed milk (Hacendado)", "mil hacen")).toBe(true)
    expect(matchesQuery("Semi-skimmed milk", "")).toBe(false)
  })

  it("groups and colors from the category", () => {
    expect(customFoodLook({ name: "Milk", brand: null, category: "Dairy and Egg Products" }).group).toBe("dairy")
    expect(customFoodLook({ name: "Mystery bar", brand: null, category: null }).group).toBe("other")
  })
})

describe("toFormValues", () => {
  it("round-trips through the parser", () => {
    const r = parseCustomFoodForm({ ...base, nutrients: { energy: "46", sodium: "52" }, portions: [{ label: "1 glass", grams: "250" }] })
    if (!r.ok) throw new Error(r.error)
    const v = toFormValues(r.food)
    const again = parseCustomFoodForm({ ...v, basisGrams: "100" })
    expect(again).toEqual(r)
  })
})
