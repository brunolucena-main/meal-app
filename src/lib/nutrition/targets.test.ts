import { describe, expect, it } from "vitest"

import { computeTargets, DEFAULT_PROFILE, energyTarget, resolveTargets, restingEnergy, upperLimits } from "./targets"

describe("energy", () => {
  it("uses Mifflin-St Jeor", () => {
    // 10*75 + 6.25*175 - 5*35 + 5 = 1673.75
    expect(restingEnergy(DEFAULT_PROFILE)).toBeCloseTo(1673.75)
    expect(restingEnergy({ ...DEFAULT_PROFILE, sex: "female" })).toBeCloseTo(1673.75 - 166)
  })

  it("applies activity and goal", () => {
    expect(energyTarget(DEFAULT_PROFILE)).toBeCloseTo(1673.75 * 1.55)
    expect(energyTarget({ ...DEFAULT_PROFILE, goal: "lose" })).toBeCloseTo(1673.75 * 1.55 * 0.85)
  })
})

describe("computeTargets", () => {
  const t = computeTargets(DEFAULT_PROFILE)

  it("splits macros so their energy adds up", () => {
    const fromMacros = t.protein! * 4 + t.fat! * 9 + t.carbs! * 4
    expect(fromMacros).toBeCloseTo(t.energy!)
    expect(t.protein).toBeCloseTo(1.4 * 75)
    expect(t.fiber).toBeCloseTo((t.energy! / 1000) * 14)
  })

  it("uses DRIs by sex and age", () => {
    expect(t.iron).toBe(8)
    expect(computeTargets({ ...DEFAULT_PROFILE, sex: "female" }).iron).toBe(18)
    expect(computeTargets({ ...DEFAULT_PROFILE, sex: "female", age: 55 }).iron).toBe(8)
    expect(computeTargets({ ...DEFAULT_PROFILE, age: 25 }).magnesium).toBe(400)
    expect(computeTargets({ ...DEFAULT_PROFILE, age: 75 }).vitD).toBe(20)
  })

  it("lets overrides win", () => {
    expect(resolveTargets(DEFAULT_PROFILE, { protein: 150 }).protein).toBe(150)
  })

  it("has upper limits only where food intake counts", () => {
    expect(upperLimits(35).calcium).toBe(2500)
    expect(upperLimits(60).calcium).toBe(2000)
    expect(upperLimits(35).vitA).toBeUndefined()
  })
})
