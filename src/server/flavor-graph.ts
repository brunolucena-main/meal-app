import { contrast, tasteProfile, type Contrast, type TasteProfile } from "@/lib/flavor/tastes"
import { similarity, toVector } from "@/lib/nutrition/similarity"
import type { Targets } from "@/lib/nutrition/targets"
import { getCatalog } from "@/server/catalog"
import { libsql } from "@/server/db/client"
import { listFlavorIngredients, type FlavorIngredient } from "@/server/flavor"

/**
 * The curated FlavorGraph ingredients with their tastes and cooked-together links, held in
 * memory for whole-graph questions (opposites, bridges, swaps, the map).
 */
type Graph = {
  ingredients: Map<number, FlavorIngredient & { tastes: TasteProfile }>
  together: Map<number, Map<number, number>>
}

const cache = globalThis as unknown as { flavorGraph?: Promise<Graph> }

async function load(): Promise<Graph> {
  const [list, catalog, slugs, edges] = await Promise.all([
    listFlavorIngredients(),
    getCatalog(),
    libsql.execute("SELECT id, slug, curated FROM flavor_ingredients"),
    libsql.execute("SELECT a, b, score FROM flavor_cooccur"),
  ])
  const foods = new Map(catalog.map((f) => [f.id, f]))
  const slugOf = new Map(slugs.rows.map((r) => [Number(r.id), String(r.slug)]))
  const ingredients = new Map(
    list.map((i) => [
      i.id,
      { ...i, tastes: tasteProfile(slugOf.get(i.id) ?? "", i.foodId !== null ? foods.get(i.foodId)?.profile : undefined) },
    ])
  )

  // FlavorGraph splits staples into many entries ("pork_chop", "ground_pork", "lemon_zest").
  // Fold each one into the curated ingredient whose name it contains as whole words (the
  // longest such name), so "pork" inherits the recipe links of all its cuts.
  const curated = slugs.rows.filter((r) => Number(r.curated) === 1).map((r) => ({ id: Number(r.id), words: String(r.slug).split("_") }))
  const canonical = new Map<number, number>()
  for (const r of slugs.rows) {
    const id = Number(r.id)
    if (Number(r.curated) === 1) {
      canonical.set(id, id)
      continue
    }
    const words = String(r.slug).split("_")
    let best: { id: number; size: number } | null = null
    for (const c of curated) {
      if (c.words.length > words.length || (best && c.words.length <= best.size)) continue
      for (let i = 0; i + c.words.length <= words.length; i++) {
        if (c.words.every((w, j) => words[i + j] === w)) {
          best = { id: c.id, size: c.words.length }
          break
        }
      }
    }
    if (best) canonical.set(id, best.id)
  }

  const together = new Map<number, Map<number, number>>()
  for (const r of edges.rows) {
    const a = canonical.get(Number(r.a))
    const b = canonical.get(Number(r.b))
    if (a === undefined || b === undefined || a === b) continue
    const score = Number(r.score)
    if (!together.has(a)) together.set(a, new Map())
    const row = together.get(a)!
    if (score > (row.get(b) ?? 0)) row.set(b, score)
  }
  return { ingredients, together }
}

export function getFlavorGraph(): Promise<Graph> {
  cache.flavorGraph ??= load()
  return cache.flavorGraph
}

export type Node = FlavorIngredient & { tastes: TasteProfile }

/** Not ingredients you'd pair: leavening, ready-made dishes. */
const NOT_FOR_PAIRING = new Set(["ETC", "Dish/End Product"])
const NOT_FOR_PAIRING_NAMES = /baking soda|baking powder|yeast|cream of tartar|gelatin|corn ?starch|food coloring|water/i

export const pairable = (i: FlavorIngredient) => !NOT_FOR_PAIRING.has(i.category ?? "") && !NOT_FOR_PAIRING_NAMES.test(i.name)

export type Opposite = { ingredient: Node; contrast: Contrast; together: number | null; score: number }

/** Partners whose taste balances this one, favoring pairs recipes actually use. */
export async function opposites(id: number, limit = 15): Promise<{ self: Node; list: Opposite[] } | null> {
  const g = await getFlavorGraph()
  const self = g.ingredients.get(id)
  if (!self) return null
  const mine = g.together.get(id) ?? new Map()
  const list: Opposite[] = []
  for (const other of g.ingredients.values()) {
    if (other.id === id || !pairable(other)) continue
    const c = contrast(self.tastes, other.tastes)
    if (!c) continue
    const t = mine.get(other.id) ?? null
    // Pairs recipes never combine only count when both tastes are strong.
    if (t === null && c.score < 4) continue
    list.push({ ingredient: other, contrast: c, together: t, score: c.score * (0.3 + (t ?? 0)) })
  }
  list.sort((a, b) => b.score - a.score || (b.together ?? 0) - (a.together ?? 0))
  return { self, list: list.slice(0, limit) }
}

export type Bridge = {
  /** One ingredient between A and B, or two for a longer chain (A -> first -> second -> B). */
  path: Node[]
  /** Link strengths along the chain, from A to B. */
  links: number[]
  /** The weakest link: how well the whole chain holds together. */
  strength: number
}

