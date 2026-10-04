"use client"

import { EyeOff } from "lucide-react"
import { useState } from "react"

import { backdropOptions, CreativeBackdrop, type BackdropKind } from "@/components/creative/creative-backdrop"
import { PairingCard, type Pairing } from "@/components/creative/pairing-card"
import { IngredientSwatch, type ChipFood } from "@/components/food/ingredient-chip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Example content only. The pairing numbers are placeholders until FlavorGraph is imported (session 7).
const spinach: ChipFood = { name: "Spinach", color: "#2f6b34", group: "leafy" }

const pairings: Pairing[] = [
  {
    food: { name: "Lemon", color: "#f1d23a", group: "fruit" },
    note: "Sharp light breaking through dark leaves, the way Lebanese fatayer are baked bright with lemon and sumac.",
    sharedAromas: 14,
    recipesTogether: 3120,
  },
  {
    food: { name: "Garlic", color: "#e3cfa5", group: "vegetable" },
    note: "Sweet and nutty once it meets warm oil, as in Korean sigeumchi namul, glossed with sesame.",
    sharedAromas: 9,
    recipesTogether: 5480,
  },
  {
    food: { name: "Nutmeg", color: "#8a5a33", group: "herb" },
    note: "A quiet warmth, grated thin, the old French secret of épinards à la crème.",
    sharedAromas: 11,
    recipesTogether: 1260,
  },
  {
    food: { name: "Feta", color: "#efe9da", group: "dairy" },
    note: "Salt and tang crumbling into the green, folded with dill into Greek spanakopita.",
    sharedAromas: 6,
    recipesTogether: 1840,
  },
  {
    food: { name: "Egg", color: "#f2b134", group: "dairy" },
    note: "A soft yolk set into wilted leaves, as in a Turkish pan of ıspanaklı yumurta.",
    sharedAromas: 8,
    recipesTogether: 2210,
  },
  {
    food: { name: "Pine nut", color: "#e6cf9a", group: "nut" },
    note: "Toasted gold and buttery, tossed with raisins in Catalan espinacs a la catalana.",
    sharedAromas: 7,
    recipesTogether: 960,
  },
]

const backdropColors = [spinach.color, "#f1d23a", "#8a5a33", "#e3cfa5"]

export function CreativeSpecimen() {
  const [kind, setKind] = useState<BackdropKind>("field")
  const current = backdropOptions.find((o) => o.value === kind)

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <span className="text-sm font-bold">Background</span>
        <Tabs value={kind} onValueChange={(value) => setKind(value as BackdropKind)}>
          <TabsList className="h-10 rounded-full bg-track p-1">
            {backdropOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="rounded-full px-4 text-muted-foreground data-active:text-foreground"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground">{current?.description}</p>
      </div>

      <div
        data-register="creative"
        className="relative isolate overflow-hidden rounded-[40px_40px_40px_12px] bg-paper text-ink"
      >
        <CreativeBackdrop kind={kind} colors={backdropColors} />

        <div className="grid gap-10 px-6 py-10 md:px-12 md:py-14">
          <header className="grid max-w-[44rem] gap-4">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-ink-muted uppercase">
              <IngredientSwatch food={spinach} className="size-4" />
              Pairings
            </p>
            <h3 className="font-display text-[clamp(44px,7vw,76px)] leading-[0.95] font-medium tracking-[-0.02em]">
              Spinach
              <span className="block text-[0.5em] leading-tight font-normal text-ink-muted italic">
                dark leaves that soften in a breath
              </span>
            </h3>
            <p className="font-display text-xl leading-relaxed text-ink-muted">
              It tastes of iron and cold rain, and it longs for something bright. Greek cooks bake it with feta into
              spanakopita, Punjabi kitchens simmer it with paneer into palak paneer, and in Japan it is dressed with
              toasted sesame as horenso no goma-ae.
            </p>
          </header>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pairings.map((pairing) => (
              <PairingCard key={pairing.food.name} pairing={pairing} />
            ))}
          </ul>

          <p className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <EyeOff className="size-4" aria-hidden />
            Hazelnut is hidden from these pairings because it&apos;s on your allergy list.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Example content. Aroma and recipe counts are placeholders until the flavor data arrives in session 7.
      </p>
    </div>
  )
}
