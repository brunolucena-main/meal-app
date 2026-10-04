import { EyeOff } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { FlavorHeader } from "@/components/creative/flavor-header"
import { IngredientChip } from "@/components/food/ingredient-chip"
import { getFlavorIngredient, getPartners, listFlavorIngredients, type Pairing } from "@/server/flavor"
import { getFlavorGraph, swaps } from "@/server/flavor-graph"
import { getSettings } from "@/server/settings"
import { IngredientFinder } from "./ingredient-finder"

export const metadata: Metadata = { title: "Pairings · Meal App" }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""
const TOP = 15

export default async function PairingsPage(props: PageProps<"/pairings">) {
  const params = await props.searchParams
  const id = Number(one(params.i))
  const [settings, all, ingredient] = await Promise.all([
    getSettings(),
    listFlavorIngredients(),
    Number.isInteger(id) && id > 0 ? getFlavorIngredient(id) : Promise.resolve(null),
  ])
  const finderItems = all.map(({ id, name, color, group, allergens }) => ({ id, name, color, group, allergens }))

  if (!ingredient) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
        <header className="grid gap-2">
          <p className="text-xs font-bold tracking-[0.12em] text-on-night-muted uppercase">Creative</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Pairings</h1>
          <p className="max-w-[65ch] text-on-night-muted">
            Pick an ingredient to see what pairs with it: by shared aroma compounds, and by how often recipes put them
            together.
          </p>
        </header>
        <IngredientFinder items={finderItems} basePath="/pairings" param="i" />
      </div>
    )
  }

  const [partners, graph, swapList] = await Promise.all([
    getPartners(ingredient.id),
    getFlavorGraph(),
    swaps(ingredient.id, settings.targets, 16),
  ])
  const tastes = graph.ingredients.get(ingredient.id)?.tastes
  const allowed = (p: { allergens: string[] }) => !p.allergens.some((a) => settings.allergies.includes(a))
  const hidden = partners.filter((p) => !allowed(p) && ((p.overlap ?? 0) > 0 || (p.together ?? 0) > 0)).length
  const byAroma = partners
    .filter((p) => allowed(p) && (p.overlap ?? 0) > 0)
    .sort((a, b) => b.overlap! - a.overlap!)
    .slice(0, TOP)
  const byRecipes = partners
    .filter((p) => allowed(p) && (p.together ?? 0) > 0)
    .sort((a, b) => b.together! - a.together!)
    .slice(0, TOP)
  const maxOverlap = byAroma[0]?.overlap ?? 1
  const flagged = ingredient.allergens.filter((a) => settings.allergies.includes(a))
  const swapsShown = swapList.filter((w) => allowed(w.ingredient)).slice(0, 10)

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <FlavorHeader ingredient={ingredient} tastes={tastes} current="pairings" section="Pairings" />
      <p className="-mt-2 text-sm font-medium text-on-night-muted">
        {!ingredient.compoundCount
          ? "No aroma compound data on record."
          : ingredient.genericAroma
            ? "Only a generic aroma profile on record."
            : `${ingredient.compoundCount} aroma compounds on record.`}
      </p>
      {flagged.length ? (
        <p className="justify-self-start rounded-2xl bg-warn-soft px-4 py-2 text-sm font-bold text-warn">
          {ingredient.name} is on your allergy list ({flagged.join(", ")}).
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="aromas-h" className="surface grid content-start gap-3 self-start rounded-3xl p-5">
          <div className="grid gap-0.5">
            <h2 id="aromas-h" className="text-base font-extrabold">Pairs well</h2>
            <p className="text-xs font-medium text-muted-foreground">Most aroma compounds in common, relative to each ingredient&apos;s total</p>
          </div>
          {byAroma.length ? (
            <PartnerTable
              rows={byAroma}
              bar={(p) => p.overlap! / maxOverlap}
              primary={(p) => `${p.shared} shared`}
              secondary={(p) => (p.together ? `cooked together ${Math.round(p.together * 100)}` : "rarely in recipes")}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {ingredient.genericAroma
                ? `The aroma data for ${ingredient.name.toLowerCase()} is a generic placeholder shared with many other foods, so it can't single out partners.`
                : `No aroma compound data for ${ingredient.name.toLowerCase()}.`}
            </p>
          )}
        </section>

        <section aria-labelledby="recipes-h" className="surface grid content-start gap-3 self-start rounded-3xl p-5">
          <div className="grid gap-0.5">
            <h2 id="recipes-h" className="text-base font-extrabold">Cooked together</h2>
            <p className="text-xs font-medium text-muted-foreground">How strongly recipes combine them (score 0-100 from about a million recipes)</p>
          </div>
          {byRecipes.length ? (
            <PartnerTable
              rows={byRecipes}
              bar={(p) => p.together! / (byRecipes[0].together ?? 1)}
              primary={(p) => `${Math.round(p.together! * 100)}`}
              secondary={(p) => (p.shared !== null ? `${p.shared} shared aromas` : "no aroma data")}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No recipe data for {ingredient.name.toLowerCase()}.</p>
          )}
        </section>
      </div>

      {swapsShown.length ? (
        <section aria-labelledby="swaps-h" className="surface grid gap-3 rounded-3xl p-5">
          <div className="grid gap-0.5">
            <h2 id="swaps-h" className="text-base font-extrabold">Swap in</h2>
            <p className="text-xs font-medium text-muted-foreground">
              Used with the same partners in recipes; nutrition match shown where both have USDA data
            </p>
          </div>
          <ul className="grid gap-x-6 sm:grid-cols-2">
            {swapsShown.map((w) => (
              <li key={w.ingredient.id} className="flex items-center justify-between gap-3 border-t border-border py-2">
                <Link href={`/pairings?i=${w.ingredient.id}`} className="rounded-full focus-visible:outline-2 focus-visible:outline-ring">
                  <IngredientChip food={{ name: w.ingredient.name, color: w.ingredient.color, group: w.ingredient.group }} size="sm" className="hover:bg-muted" />
                </Link>
                <span className="text-right text-[11px] font-semibold text-muted-foreground tabular-nums">
                  used alike {Math.round(w.context * 100)}%
                  {w.nutrition !== null ? ` · nutrition ${Math.round(w.nutrition * 100)}%` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hidden > 0 ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-on-night-muted">
          <EyeOff className="size-4" aria-hidden />
          {hidden} {hidden === 1 ? "ingredient" : "ingredients"} hidden because of your allergy list.
        </p>
      ) : null}

      <section aria-label="Another ingredient" className="grid gap-3 pt-2">
        <h2 className="text-sm font-bold text-on-night-muted">Another ingredient</h2>
        <IngredientFinder items={finderItems} basePath="/pairings" param="i" />
      </section>
    </div>
  )
}

function PartnerTable({
  rows,
  bar,
  primary,
  secondary,
}: {
  rows: Pairing[]
  bar: (p: Pairing) => number
  primary: (p: Pairing) => string
  secondary: (p: Pairing) => string
}) {
  return (
    <ul className="grid">
      {rows.map((p) => (
        <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-3 border-t border-border py-2">
          <span className="grid min-w-0 gap-0.5">
            <Link href={`/pairings?i=${p.id}`} className="justify-self-start rounded-full focus-visible:outline-2 focus-visible:outline-ring">
              <IngredientChip food={{ name: p.name, color: p.color, group: p.group }} size="sm" className="hover:bg-muted" />
            </Link>
            <span className="pl-1 text-[11px] text-muted-foreground tabular-nums">{secondary(p)}</span>
          </span>
          <span className="grid gap-1">
            <span className="text-right text-xs font-bold tabular-nums">{primary(p)}</span>
            <span className="block h-2 bg-track">
              <span className="block h-full rounded-r-[4px] bg-violet" style={{ width: `${Math.max(bar(p) * 100, 2)}%` }} />
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
