import type { ChipFood } from "@/components/food/ingredient-chip"

// Example content for the creative-direction specimens. Aroma and recipe counts are
// placeholders until FlavorGraph is imported (session 7).

export type Family = { name: string; color: string }

export const families: Family[] = [
  { name: "Citrus", color: "#f1c40f" },
  { name: "Allium", color: "#c9a96e" },
  { name: "Spice", color: "#a0522d" },
  { name: "Cheese", color: "#e8d9a8" },
  { name: "Egg", color: "#f2a33a" },
  { name: "Nut & seed", color: "#b98a4e" },
  { name: "Herb", color: "#5f9c4a" },
  { name: "Fruit", color: "#d9483b" },
  { name: "Meat & fish", color: "#c46a6a" },
  { name: "Grain", color: "#d8bf8a" },
]

export type AltPairing = {
  food: ChipFood
  family: string
  latin: string
  note: string
  sharedAromas: number
  recipesTogether: number
}

export const hero = {
  food: { name: "Spinach", color: "#2f6b34", group: "leafy" } satisfies ChipFood,
  latin: "Spinacia oleracea",
  kcalPer100g: 23,
  tagline: "Fast heat, a little fat, and something sharp at the end.",
  intro:
    "Spinach is mostly water and a fair amount of iron. Wilt it hot and fast, squeeze out what it gives back, and season at the end. It shrinks to almost nothing, so buy twice what you think. Greek cooks bake it into spanakopita; in Japan it is blanched, squeezed and dressed with sesame.",
}

export const altPairings: AltPairing[] = [
  {
    food: { name: "Lemon", color: "#f1d23a", group: "fruit" },
    family: "Citrus",
    latin: "Citrus limon",
    note: "Acid wakes it up. Add lemon off the heat, right before it goes on the plate, or the green turns khaki.",
    sharedAromas: 14,
    recipesTogether: 3120,
  },
  {
    food: { name: "Garlic", color: "#e3cfa5", group: "vegetable" },
    family: "Allium",
    latin: "Allium sativum",
    note: "Slice it thin, let it sizzle in olive oil until it smells sweet, then throw in the leaves. The Italian way, done in a minute.",
    sharedAromas: 9,
    recipesTogether: 5480,
  },
  {
    food: { name: "Nutmeg", color: "#8a5a33", group: "herb" },
    family: "Spice",
    latin: "Myristica fragrans",
    note: "Grate a little into anything creamy with spinach. Nobody notices it until it's missing.",
    sharedAromas: 11,
    recipesTogether: 1260,
  },
  {
    food: { name: "Feta", color: "#efe9da", group: "dairy" },
    family: "Cheese",
    latin: "Brined sheep's milk",
    note: "Salty, sharp and soft at once. Add dill and plenty of olive oil on the filo, and you have spanakopita.",
    sharedAromas: 6,
    recipesTogether: 1840,
  },
  {
    food: { name: "Egg", color: "#f2b134", group: "dairy" },
    family: "Egg",
    latin: "Gallus gallus",
    note: "Wilted leaves under a runny yolk is breakfast in half the world, from eggs Florentine to Turkish ıspanaklı yumurta.",
    sharedAromas: 8,
    recipesTogether: 2210,
  },
  {
    food: { name: "Pine nut", color: "#e6cf9a", group: "nut" },
    family: "Nut & seed",
    latin: "Pinus pinea",
    note: "Toast them dry until they smell of butter, then toss with raisins and spinach, as they do in Catalonia.",
    sharedAromas: 7,
    recipesTogether: 960,
  },
]

export const hiddenAllergenNote = "Hazelnut is hidden here because it's on your allergy list."
