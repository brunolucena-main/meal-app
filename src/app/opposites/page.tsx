import type { Metadata } from "next"
import Link from "next/link"

import { FlavorHeader } from "@/components/creative/flavor-header"
import { IngredientChip } from "@/components/food/ingredient-chip"
import { TASTE_LABELS } from "@/lib/flavor/tastes"
import { listFlavorIngredients } from "@/server/flavor"
import { opposites } from "@/server/flavor-graph"
import { getSettings } from "@/server/settings"
import { IngredientFinder } from "../pairings/ingredient-finder"

export const metadata: Metadata = { title: "Opposites · Meal App" }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""

export default async function OppositesPage(props: PageProps<"/opposites">) {
  const params = await props.searchParams
  const id = Number(one(params.i))
  const [settings, all, result] = await Promise.all([
    getSettings(),
    listFlavorIngredients(),
    Number.isInteger(id) && id > 0 ? opposites(id, 40) : Promise.resolve(null),
  ])
  const finderItems = all.map(({ id, name, color, group, allergens }) => ({ id, name, color, group, allergens }))

  if (!result) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
        <header className="grid gap-2">
          <p className="text-xs font-bold tracking-[0.12em] text-on-night-muted uppercase">Creative</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Opposites</h1>
          <p className="max-w-[65ch] text-on-night-muted">
            Contrasting tastes that balance each other: acid against richness, salt or sweetness against bitterness,
            sweet against sour. Pick an ingredient.
          </p>
        </header>
        <IngredientFinder items={finderItems} basePath="/opposites" param="i" />
      </div>
    )
  }

  const { self, list } = result
  const shown = list.filter((o) => !o.ingredient.allergens.some((a) => settings.allergies.includes(a))).slice(0, 15)
  const tasteCount = Object.keys(self.tastes).length

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <FlavorHeader ingredient={self} tastes={self.tastes} current="opposites" section="Opposites" />

      <section aria-labelledby="opp-h" className="surface grid gap-3 rounded-3xl p-5">
        <div className="grid gap-0.5">
          <h2 id="opp-h" className="text-base font-extrabold">Balancing partners</h2>
          <p className="text-xs font-medium text-muted-foreground">
            Ranked by how strong the contrast is and how often recipes actually combine them
          </p>
        </div>
        {tasteCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            No dominant taste on record for {self.name.toLowerCase()}, so there is nothing to balance. Neutral
            ingredients take on whatever they are cooked with.
          </p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No balancing partners found.</p>
        ) : (
          <ul className="grid">
            {shown.map((o) => (
              <li key={o.ingredient.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-2.5">
                <span className="grid min-w-0 gap-1">
                  <Link href={`/opposites?i=${o.ingredient.id}`} className="justify-self-start rounded-full focus-visible:outline-2 focus-visible:outline-ring">
                    <IngredientChip food={{ name: o.ingredient.name, color: o.ingredient.color, group: o.ingredient.group }} size="sm" className="hover:bg-muted" />
                  </Link>
                  <span className="pl-1 text-xs text-muted-foreground tabular-nums">
                    {o.together ? `Cooked together ${Math.round(o.together * 100)}` : "Rarely combined in recipes"}
                  </span>
                </span>
                <span className="grid justify-items-end gap-1 text-right">
                  <span className="rounded-full bg-violet-soft px-2.5 py-0.5 text-xs font-bold">
                    {TASTE_LABELS[o.contrast.mine]} vs {TASTE_LABELS[o.contrast.theirs].toLowerCase()}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">{o.contrast.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-on-night-muted">
        Tastes: sweet, salty and rich come from USDA nutrients; sour, bitter, savory and hot are tagged by name. They are
        broad strokes, not lab measurements.
      </p>
    </div>
  )
}
