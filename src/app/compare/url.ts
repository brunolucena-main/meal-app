import type { Basis } from "@/lib/nutrition/compare"

export const MAX_FOODS = 4

export type CompareState = {
  ids: number[]
  basis: Basis
  /** Chosen portion per food id, for the "serving" basis. */
  portions: Record<number, number>
  all: boolean
}

type Params = Record<string, string | string[] | undefined>

export function parseCompareState(params: Params): CompareState {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""
  const ids = [...new Set(one(params.ids).split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(
    0,
    MAX_FOODS
  )
  const basisRaw = one(params.basis)
  const basis: Basis = basisRaw === "100kcal" || basisRaw === "serving" ? basisRaw : "100g"
  const portions: Record<number, number> = {}
  for (const pair of one(params.portions).split(",")) {
    const [food, portion] = pair.split(":").map(Number)
    if (Number.isInteger(food) && Number.isInteger(portion)) portions[food] = portion
  }
  return { ids, basis, portions, all: one(params.all) === "1" }
}

export function compareHref(state: CompareState): string {
  const parts: string[] = []
  if (state.ids.length) parts.push(`ids=${state.ids.join(",")}`)
  if (state.basis !== "100g") parts.push(`basis=${state.basis}`)
  const portions = Object.entries(state.portions)
    .filter(([food]) => state.ids.includes(Number(food)))
    .map(([food, portion]) => `${food}:${portion}`)
  if (portions.length) parts.push(`portions=${portions.join(",")}`)
  if (state.all) parts.push("all=1")
  return parts.length ? `/compare?${parts.join("&")}` : "/compare"
}
