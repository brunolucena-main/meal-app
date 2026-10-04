import { ArrowRight, EyeOff } from "lucide-react"

import { CreativeSurface } from "@/components/creative/starry-sky"
import { IngredientChip, IngredientSwatch, type ChipFood } from "@/components/food/ingredient-chip"

// Example content only. All counts are placeholders until FlavorGraph is imported (sessions 7–8).

const spinach: ChipFood = { name: "Spinach", color: "#2f6b34", group: "leafy" }
const f = (name: string, color: string, group: ChipFood["group"]): ChipFood => ({ name, color, group })

const pairsWell = [
  { food: f("Lemon", "#f1d23a", "fruit"), shared: 14, together: 3120 },
  { food: f("Nutmeg", "#8a5a33", "herb"), shared: 11, together: 1260 },
  { food: f("Garlic", "#e3cfa5", "vegetable"), shared: 9, together: 5480 },
  { food: f("Egg", "#f2b134", "dairy"), shared: 8, together: 2210 },
  { food: f("Pine nut", "#e6cf9a", "nut"), shared: 7, together: 960 },
  { food: f("Feta", "#efe9da", "dairy"), shared: 6, together: 1840 },
]

const opposites = [
  { food: f("Rice", "#ece6d6", "grain"), shared: 1, together: 2030 },
  { food: f("Chickpeas", "#d9b56f", "legume"), shared: 2, together: 1150 },
  { food: f("Coconut milk", "#f3efe6", "fat"), shared: 1, together: 640 },
  { food: f("Raisins", "#5b2c3a", "fruit"), shared: 2, together: 410 },
]

const bridges = [
  { to: f("Coconut milk", "#f3efe6", "fat"), via: [f("Ginger", "#d9b26a", "herb")] },
  { to: f("Strawberry", "#d8344a", "fruit"), via: [f("Balsamic vinegar", "#3b1f1a", "fat")] },
  { to: f("Salmon", "#f08a63", "fish"), via: [f("Dill", "#6f9e45", "herb"), f("Lemon", "#f1d23a", "fruit")] },
]

const maxShared = Math.max(...pairsWell.map((p) => p.shared))

function CardHeader({ title, definition }: { title: string; definition: string }) {
  return (
    <div className="grid gap-0.5">
      <h4 className="text-base font-extrabold">{title}</h4>
      <p className="text-xs font-medium text-muted-foreground">{definition}</p>
    </div>
  )
}

export function CreativeSpecimen() {
  return (
    <CreativeSurface className="rounded-3xl">
      <div className="grid gap-6 p-5 md:p-8">
        <header className="grid gap-2">
          <p className="text-xs font-bold tracking-[0.12em] text-on-night-muted uppercase">Pairings</p>
          <h3 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight">
            <IngredientSwatch food={spinach} className="size-9 rounded-[12px_12px_12px_4px]" />
            Spinach
          </h3>
          <p className="text-sm font-medium text-on-night-muted">Leafy green · 23 kcal per 100 g · raw</p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <section className="surface grid content-start gap-4 self-start rounded-3xl p-5">
            <CardHeader title="Pairs well" definition="Shares the most aroma compounds" />
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="pb-2 font-semibold">Ingredient</th>
                  <th scope="col" className="pb-2 font-semibold">Shared aromas</th>
                  <th scope="col" className="pb-2 text-right font-semibold">Recipes together</th>
                </tr>
              </thead>
              <tbody>
                {pairsWell.map((p) => (
                  <tr key={p.food.name} className="border-t border-border">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      <IngredientChip food={p.food} size="sm" />
                    </th>
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        <span className="block h-2 flex-1 bg-track">
                          <span
                            className="block h-full rounded-r-[4px] bg-violet"
                            style={{ width: `${(p.shared / maxShared) * 100}%` }}
                          />
                        </span>
                        <span className="w-6 text-right font-bold tabular-nums">{p.shared}</span>
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">{p.together.toLocaleString("en")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="grid content-start gap-4">
            <section className="surface grid gap-3 rounded-3xl p-5">
              <CardHeader title="Opposites" definition="Often cooked together, few aromas in common" />
              <ul className="grid gap-2">
                {opposites.map((o) => (
                  <li key={o.food.name} className="flex items-center justify-between gap-3 border-t border-border pt-2 text-sm">
                    <IngredientChip food={o.food} size="sm" />
                    <span className="text-right text-xs font-semibold text-muted-foreground tabular-nums">
                      {o.shared} shared · {o.together.toLocaleString("en")} recipes
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="surface grid gap-3 rounded-3xl p-5">
              <CardHeader title="Bridges" definition="Ingredients that link spinach to foods it rarely meets" />
              <ul className="grid gap-2">
                {bridges.map((b) => (
                  <li key={b.to.name} className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
                    <IngredientChip food={spinach} size="sm" />
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-label="via" />
                    {b.via.map((v) => (
                      <span key={v.name} className="rounded-full bg-violet-soft p-0.5">
                        <IngredientChip food={v} size="sm" className="border-transparent" />
                      </span>
                    ))}
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-label="to" />
                    <IngredientChip food={b.to} size="sm" />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm font-semibold text-on-night-muted">
          <EyeOff className="size-4" aria-hidden />
          Hazelnut hidden (allergen)
        </p>
      </div>
    </CreativeSurface>
  )
}
