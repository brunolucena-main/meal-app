/**
 * Taste profiles and contrast pairing ("opposites").
 *
 * FlavorGraph has no tastes, so each ingredient gets a small profile:
 *   - sweet, salty, rich: from its USDA match (sugars, sodium, fat per 100 g)
 *   - sour, bitter, umami, spicy: hand tags by ingredient name
 * Strength is 1 (noticeable) or 2 (dominant).
 *
 * Opposites follow the balancing rules cooks use: acid or bitterness cuts richness, salt and
 * sweetness tame bitterness, sweet balances sour, sweet and salty play off each other, and
 * richness cools heat.
 */
import type { NutrientKey } from "@/lib/nutrition/nutrients"

export type Taste = "sweet" | "sour" | "salty" | "bitter" | "umami" | "rich" | "spicy"
export type TasteProfile = Partial<Record<Taste, 1 | 2>>

export const TASTE_LABELS: Record<Taste, string> = {
  sweet: "Sweet",
  sour: "Sour",
  salty: "Salty",
  bitter: "Bitter",
  umami: "Savory",
  rich: "Rich",
  spicy: "Hot",
}

// Words for the tastes nutrients can't show, matched as whole words (plurals allowed) against
// the ingredient name, so "ham" doesn't tag "graham cracker".
const TAG_WORDS: Record<"sour" | "bitter" | "umami" | "spicy", [string[], 1 | 2][]> = {
  sour: [
    [["lemon", "lime", "vinegar", "tamarind", "sumac", "sauerkraut", "kimchi", "pickle", "cranberry", "cranberries", "rhubarb", "sorrel", "verjuice", "calamansi", "yuzu"], 2],
    [["yogurt", "buttermilk", "sour cream", "creme fraiche", "kefir", "grapefruit", "wine", "green apple", "gooseberry", "pomegranate", "tomatillo", "currant", "sourdough", "cider"], 1],
  ],
  bitter: [
    [["radicchio", "endive", "dandelion", "bitter melon", "coffee", "espresso", "cocoa", "unsweetened chocolate", "dark chocolate", "broccoli rabe", "rapini", "fenugreek"], 2],
    [["kale", "arugula", "rocket", "mustard green", "collard", "chicory", "escarole", "spinach", "beer", "tea", "walnut", "turmeric", "eggplant", "brussels sprout", "olive", "artichoke", "matcha", "hops"], 1],
  ],
  umami: [
    [["parmesan", "soy sauce", "miso", "anchovy", "anchovies", "fish sauce", "dashi", "kombu", "bonito", "shiitake", "porcini", "marmite", "worcestershire", "oyster sauce"], 2],
    [["tomato", "tomatoes", "mushroom", "seaweed", "nori", "beef", "pork", "lamb", "veal", "chicken", "turkey", "duck", "sausage", "bacon", "ham", "prosciutto", "stock", "broth", "gruyere", "cheddar", "sardine", "tuna", "shrimp", "scallop"], 1],
  ],
  spicy: [
    [["chili", "chile", "chilli", "cayenne", "habanero", "jalapeno", "serrano", "chipotle", "sriracha", "harissa", "gochujang", "wasabi", "horseradish", "hot sauce", "red pepper flake", "tabasco"], 2],
    [["black pepper", "white pepper", "ginger", "mustard", "radish", "paprika", "szechuan", "sichuan", "arugula", "watercress"], 1],
  ],
}

const TAGS = Object.fromEntries(
  Object.entries(TAG_WORDS).map(([taste, rules]) => [
    taste,
    rules.map(([words, strength]) => [new RegExp(`(?:^| )(${words.join("|")})(?:e?s)?(?= |$)`), strength] as [RegExp, 1 | 2]),
  ])
) as Record<"sour" | "bitter" | "umami" | "spicy", [RegExp, 1 | 2][]>

/** Tastes from name tags and, when known, USDA nutrients per 100 g. */
export function tasteProfile(slug: string, per100g?: Partial<Record<NutrientKey, number>>): TasteProfile {
  const p: TasteProfile = {}
  const name = slug.replace(/_/g, " ").toLowerCase()
  for (const [taste, rules] of Object.entries(TAGS) as [keyof typeof TAGS, [RegExp, 1 | 2][]][]) {
    for (const [pattern, strength] of rules) {
      if (pattern.test(name)) {
        p[taste] = Math.max(p[taste] ?? 0, strength) as 1 | 2
        break
      }
    }
  }
  if (per100g) {
    const sugars = per100g.sugars
    const sodium = per100g.sodium
    const fat = per100g.fat
    if (sugars !== undefined && sugars >= 4) p.sweet = sugars >= 12 ? 2 : 1
    if (sodium !== undefined && sodium >= 150) p.salty = sodium >= 600 ? 2 : 1
    if (fat !== undefined && fat >= 5) p.rich = fat >= 15 ? 2 : 1
  }
  return p
}

/** Balancing pairs: [taste of the ingredient, contrasting taste of the partner, label]. */
const RULES: [Taste, Taste, string][] = [
  ["rich", "sour", "Acid cuts richness"],
  ["rich", "bitter", "Bitterness cuts richness"],
  ["rich", "spicy", "Heat lifts richness"],
  ["spicy", "rich", "Richness cools heat"],
  ["bitter", "rich", "Richness softens bitterness"],
  ["bitter", "salty", "Salt tames bitterness"],
  ["bitter", "sweet", "Sweetness tames bitterness"],
  ["sour", "sweet", "Sweet balances sour"],
  ["sour", "rich", "Richness rounds acidity"],
  ["sweet", "sour", "Acid brightens sweetness"],
  ["sweet", "salty", "Salt sharpens sweetness"],
  ["sweet", "bitter", "Bitterness deepens sweetness"],
  ["salty", "sweet", "Sweetness offsets salt"],
  ["salty", "sour", "Acid lifts salty food"],
  ["umami", "sour", "Acid brightens savory food"],
  ["umami", "sweet", "Sweetness rounds savory food"],
]

export type Contrast = { score: number; reason: string; mine: Taste; theirs: Taste }

/** The strongest balancing contrast between two profiles, or null when none applies. */
export function contrast(mine: TasteProfile, theirs: TasteProfile): Contrast | null {
  let best: Contrast | null = null
  for (const [a, b, reason] of RULES) {
    const x = mine[a]
    const y = theirs[b]
    if (!x || !y) continue
    // A partner that shares the same dominant taste doesn't balance it.
    if (theirs[a] && theirs[a]! >= x) continue
    const score = x * y
    if (!best || score > best.score) best = { score, reason, mine: a, theirs: b }
  }
  return best
}
