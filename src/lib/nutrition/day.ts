/**
 * Day math: what was eaten, what is still planned, and what is left to reach the targets.
 *
 * Plans and logs share one model: an entry is "planned" until it is marked "eaten". Each entry
 * already carries its nutrients (a food scaled by grams, or a recipe scaled by servings), so
 * this module only adds them up. Missing data keeps the partial markers from the recipe math.
 */
import { NUTRIENTS, type NutrientKey } from "./nutrients"
import type { Targets } from "./targets"

export type Profile = Partial<Record<NutrientKey, number>>
export type EntryStatus = "planned" | "eaten"
export type Slot = "breakfast" | "lunch" | "dinner" | "snack"

export const SLOTS: { value: Slot; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snacks" },
]

export type DayEntryNutrition = { status: EntryStatus; nutrients: Profile; partial: NutrientKey[] }

export type DayTotals = {
  eaten: Profile
  planned: Profile
  /** Eaten plus still planned: where the day ends up if the plan holds. */
  projected: Profile
  /** Nutrients where at least one counted entry lacks data. */
  partial: NutrientKey[]
}

function add(into: Profile, from: Profile) {
  for (const [k, v] of Object.entries(from)) {
    const key = k as NutrientKey
    into[key] = (into[key] ?? 0) + v
  }
}

export function dayTotals(entries: DayEntryNutrition[]): DayTotals {
  const eaten: Profile = {}
  const planned: Profile = {}
  const partial = new Set<NutrientKey>()
  for (const e of entries) {
    add(e.status === "eaten" ? eaten : planned, e.nutrients)
    for (const k of e.partial) partial.add(k)
  }
  const projected: Profile = { ...eaten }
  add(projected, planned)
  return { eaten, planned, projected, partial: [...partial] }
}

/**
 * Remaining amounts to reach each goal target. Only goal nutrients with a target; a nutrient
 * already met is left out. Limits are not gaps.
 */
export function gaps(targets: Targets, consumed: Profile): Profile {
  const out: Profile = {}
  for (const n of NUTRIENTS) {
    if (n.kind !== "goal") continue
    const target = targets[n.key]
    if (!target) continue
    const left = target - (consumed[n.key] ?? 0)
    if (left > 0) out[n.key] = left
  }
  return out
}

/**
 * Biggest gaps first, as a share of the target. With `skipUnknown`, nutrients that nothing
 * eaten or planned reports (iodine, often) are left out: they are unknowns, not gaps.
 */
export function largestGaps(targets: Targets, consumed: Profile, count: number, skipUnknown = false): NutrientKey[] {
  const g = gaps(targets, consumed)
  return (Object.keys(g) as NutrientKey[])
    .filter((k) => !skipUnknown || consumed[k] !== undefined)
    .sort((a, b) => g[b]! / targets[b]! - g[a]! / targets[a]!)
    .slice(0, count)
}

/** Local calendar helpers (the app runs on the user's own machine, so local time is right). */
export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function parseIsoDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isoDate(d) === s ? d : null
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso)!
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

/** Monday of the week containing the date. */
export function weekStart(iso: string): string {
  const d = parseIsoDate(iso)!
  const offset = (d.getDay() + 6) % 7
  return addDays(iso, -offset)
}
