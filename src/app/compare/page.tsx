import { X } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import type { ChipFood } from "@/components/food/ingredient-chip"
import { CompareTable } from "@/components/nutrition/compare-table"
import { compareFoods, standouts, winCounts, type Basis, type Standout } from "@/lib/nutrition/compare"
import { NUTRIENT_BY_KEY, NUTRIENTS, type NutrientKey } from "@/lib/nutrition/nutrients"
import { cn } from "@/lib/utils"
import { getFood, type FoodDetail } from "@/server/foods"
import { AddFood } from "./add-food"
import { PortionSelect } from "./portion-select"
import { compareHref, MAX_FOODS, parseCompareState, type CompareState } from "./url"

export const metadata: Metadata = { title: "Compare · Meal App" }

const BASES: { value: Basis; label: string }[] = [
  { value: "100g", label: "Per 100 g" },
  { value: "100kcal", label: "Per 100 kcal" },
  { value: "serving", label: "Per serving" },
]

const KEY_NUTRIENTS: NutrientKey[] = [
  "energy", "protein", "carbs", "fiber", "sugars", "fat", "satFat",
  "sodium", "potassium", "calcium", "iron", "magnesium", "zinc",
  "vitA", "vitC", "vitD", "vitK", "folate", "vitB12",
]

const QUICK_STARTS: { label: string; ids: number[] }[] = [
  { label: "Spinach vs kale vs broccoli", ids: [168462, 168421, 170379] },
  { label: "Lentils vs chickpeas", ids: [172421, 173757] },
  { label: "Salmon vs chicken breast", ids: [175168, 171477] },
  { label: "Quinoa vs white rice", ids: [168917, 168878] },
  { label: "Almonds vs walnuts", ids: [170567, 170187] },
]

const BASIS_CAPTION: Record<Basis, string> = {
  "100g": "Per 100 g",
  "100kcal": "Per 100 kcal, so every food supplies the same energy",
  serving: "Per serving, using the USDA portion chosen under each food",
}

function shortName(description: string) {
  return description.split(",")[0]
}

/** "Vitamin A" -> "vitamin A", keeping letters that are part of the name. */
function inSentence(name: string) {
  return name.charAt(0).toLowerCase() + name.slice(1)
}

function formatRatio(ratio: number) {
  if (!Number.isFinite(ratio)) return "only source of"
  if (ratio >= 10) return "10×+ the"
  return `${ratio.toFixed(1)}× the`
}

export default async function ComparePage(props: PageProps<"/compare">) {
  const state = parseCompareState(await props.searchParams)
  const loaded = await Promise.all(state.ids.map((id) => getFood(id)))
  const foods = loaded.filter((f): f is FoodDetail => f !== null)

  const servingFor = (food: FoodDetail) => {
    const chosen = food.portions.find((p) => p.id === state.portions[food.id]) ?? food.portions[0]
    return chosen
  }

  const nutrientDefs = state.all ? NUTRIENTS : KEY_NUTRIENTS.map((k) => NUTRIENT_BY_KEY[k])
  const comparison = compareFoods(
    foods.map((f) => ({ profile: f.nutrients, servingGrams: servingFor(f)?.gramWeight })),
    state.basis,
    nutrientDefs
  )
  const chips: ChipFood[] = foods.map((f) => ({
    name: f.description,
    color: f.color,
    group: f.group,
    allergen: f.allergens[0],
  }))
  const current: CompareState = { ...state, ids: foods.map((f) => f.id) }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Compare</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Up to {MAX_FOODS} foods side by side. Switch the basis to compare by weight, by calories or by a real serving.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {foods.length < MAX_FOODS ? <AddFood state={current} /> : null}
        <nav aria-label="Compare by" className="flex h-11 items-center gap-1 rounded-full bg-track p-1">
          {BASES.map((b) => (
            <Link
              key={b.value}
              href={compareHref({ ...current, basis: b.value })}
              scroll={false}
              aria-current={state.basis === b.value ? "true" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-bold",
                state.basis === b.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {b.label}
            </Link>
          ))}
        </nav>
      </div>

      {foods.length === 0 ? (
        <section className="surface grid gap-4 rounded-3xl p-6">
          <h2 className="text-lg font-extrabold">Start with a pair</h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_STARTS.map((q) => (
              <Link
                key={q.label}
                href={compareHref({ ...current, ids: q.ids })}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold hover:bg-muted"
              >
                {q.label}
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Or add any food with the search box above.</p>
        </section>
      ) : (
        <>
          {foods.length >= 2 ? <Summary foods={foods} wins={winCounts(comparison)} standouts={standouts(comparison)} /> : null}

          <CompareTable
            foods={chips}
            comparison={comparison}
            caption={`${BASIS_CAPTION[state.basis]} · % of Daily Value`}
            headerExtra={(i) => {
              const food = foods[i]
              const serving = servingFor(food)
              return (
                <span className="grid justify-items-start gap-1.5">
                  {state.basis === "serving" && serving ? (
                    <PortionSelect state={current} foodId={food.id} portions={food.portions} selected={serving.id} />
                  ) : null}
                  {comparison.factors[i] === null ? (
                    <span className="text-xs font-semibold text-warn">
                      {state.basis === "100kcal" ? "No calorie data, can't compare per 100 kcal" : "USDA lists no portions"}
                    </span>
                  ) : null}
                  <span className="flex gap-3 text-xs font-semibold">
                    <Link href={`/foods/${food.id}`} className="text-primary hover:underline">
                      Details
                    </Link>
                    <Link
                      href={compareHref({ ...current, ids: current.ids.filter((id) => id !== food.id) })}
                      scroll={false}
                      className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" aria-hidden />
                      Remove
                    </Link>
                  </span>
                </span>
              )
            }}
          />

          <p className="text-sm">
            <Link href={compareHref({ ...current, all: !state.all })} scroll={false} className="font-bold text-primary hover:underline">
              {state.all ? "Show key nutrients only" : `Show all ${NUTRIENTS.length} nutrients`}
            </Link>
          </p>
        </>
      )}
    </div>
  )
}

function Summary({
  foods,
  wins,
  standouts,
}: {
  foods: FoodDetail[]
  wins: { wins: number[]; contested: number }
  standouts: Standout[][]
}) {
  const names = foods.map((f) => shortName(f.description))
  const leader = wins.wins.indexOf(Math.max(...wins.wins))
  return (
    <section aria-label="Summary" className="grid gap-4 rounded-3xl bg-tint-1 p-5 md:p-6">
      <p className="text-lg font-extrabold">
        {wins.contested === 0
          ? "These foods share too few nutrients with data to call a winner."
          : foods.length === 2
            ? `${names[leader]} comes out ahead on ${wins.wins[leader]} of ${wins.contested} nutrients both report.`
            : `Best values across ${wins.contested} nutrients all of them report: ${names
                .map((n, i) => `${n} ${wins.wins[i]}`)
                .join(", ")}.`}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {foods.map((food, i) =>
          standouts[i].length ? (
            <li key={food.id} className="text-sm">
              <span className="font-bold">{names[i]}</span>{" "}
              <span className="text-muted-foreground">has </span>
              {standouts[i].map((s, j) => (
                <span key={s.nutrient.key}>
                  {j > 0 ? ", " : ""}
                  <span className="font-semibold">
                    {formatRatio(s.ratio)} {inSentence(s.nutrient.name)}
                  </span>
                </span>
              ))}
            </li>
          ) : null
        )}
      </ul>
    </section>
  )
}
