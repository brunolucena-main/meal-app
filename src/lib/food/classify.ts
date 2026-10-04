import type { FoodGroup } from "./types"

/** USDA food categories (SR Legacy and Foundation share them) mapped to chip groups. */
const CATEGORY_GROUPS: Record<string, FoodGroup> = {
  "Vegetables and Vegetable Products": "vegetable",
  "Fruits and Fruit Juices": "fruit",
  "Legumes and Legume Products": "legume",
  "Nut and Seed Products": "nut",
  "Cereal Grains and Pasta": "grain",
  "Baked Products": "grain",
  "Breakfast Cereals": "grain",
  "Dairy and Egg Products": "dairy",
  "Beef Products": "meat",
  "Pork Products": "meat",
  "Poultry Products": "meat",
  "Lamb, Veal, and Game Products": "meat",
  "Sausages and Luncheon Meats": "meat",
  "Finfish and Shellfish Products": "fish",
  "Spices and Herbs": "herb",
  "Fats and Oils": "fat",
}

const LEAFY =
  /\b(spinach|kale|lettuce|chard|collards?|arugula|watercress|cabbage|endive|escarole|radicchio|bok choy|pak.?choi|mustard greens|turnip greens|beet greens|dandelion greens)\b/

export function classifyGroup(description: string, category: string | null): FoodGroup {
  const group = (category && CATEGORY_GROUPS[category]) || "other"
  if (group === "vegetable" && LEAFY.test(description.toLowerCase())) return "leafy"
  return group
}

const GROUP_COLORS: Record<FoodGroup, string> = {
  leafy: "#3f7d3a",
  vegetable: "#6a9a3a",
  fruit: "#d9483b",
  legume: "#b8682e",
  nut: "#a0703c",
  grain: "#d6b77a",
  dairy: "#f1ead8",
  meat: "#c8735f",
  fish: "#e98a6b",
  herb: "#7a8f3e",
  fat: "#d6b84a",
  other: "#a7a3b5",
}

/**
 * Representative colors for common ingredients, matched against the lowercase USDA description.
 * Order matters: more specific patterns come first ("sweet potato" before "potato").
 */
const COLOR_RULES: [RegExp, string][] = [
  [/^spinach/, "#2f6b34"],
  [/^kale/, "#31584a"],
  [/^broccoli/, "#4a7f3a"],
  [/^carrots?/, "#ec7f2b"],
  [/sweet ?potato/, "#d9692b"],
  [/^potato/, "#c9a46a"],
  [/^tomato/, "#d8402a"],
  [/^(pumpkin|squash)/, "#e68a2e"],
  [/^beets?/, "#8e1f45"],
  [/^onions?/, "#d8c3a5"],
  [/^garlic/, "#e3cfa5"],
  [/^peppers?, (sweet|bell), red/, "#d63a2a"],
  [/^peppers?, (sweet|bell), yellow/, "#f2c230"],
  [/^peppers?, (sweet|bell), green/, "#4f8f3a"],
  [/^mushrooms?/, "#b8a58c"],
  [/^cucumber/, "#7fae5a"],
  [/^eggplant/, "#4b2a52"],
  [/^lemons?/, "#f1d23a"],
  [/^limes?/, "#9cc43a"],
  [/^oranges?/, "#f39a1f"],
  [/^apples?/, "#c8333a"],
  [/^bananas?/, "#f3d75a"],
  [/^strawberr/, "#d8344a"],
  [/^blueberr/, "#4a4f8f"],
  [/^raspberr/, "#c7254e"],
  [/^grapes?/, "#6b3a6b"],
  [/^avocados?/, "#6f8f3a"],
  [/^mangos?/, "#f5a623"],
  [/^pineapple/, "#f2c94c"],
  [/^peach/, "#f6a36b"],
  [/^cherr/, "#9e1b32"],
  [/^watermelon/, "#e8505b"],
  [/^kiwi/, "#8cae3a"],
  [/^pears?/, "#c9c35a"],
  [/^plums?/, "#6b2a4f"],
  [/^figs?/, "#6a3d5c"],
  [/^dates?/, "#7a4a2a"],
  [/^raisins?/, "#5b2c3a"],
  [/coconut/, "#f3efe6"],
  [/^lentils?/, "#b8682e"],
  [/^chickpeas?|garbanzo/, "#d9b56f"],
  [/^beans?, black\b/, "#2c2a33"],
  [/^beans?, kidney/, "#8b2d2d"],
  [/^tofu|^soy/, "#efe6c8"],
  [/^peanut/, "#c48a4a"],
  [/almond/, "#c58b5a"],
  [/walnut/, "#8a6a45"],
  [/hazelnut|filbert/, "#9a6331"],
  [/cashew/, "#e6cf9a"],
  [/pistachio/, "#93b05a"],
  [/pine nut|pinyon/, "#e6cf9a"],
  [/sesame/, "#e8d9a8"],
  [/chia/, "#6e6a62"],
  [/flaxseed/, "#8a5a33"],
  [/^oats?\b|oatmeal/, "#d6c193"],
  [/^rice/, "#ece6d6"],
  [/^quinoa/, "#e3d3a5"],
  [/^pasta|spaghetti|macaroni/, "#edd28f"],
  [/^bread/, "#c99a5b"],
  [/^(wheat flour|flour)/, "#e8d6a8"],
  [/^milk/, "#f6f3ea"],
  [/^yogurt/, "#f5f2ea"],
  [/parmesan/, "#e9d38f"],
  [/feta/, "#efe9da"],
  [/^cheese/, "#f0b43a"],
  [/^butter/, "#f4dc84"],
  [/^cream/, "#f4efe2"],
  [/^egg/, "#f2b134"],
  [/^chicken/, "#e9c7a4"],
  [/^turkey/, "#e0b896"],
  [/^beef/, "#a33a2f"],
  [/^pork/, "#e6a8a0"],
  [/^lamb/, "#b0473f"],
  [/salmon/, "#f08a63"],
  [/tuna/, "#b04a4a"],
  [/^fish, cod|cod\b/, "#efe7da"],
  [/shrimp|prawn/, "#f2957a"],
  [/olive oil|^oil, olive/, "#b5a632"],
  [/^olives?/, "#6b6b2a"],
  [/ginger/, "#d9b26a"],
  [/cinnamon/, "#9b5a2c"],
  [/nutmeg/, "#8a5a33"],
  [/basil/, "#3f8f3f"],
  [/parsley/, "#4f9a3a"],
  [/dill/, "#6f9e45"],
  [/peppermint|spearmint|\bmint\b/, "#4fae6a"],
  [/chocolate|cocoa/, "#5a3423"],
  [/^honey/, "#e8a33a"],
  [/^coffee/, "#4a2c1f"],
]

export function representativeColor(description: string, group: FoodGroup): string {
  const d = description.toLowerCase()
  for (const [pattern, color] of COLOR_RULES) if (pattern.test(d)) return color
  return GROUP_COLORS[group]
}
