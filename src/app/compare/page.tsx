import { X } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import type { ChipFood } from "@/components/food/ingredient-chip"
import { CompareTable } from "@/components/nutrition/compare-table"
import { formatAmount } from "@/lib/format"
import { compareFoods, standouts, winCounts, type Basis, type Standout } from "@/lib/nutrition/compare"
import { NUTRIENT_BY_KEY, NUTRIENTS, type NutrientKey } from "@/lib/nutrition/nutrients"
import { cn } from "@/lib/utils"
import { getFood, type FoodDetail } from "@/server/foods"
import type { T } from "@/lib/i18n"
import { getSettings } from "@/server/settings"
import { AddFood } from "./add-food"
import { PortionSelect } from "./portion-select"
import { compareHref, MAX_FOODS, parseCompareState, type CompareState } from "./url"
import { getT } from "@/server/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: `${t("Compare")} · Meal App` }
}

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

function formatRatio(ratio: number, t: T) {
  if (!Number.isFinite(ratio)) return t("only source")
  if (ratio >= 10) return "10×+"
  return `${formatAmount(ratio)}×`
}

export default async function ComparePage(props: PageProps<"/compare">) {
  const t = await getT()
  const state = parseCompareState(await props.searchParams)
  const [settings, ...loaded] = await Promise.all([getSettings(), ...state.ids.map((id) => getFood(id))])
  const foods = loaded.filter((f): f is FoodDetail => f !== null)

  const servingFor = (food: FoodDetail) => {
    const chosen = food.portions.find((p) => p.id === state.portions[food.id]) ?? food.portions[0]
    return chosen
  }

  const nutrientDefs = state.all ? NUTRIENTS : KEY_NUTRIENTS.map((k) => NUTRIENT_BY_KEY[k])
  const comparison = compareFoods(
    foods.map((f) => ({ profile: f.nutrients, servingGrams: servingFor(f)?.gramWeight })),
    state.basis,
    nutrientDefs,
    settings.targets
  )
  const chips: ChipFood[] = foods.map((f) => ({
    name: f.description,
    color: f.color,
    group: f.group,
    allergen: f.allergens.find((a) => settings.allergies.includes(a)),
  }))
  const current: CompareState = { ...state, ids: foods.map((f) => f.id) }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("Compare")}</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          {t("Up to {n} foods side by side. Switch the basis to compare by weight, by calories or by a real serving.", { n: MAX_FOODS })}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {foods.length < MAX_FOODS ? <AddFood state={current} /> : null}
        <nav aria-label={t("Compare by")} className="flex h-11 items-center gap-1 rounded-full bg-track p-1">
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
              {t(b.label)}
            </Link>
          ))}
        </nav>
      </div>

      {foods.length === 0 ? (
        <section className="surface grid gap-4 rounded-3xl p-6">
          <h2 className="text-lg font-extrabold">{t("Start with a pair")}</h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_STARTS.map((q) => (
              <Link
                key={q.label}
                href={compareHref({ ...current, ids: q.ids })}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold hover:bg-muted"
              >
                {t(q.label)}
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{t("Or add any food with the search box above.")}</p>
        </section>
      ) : (
        <>
          {foods.length >= 2 ? <Summary foods={foods} wins={winCounts(comparison)} standouts={standouts(comparison)} t={t} /> : null}

          <CompareTable
            foods={chips}
            comparison={comparison}
            caption={`${t(BASIS_CAPTION[state.basis])} · ${t("% of your daily targets")}`}
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
                      {state.basis === "100kcal" ? t("No calorie data, can't compare per 100 kcal") : t("USDA lists no portions")}
                    </span>
                  ) : null}
                  <span className="flex gap-3 text-xs font-semibold">
                    <Link href={`/foods/${food.id}`} className="text-primary hover:underline">
                      {t("Details")}
                    </Link>
                    <Link
                      href={compareHref({ ...current, ids: current.ids.filter((id) => id !== food.id) })}
                      scroll={false}
                      className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" aria-hidden />
                      {t("Remove")}
                    </Link>
                  </span>
                </span>
              )
            }}
          />

          <p className="text-sm">
            <Link href={compareHref({ ...current, all: !state.all })} scroll={false} className="font-bold text-primary hover:underline">
              {state.all ? t("Show key nutrients only") : t("Show all {n} nutrients", { n: NUTRIENTS.length })}
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
  t,
}: {
  foods: FoodDetail[]
  wins: { wins: number[]; contested: number }
  standouts: Standout[][]
  t: T
}) {
  const names = foods.map((f) => shortName(f.description))
  const leader = wins.wins.indexOf(Math.max(...wins.wins))
  return (
    <section aria-label={t("Summary")} className="grid gap-4 rounded-3xl bg-tint-1 p-5 md:p-6">
      <p className="text-lg font-extrabold">
        {wins.contested === 0
          ? t("These foods share too few nutrients with data to call a winner.")
          : foods.length === 2
            ? t("{food} comes out ahead on {n} of {total} nutrients both report.", {
                food: names[leader],
                n: wins.wins[leader],
                total: wins.contested,
              })
            : t("Best values across {total} nutrients all of them report: {list}.", {
                total: wins.contested,
                list: names.map((n, i) => `${n} ${wins.wins[i]}`).join(", "),
              })}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {foods.map((food, i) =>
          standouts[i].length ? (
            <li key={food.id} className="text-sm">
              <span className="font-bold">{names[i]}</span>{" "}
              <span className="text-muted-foreground">{t("leads on:")} </span>
              {standouts[i].map((s, j) => (
                <span key={s.nutrient.key}>
                  {j > 0 ? ", " : ""}
                  <span className="font-semibold">
                    {inSentence(t(s.nutrient.name))} ({formatRatio(s.ratio, t)})
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
