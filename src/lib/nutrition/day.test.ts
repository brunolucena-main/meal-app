import { describe, expect, it } from "vitest"

import { addDays, dayTotals, gaps, largestGaps, parseIsoDate, weekStart } from "./day"

describe("dayTotals", () => {
  it("splits eaten from planned and projects the day", () => {
    const t = dayTotals([
      { status: "eaten", nutrients: { energy: 400, protein: 20 }, partial: [] },
      { status: "planned", nutrients: { energy: 600, protein: 35, iron: 3 }, partial: ["iron"] },
    ])
    expect(t.eaten).toEqual({ energy: 400, protein: 20 })
    expect(t.planned.energy).toBe(600)
    expect(t.projected).toEqual({ energy: 1000, protein: 55, iron: 3 })
    expect(t.partial).toEqual(["iron"])
  })
})

describe("gaps", () => {
  const targets = { energy: 2000, protein: 100, fiber: 30, magnesium: 400, sodium: 2300 }

  it("lists what is left of goal targets only", () => {
    const g = gaps(targets, { protein: 60, fiber: 30, sodium: 1000 })
    expect(g.protein).toBe(40)
    expect(g.magnesium).toBe(400)
    expect(g.fiber).toBeUndefined() // met
    expect(g.sodium).toBeUndefined() // a limit, not a goal
    expect(g.energy).toBeUndefined() // energy is "info"
  })

  it("orders by share of target still missing", () => {
    expect(largestGaps(targets, { protein: 90, magnesium: 100, fiber: 10 }, 2)).toEqual(["magnesium", "fiber"])
  })

  it("can skip nutrients nothing reports", () => {
    expect(largestGaps(targets, { protein: 90 }, 3, true)).toEqual(["protein"])
  })
})

describe("dates", () => {
  it("validates and shifts local dates", () => {
    expect(parseIsoDate("2026-02-30")).toBeNull()
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
  })

  it("starts weeks on Monday", () => {
    expect(weekStart("2026-10-04")).toBe("2026-09-28") // a Sunday
    expect(weekStart("2026-10-05")).toBe("2026-10-05") // a Monday
  })
})
