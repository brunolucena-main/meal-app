import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { IngredientChip } from "@/components/food/ingredient-chip"
import { getFlavorIngredient, listFlavorIngredients } from "@/server/flavor"
import { bridges } from "@/server/flavor-graph"
import { getSettings } from "@/server/settings"
import { IngredientFinder } from "../pairings/ingredient-finder"

export const metadata: Metadata = { title: "Bridges · Meal App" }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""
const asId = (v: string) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null)

export default async function BridgesPage(props: PageProps<"/bridges">) {
  const params = await props.searchParams
  const aId = asId(one(params.a))
  const bId = asId(one(params.b))
  const [settings, all, a, b] = await Promise.all([
    getSettings(),
    listFlavorIngredients(),
    aId ? getFlavorIngredient(aId) : Promise.resolve(null),
    bId ? getFlavorIngredient(bId) : Promise.resolve(null),
  ])
  const finderItems = all.map(({ id, name, color, group, allergens }) => ({ id, name, color, group, allergens }))
  const result = a && b ? await bridges(a.id, b.id, 20) : null
  const shown =
    result?.list.filter((x) => !x.path.some((n) => n.allergens.some((al) => settings.allergies.includes(al)))).slice(0, 10) ?? []
  const chip = (i: { name: string; color: string; group: (typeof all)[number]["group"] }) => ({ name: i.name, color: i.color, group: i.group })

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <header className="grid gap-2">
        <p className="text-xs font-bold tracking-[0.12em] text-on-night-muted uppercase">Creative</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Bridges</h1>
        <p className="max-w-[65ch] text-on-night-muted">
          Two ingredients that rarely meet can still share a dish. A bridge is an ingredient that recipes often combine
          with both.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="First ingredient" className="grid content-start gap-3">
          <h2 className="text-sm font-bold text-on-night-muted">First ingredient</h2>
          {a ? (
            <span className="flex items-center gap-3">
              <IngredientChip food={chip(a)} className="text-foreground" />
              <Link href={bId ? `/bridges?b=${bId}` : "/bridges"} className="text-xs font-bold text-on-night-muted hover:text-on-night">
                Change
              </Link>
            </span>
          ) : (
            <IngredientFinder items={finderItems} basePath={bId ? `/bridges?b=${bId}` : "/bridges"} param="a" />
          )}
        </section>
        <section aria-label="Second ingredient" className="grid content-start gap-3">
          <h2 className="text-sm font-bold text-on-night-muted">Second ingredient</h2>
          {b ? (
            <span className="flex items-center gap-3">
              <IngredientChip food={chip(b)} className="text-foreground" />
              <Link href={aId ? `/bridges?a=${aId}` : "/bridges"} className="text-xs font-bold text-on-night-muted hover:text-on-night">
                Change
              </Link>
            </span>
          ) : (
            <IngredientFinder items={finderItems} basePath={aId ? `/bridges?a=${aId}` : "/bridges"} param="b" />
          )}
        </section>
      </div>

      {a && b && result ? (
        <section aria-labelledby="bridges-h" className="surface grid gap-3 rounded-3xl p-5">
          <div className="grid gap-0.5">
            <h2 id="bridges-h" className="text-base font-extrabold">
              {a.name} and {b.name}
            </h2>
            <p className="text-xs font-medium text-muted-foreground">
              {result.direct
                ? `Recipes already combine them directly (score ${Math.round(result.direct * 100)}).`
                : "Recipes rarely combine them directly."}{" "}
              {shown[0]?.path.length === 2 ? "No single ingredient links them, so these are two-step chains. " : ""}
              Ranked by the weakest link.
            </p>
          </div>
          {shown.length ? (
            <ul className="grid">
              {shown.map((x) => (
                <li key={x.path.map((n) => n.id).join("-")} className="flex flex-wrap items-center gap-2 border-t border-border py-2.5">
                  <IngredientChip food={chip(a)} size="sm" />
                  {x.path.map((n, i) => (
                    <span key={n.id} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{Math.round(x.links[i] * 100)}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                      <Link href={`/pairings?i=${n.id}`} className="rounded-full bg-violet-soft p-0.5">
                        <IngredientChip food={chip(n)} size="sm" className="border-transparent" />
                      </Link>
                    </span>
                  ))}
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{Math.round(x.links[x.links.length - 1] * 100)}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                  <IngredientChip food={chip(b)} size="sm" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No single ingredient links these two in the recipe data.</p>
          )}
          <p className="text-[11px] text-muted-foreground">Numbers: how strongly recipes combine each pair (0-100).</p>
        </section>
      ) : null}
    </div>
  )
}