/**
 * Ingredients that connect A and B through recipes. One-step bridges (cooked with both) come
 * first; when there are none, two-step chains A -> X -> Y -> B. Ranked by the weakest link.
 */
export async function bridges(a: number, b: number, limit = 10): Promise<{ direct: number | null; list: Bridge[] }> {
  const g = await getFlavorGraph()
  const ta = g.together.get(a) ?? new Map<number, number>()
  const tb = g.together.get(b) ?? new Map<number, number>()
  const node = (id: number) => g.ingredients.get(id)
  const list: Bridge[] = []
  for (const [z, withA] of ta) {
    const withB = tb.get(z)
    if (z === b || withB === undefined || !node(z)) continue
    list.push({ path: [node(z)!], links: [withA, withB], strength: Math.min(withA, withB) })
  }
  if (list.length === 0) {
    for (const [x, ax] of ta) {
      if (x === b || !node(x)) continue
      const tx = g.together.get(x)
      if (!tx) continue
      for (const [y, yb] of tb) {
        if (y === a || y === x || !node(y)) continue
        const xy = tx.get(y)
        if (xy === undefined) continue
        list.push({ path: [node(x)!, node(y)!], links: [ax, xy, yb], strength: Math.min(ax, xy, yb) })
      }
    }
  }
  list.sort((p, q) => q.strength - p.strength)
  return { direct: ta.get(b) ?? null, list: list.slice(0, limit) }
}

export type Swap = { ingredient: Node; context: number; nutrition: number | null; score: number }

function cosine(a: Map<number, number>, b: Map<number, number>, skip: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (const [k, v] of a) if (!skip.includes(k)) na += v * v
  for (const [k, v] of b) {
    if (skip.includes(k)) continue
    nb += v * v
    const w = a.get(k)
    if (w !== undefined) dot += v * w
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

/**
 * Ingredients that can stand in: used with the same partners in recipes (cosine of their
 * cooked-together profiles), and nutritionally close when both have a USDA match.
 */
export async function swaps(id: number, targets: Targets, limit = 10): Promise<Swap[]> {
  const g = await getFlavorGraph()
  const self = g.ingredients.get(id)
  const mine = g.together.get(id)
  if (!self || !mine) return []
  const foods = new Map((await getCatalog()).map((f) => [f.id, f]))
  const selfFood = self.foodId !== null ? foods.get(self.foodId) : undefined
  const selfVector = selfFood ? toVector(selfFood.profile, targets) : null
  const base = self.name.toLowerCase()
  const out: Swap[] = []
  for (const other of g.ingredients.values()) {
    if (other.id === id) continue
    // "Reduced fat feta cheese" is a variant of feta, not a swap.
    const name = other.name.toLowerCase()
    if (name.includes(base) || base.includes(name)) continue
    const theirs = g.together.get(other.id)
    if (!theirs) continue
    const context = cosine(mine, theirs, [id, other.id])
    if (context < 0.2) continue
    const food = other.foodId !== null ? foods.get(other.foodId) : undefined
    const nutrition = selfVector && food ? similarity(selfVector, toVector(food.profile, targets)) : null
    out.push({ ingredient: other, context, nutrition, score: nutrition === null ? context * 0.8 : context * 0.6 + nutrition * 0.4 })
  }
  // One row per ingredient: "Fresh basil" and "Basil" are the same suggestion.
  const kept: Swap[] = []
  for (const swap of out.sort((a, b) => b.score - a.score)) {
    const name = swap.ingredient.name.toLowerCase()
    if (kept.some((k) => name.includes(k.ingredient.name.toLowerCase()) || k.ingredient.name.toLowerCase().includes(name))) continue
    kept.push(swap)
    if (kept.length === limit) break
  }
  return kept
}

export type MapNode = { ingredient: Node; x: number; y: number; strength: number }
export type MapEdge = { a: number; b: number; score: number }

/**
 * Ego network for the flavor map: the strongest partners placed around the center (closer =
 * cooked together more), plus the links among those partners.
 */
export async function flavorMap(id: number, size = 14): Promise<{ center: Node; nodes: MapNode[]; edges: MapEdge[] } | null> {
  const g = await getFlavorGraph()
  const center = g.ingredients.get(id)
  if (!center) return null
  const partners = [...(g.together.get(id) ?? new Map()).entries()]
    .filter(([z]) => g.ingredients.has(z))
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
  const max = partners[0]?.[1] ?? 1
  const nodes = partners.map(([z, score], i) => {
    const angle = (i / partners.length) * Math.PI * 2 - Math.PI / 2
    const radius = 0.42 - 0.2 * (score / max)
    return { ingredient: g.ingredients.get(z)!, x: 0.5 + radius * Math.cos(angle), y: 0.5 + radius * Math.sin(angle), strength: score / max }
  })
  const ids = nodes.map((n) => n.ingredient.id)
  const edges: MapEdge[] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const s = g.together.get(ids[i])?.get(ids[j])
      if (s !== undefined && s >= 0.2) edges.push({ a: ids[i], b: ids[j], score: s })
    }
  }
  return { center, nodes, edges }
}
