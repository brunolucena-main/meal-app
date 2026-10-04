import { ArrowLeft, EyeOff } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { Button } from "@/components/ui/button"
import { formatAmount } from "@/lib/format"
import { NUTRIENT_BY_KEY, NUTRIENTS, type NutrientKey } from "@/lib/nutrition/nutrients"
import { similarity, toVector, variantKey } from "@/lib/nutrition/similarity"
import { getCatalog } from "@/server/catalog"
import { getSettings } from "@/server/settings"

export const metadata: Metadata = { title: "Substitutes · Meal App" }

const select = "h-10 rounded-xl border border-input bg-card px-3 text-sm font-semibold"
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""
const isKey = (k: string): k is NutrientKey => k in NUTRIENT_BY_KEY

export default async function SubstitutesPage(props: PageProps<"/substitutes">) {
  const params = await props.searchParams
  const id = Number(one(params.id))
  const more = one(params.more)
  const less = one(params.less)
  const scope = one(params.scope) === "any" ? "any" : "same"
  const variants = one(params.variants) === "1"

  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()])
  const source = catalog.find((f) => f.id === id)
  if (!source) notFound()

  const moreKey = isKey(more) ? more : undefined
  const lessKey = isKey(less) ? less : undefined
  const sourceVector = toVector(source.profile, settings.targets)
  const sourceVariant = variantKey(source.description)

  let hidden = 0
  const results = []
  for (const food of catalog) {
    if (food.id === source.id) continue
    if (scope === "same" && food.group !== source.group) continue
    if (!variants && variantKey(food.description) === sourceVariant) continue
    if (moreKey) {
      const a = source.profile[moreKey]
      const b = food.profile[moreKey]
      if (a === undefined || b === undefined || b < a * 1.25 || b - a < 1e-9) continue
    }
    if (lessKey) {
      const a = source.profile[lessKey]
      const b = food.profile[lessKey]
      if (a === undefined || b === undefined || b > a * 0.8) continue
    }
    const score = similarity(sourceVector, toVector(food.profile, settings.targets))
    if (score === null) continue
    if (food.allergens.some((a) => settings.allergies.includes(a))) {
      hidden++
      continue
    }
    results.push({ food, score })
  }
  results.sort((a, b) => b.score - a.score)
  // One row per food: "Collards, raw" and "Collards, cooked, with salt" are the same suggestion.
  const seen = new Set<string>()
  const top = results.filter(({ food }) => {
    const key = variantKey(food.description)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 20)

  const shown: NutrientKey[] = ["energy", "protein", ...(moreKey ? [moreKey] : []), ...(lessKey ? [lessKey] : [])]
  const columns = [...new Set(shown)]

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <Link href={`/foods/${source.id}`} className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {source.description}
      </Link>
      <header className="grid gap-2">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight">
          <IngredientSwatch food={{ name: source.description, color: source.color, group: source.group }} className="size-10 rounded-[14px_14px_14px_4px]" />
          Substitutes
        </h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Foods whose nutrient profile per 100 g is closest to <span className="font-bold text-foreground">{source.description}</span>,
          weighed against your targets.
        </p>
      </header>

      <form method="get" className="surface flex flex-wrap items-end gap-4 rounded-3xl p-5">
        <input type="hidden" name="id" value={source.id} />
        <label className="grid gap-1.5 text-sm font-bold">
          But with more
          <select name="more" defaultValue={moreKey ?? ""} className={select}>
            <option value="">(anything)</option>
            {NUTRIENTS.filter((n) => n.kind === "goal").map((n) => (
              <option key={n.key} value={n.key}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          And less
          <select name="less" defaultValue={lessKey ?? ""} className={select}>
            <option value="">(anything)</option>
            {NUTRIENTS.filter((n) => n.key !== "water").map((n) => (
              <option key={n.key} value={n.key}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Look in
          <select name="scope" defaultValue={scope} className={select}>
            <option value="same">Same food group</option>
            <option value="any">All foods</option>
          </select>
        </label>
        <label className="flex h-10 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="variants" value="1" defaultChecked={variants} className="size-4 accent-primary" />
          Include other forms of this food
        </label>
        <Button type="submit">Find</Button>
      </form>

      {top.length === 0 ? (
        <p className="text-muted-foreground">
          No foods match. Try searching all foods, or drop the &ldquo;more&rdquo; or &ldquo;less&rdquo; condition.
        </p>
      ) : (
        <div className="surface overflow-x-auto rounded-3xl">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="px-5 pt-4 pb-2 text-left text-xs font-semibold text-muted-foreground">
              Per 100 g · {moreKey ? `at least 25% more ${NUTRIENT_BY_KEY[moreKey].name.toLowerCase()}` : ""}
              {moreKey && lessKey ? " · " : ""}
              {lessKey ? `at least 20% less ${NUTRIENT_BY_KEY[lessKey].name.toLowerCase()}` : ""}
              {!moreKey && !lessKey ? "closest overall" : ""}
            </caption>
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="px-5 pb-2 font-semibold">Food</th>
                <th scope="col" className="pb-2 pl-4 font-semibold">Match</th>
                {columns.map((k) => (
                  <th key={k} scope="col" className="pb-2 pl-4 text-right font-semibold">
                    {NUTRIENT_BY_KEY[k].name}
                  </th>
                ))}
                <th scope="col" className="pr-5 pb-2" />
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border bg-muted/60">
                <th scope="row" className="px-5 py-2.5 text-left font-bold">
                  {source.description} <span className="font-semibold text-muted-foreground">(original)</span>
                </th>
                <td />
                {columns.map((k) => (
                  <td key={k} className="py-2.5 pl-4 text-right font-bold whitespace-nowrap tabular-nums">
                    {source.profile[k] === undefined ? "—" : `${formatAmount(source.profile[k]!)} ${NUTRIENT_BY_KEY[k].unit}`}
                  </td>
                ))}
                <td />
              </tr>
              {top.map(({ food, score }) => (
                <tr key={food.id} className="border-t border-border">
                  <th scope="row" className="px-5 py-2.5 text-left font-normal">
                    <Link href={`/foods/${food.id}`} className="flex items-center gap-3 font-bold hover:underline">
                      <IngredientSwatch food={{ name: food.description, color: food.color, group: food.group }} className="size-6" />
                      {food.description}
                    </Link>
                  </th>
                  <td className="py-2.5 pl-4">
                    <span className="flex w-28 items-center gap-2">
                      <span className="block h-2 flex-1 bg-track">
                        <span className="block h-full rounded-r-[4px] bg-primary" style={{ width: `${score * 100}%` }} />
                      </span>
                      <span className="w-9 text-right text-xs font-semibold tabular-nums">{Math.round(score * 100)}%</span>
                    </span>
                  </td>
                  {columns.map((k) => (
                    <td key={k} className="py-2.5 pl-4 text-right whitespace-nowrap tabular-nums">
                      {food.profile[k] === undefined ? "—" : `${formatAmount(food.profile[k]!)} ${NUTRIENT_BY_KEY[k].unit}`}
                    </td>
                  ))}
                  <td className="py-2.5 pr-5 pl-4 text-right">
                    <Link href={`/compare?ids=${source.id},${food.id}`} className="text-xs font-bold text-primary hover:underline">
                      Compare
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hidden > 0 ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <EyeOff className="size-4" aria-hidden />
          {hidden} {hidden === 1 ? "food" : "foods"} hidden because of your allergy list.
        </p>
      ) : null}
    </div>
  )
}
