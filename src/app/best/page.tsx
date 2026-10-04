import { EyeOff, TriangleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { Button } from "@/components/ui/button"
import { NUTRIENT_BY_KEY, NUTRIENTS, type NutrientKey } from "@/lib/nutrition/nutrients"
import { rankFood, type RankBasis } from "@/lib/nutrition/ranking"
import { variantKey } from "@/lib/nutrition/similarity"
import { cn } from "@/lib/utils"
import { gaps, parseIsoDate } from "@/lib/nutrition/day"
import { getCatalog } from "@/server/catalog"
import { getDay } from "@/server/days"
import { getSettings } from "@/server/settings"

export const metadata: Metadata = { title: "Best sources · Meal App" }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""
const isKey = (k: string): k is NutrientKey => k in NUTRIENT_BY_KEY

// Nutrients worth seeking out: goals with a target, minus energy itself.
const CHOOSABLE = NUTRIENTS.filter((n) => n.kind === "goal")

const LIMIT_LABELS: Partial<Record<NutrientKey, string>> = {
  sodium: "High sodium",
  satFat: "High saturated fat",
  addedSugars: "High added sugar",
}

export default async function BestSourcesPage(props: PageProps<"/best">) {
  const params = await props.searchParams
  // Checkboxes submit ?want=a&want=b; links use ?want=a,b. Accept both.
  const wantRaw = Array.isArray(params.want) ? params.want.join(",") : (params.want ?? "")
  const wantedKeys = [...new Set(wantRaw.split(",").filter(isKey))]
  const want: NutrientKey[] = wantedKeys.length ? wantedKeys : ["magnesium"]
  const basis: RankBasis = one(params.basis) === "100g" ? "100g" : "100kcal"
  const includePrepared = one(params.prepared) === "1"
  const includeSpices = one(params.spices) === "1"

  const day = one(params.day)
  const [catalog, settings, dayView] = await Promise.all([
    getCatalog(),
    getSettings(),
    parseIsoDate(day) ? getDay(day) : Promise.resolve(null),
  ])
  // From a day screen, rank by what is still missing that day; otherwise by the full targets.
  const amounts = dayView ? gaps(settings.targets, dayView.totals.projected) : settings.targets
  const wanted = Object.fromEntries(want.map((k) => [k, amounts[k]]).filter(([, v]) => v)) as Partial<
    Record<NutrientKey, number>
  >

  let hidden = 0
  const ranked = []
  for (const food of catalog) {
    if (!includePrepared && food.group === "other") continue
    if (!includeSpices && food.group === "herb") continue
    const result = rankFood(food.profile, wanted, basis, settings.targets)
    if (!result) continue
    if (food.allergens.some((a) => settings.allergies.includes(a))) {
      hidden++
      continue
    }
    ranked.push({ food, ...result })
  }
  ranked.sort((a, b) => b.score - a.score)
  // One row per food, its best-scoring form.
  const seen = new Set<string>()
  const top = ranked.filter(({ food }) => {
    const key = variantKey(food.description)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 30)

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Best sources</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Foods that cover the most of your daily target for the nutrients you pick. Per 100 kcal finds nutrient-dense
          foods; per 100 g finds the richest by weight.
        </p>
      </header>

      {dayView ? (
        <p className="rounded-2xl bg-tint-1 px-4 py-3 text-sm font-semibold">
          Ranking by what is still missing on {dayView.date}, counting what you ate and planned. Bars show how much of
          that gap each food covers.
        </p>
      ) : null}

      <form method="get" className="surface grid gap-4 rounded-3xl p-5">
        {dayView ? <input type="hidden" name="day" value={dayView.date} /> : null}
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-bold">Nutrients you want more of</legend>
          <div className="flex flex-wrap gap-2">
            {CHOOSABLE.map((n) => (
              <label key={n.key} className="cursor-pointer">
                <input type="checkbox" name="want" value={n.key} defaultChecked={want.includes(n.key)} className="peer sr-only" />
                <span className="inline-block rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold peer-checked:border-transparent peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-ring">
                  {n.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold">
          <label className="flex items-center gap-2">
            <input type="radio" name="basis" value="100kcal" defaultChecked={basis === "100kcal"} className="size-4 accent-primary" />
            Per 100 kcal
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="basis" value="100g" defaultChecked={basis === "100g"} className="size-4 accent-primary" />
            Per 100 g
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="prepared" value="1" defaultChecked={includePrepared} className="size-4 accent-primary" />
            Include prepared and packaged foods
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="spices" value="1" defaultChecked={includeSpices} className="size-4 accent-primary" />
            Include herbs and spices
          </label>
          <Button type="submit" className="ml-auto">
            Rank
          </Button>
        </div>
      </form>

      <ol className="surface divide-y divide-border overflow-hidden rounded-3xl">
        {top.map(({ food, score, coverage, flags }, i) => (
          <li key={food.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-2 px-5 py-3 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,16rem)]">
            <span className="pt-0.5 text-sm font-bold text-muted-foreground tabular-nums">{i + 1}</span>
            <div className="grid min-w-0 gap-0.5">
              <Link href={`/foods/${food.id}`} className="flex items-center gap-2.5 font-bold hover:underline">
                <IngredientSwatch food={{ name: food.description, color: food.color, group: food.group }} className="size-6" />
                {food.description}
              </Link>
              <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {food.category}
                {flags.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 font-bold text-warn">
                    <TriangleAlert className="size-3" aria-hidden />
                    {LIMIT_LABELS[f]}
                  </span>
                ))}
              </span>
            </div>
            <div className="col-start-2 grid gap-1 sm:col-start-3">
              {want.map((k) =>
                coverage[k] !== undefined ? (
                  <span key={k} className="flex items-center gap-2 text-xs">
                    <span className="w-20 truncate font-semibold">{NUTRIENT_BY_KEY[k].name}</span>
                    <span className="block h-2 flex-1 bg-track">
                      <span
                        className={cn("block h-full rounded-r-[4px] bg-primary")}
                        style={{ width: `${Math.min(coverage[k]! * 100, 100)}%` }}
                      />
                    </span>
                    <span className="w-11 text-right font-semibold tabular-nums">{Math.round(coverage[k]! * 100)}%</span>
                  </span>
                ) : null
              )}
              <span className="sr-only">Score {Math.round(score * 100)}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="-mt-2 text-xs text-muted-foreground">
        Bars: share of your daily target {basis === "100kcal" ? "in 100 kcal of the food" : "in 100 g of the food"}. Foods
        without data for a chosen nutrient are left out.
      </p>
      {hidden > 0 ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <EyeOff className="size-4" aria-hidden />
          {hidden} {hidden === 1 ? "food" : "foods"} hidden because of your allergy list.
        </p>
      ) : null}
    </div>
  )
}
