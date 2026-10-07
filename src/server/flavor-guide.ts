import type { FoodGroup } from "@/lib/food/types"
import { bestBridge, fit, flavorMatcher, rankCompanions, rarePairs } from "@/lib/flavor/guide"
import { balanceGaps, dishTasteProfile, type BalanceGap, type TasteProfile } from "@/lib/flavor/tastes"
import type { Targets } from "@/lib/nutrition/targets"
import { getCatalog } from "@/server/catalog"
import { db, ensureMigrated } from "@/server/db/client"
import { customFoods } from "@/server/db/user-schema"
import { getFlavorGraph, pairable, swaps, type Node } from "@/server/flavor-graph"
import type { RecipeView } from "@/server/recipes"

/** An ingredient the guide suggests, addable because it has a USDA match. */
export type GuideChip = { id: number; name: string; color: string; group: FoodGroup; foodId: number }

export type FlavorGuide = {
  /** Recipe foods FlavorGraph knows, by USDA food id. */
  matched: { foodId: number; ingredient: Node }[]
  /** Recipe foods it doesn't (custom foods, unusual USDA entries). */
  unmatched: string[]
  tastes: TasteProfile
  /** Missing contrasts, each with ingredients that would supply it. */
  balance: { gap: BalanceGap; options: GuideChip[] }[]
  /** Ingredients that go with the recipe as a whole, and which of its ingredients they suit. */
  companions: { chip: GuideChip; with: string[] }[]
  /** Recipe ingredients that recipes rarely combine, with an ingredient that links them. */
  rare: { a: Node; b: Node; bridge: GuideChip | null }[]
  /** Stand-ins per recipe food (used with the same partners in recipes). */
  swapIdeas: Record<number, GuideChip[]>
}

const chip = (n: Node): GuideChip => ({ id: n.id, name: n.name, color: n.color, group: n.group, foodId: n.foodId! })

/**
 * Flavor suggestions for a recipe from FlavorGraph: what balances its tastes, what goes with
 * its ingredients, which of them rarely meet. Null when the flavor data isn't imported.
 */
export async function flavorGuide(recipe: RecipeView, settings: { allergies: string[]; targets: Targets }): Promise<FlavorGuide | null> {
  let graph: Awaited<ReturnType<typeof getFlavorGraph>>
  try {
    graph = await getFlavorGraph()
  } catch {
    return null
  }
  const catalog = new Map((await getCatalog()).map((f) => [f.id, f]))
  const match = flavorMatcher([...graph.ingredients.values()], (id) => catalog.get(id)?.description)
  // Your own foods say what they are (custom food form, "Flavor match").
  await ensureMigrated()
  const linked = new Map(
    (await db.select({ id: customFoods.id, flavorId: customFoods.flavorId }).from(customFoods))
      .filter((f) => f.flavorId !== null)
      .map((f) => [f.id, f.flavorId!])
  )

  const matched: FlavorGuide["matched"] = []
  const unmatched: string[] = []
  for (const foodId of new Set(recipe.items.map((i) => i.foodId))) {
    const item = recipe.items.find((i) => i.foodId === foodId)!
    const id = linked.get(foodId) ?? match({ id: foodId, description: item.name })
    const node = id === null ? undefined : graph.ingredients.get(id)
    if (node && !matched.some((m) => m.ingredient.id === node.id)) matched.push({ foodId, ingredient: node })
    else if (!node) unmatched.push(item.name)
  }
  const mine = matched.map((m) => m.ingredient.id)
  const inRecipe = new Set(recipe.items.map((i) => i.foodId))
  const together = (a: number, b: number) => graph.together.get(a)?.get(b)
  // Suggestions must be addable (a USDA match), not already in the dish, and allergy-safe.
  const addable = (n: Node | undefined): n is Node =>
    !!n &&
    n.foodId !== null &&
    catalog.has(n.foodId) &&
    !inRecipe.has(n.foodId) &&
    !mine.includes(n.id) &&
    pairable(n) &&
    !n.allergens.some((a) => settings.allergies.includes(a))
  const candidates = [...graph.ingredients.values()].filter(addable)

  const tastes = dishTasteProfile(
    recipe.items.map((i) => ({ name: i.name, grams: i.grams })),
    recipe.per100g
  )
  const balance = balanceGaps(tastes)
    .slice(0, 3)
    .map((gap) => ({
      gap,
      options: candidates
        .filter((c) => c.tastes[gap.theirs] && (c.tastes[gap.mine] ?? 0) < gap.strength)
        .map((c) => ({ c, fit: fit(mine, c.id, together) }))
        // Once the dish has known ingredients, only suggest what recipes cook with at least one of them.
        .filter((x) => !mine.length || x.fit >= 0.05)
        .map(({ c, fit }) => ({ c, score: c.tastes[gap.theirs]! * (0.3 + fit) }))
        .sort((x, y) => y.score - x.score || x.c.name.localeCompare(y.c.name))
        .slice(0, 5)
        .map(({ c }) => chip(c)),
    }))
    .filter((b) => b.options.length)

  const nameOf = (id: number) => graph.ingredients.get(id)?.name ?? ""
  // Each ingredient is suggested once: Balance says why, so it keeps the ones it lists.
  const inBalance = new Set(balance.flatMap((b) => b.options.map((o) => o.id)))
  const companions = rankCompanions(
    mine,
    candidates.filter((c) => !inBalance.has(c.id)).map((c) => c.id),
    together,
    8
  ).map((c) => ({ chip: chip(graph.ingredients.get(c.id)!), with: c.with.map(nameOf) }))

  const rare = rarePairs(mine, together)
    .slice(0, 3)
    .map(([a, b]) => {
      const bridge = bestBridge(graph.together.get(a) ?? new Map(), graph.together.get(b) ?? new Map(), (id) =>
        addable(graph.ingredients.get(id))
      )
      return { a: graph.ingredients.get(a)!, b: graph.ingredients.get(b)!, bridge: bridge ? chip(graph.ingredients.get(bridge.id)!) : null }
    })

  const swapIdeas: FlavorGuide["swapIdeas"] = {}
  for (const m of matched) {
    // Fruit for fruit, cheese for cheese: a swap keeps the dish's shape.
    const list = (await swaps(m.ingredient.id, settings.targets, 30))
      .map((s) => s.ingredient)
      .filter((s) => addable(s) && s.group === m.ingredient.group)
    if (list.length) swapIdeas[m.foodId] = list.slice(0, 5).map(chip)
  }

  return { matched, unmatched, tastes, balance, companions, rare, swapIdeas }
}
