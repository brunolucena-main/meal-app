import { ArrowLeft, TriangleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { formatAmount } from "@/lib/format"
import { addDays, isoDate, parseIsoDate, weekStart } from "@/lib/nutrition/day"
import { cn } from "@/lib/utils"
import { shoppingList, type ShoppingItem } from "@/server/days"
import { getSettings } from "@/server/settings"
import { ShoppingCheck } from "./shopping-item"

export const metadata: Metadata = { title: "Shopping list · Meal App" }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""

/** "≈ 2 cups" from grams and a USDA portion, rounded to a half. */
function approx(item: ShoppingItem) {
  if (!item.portion) return null
  const count = Math.round((item.grams / item.portion.gramWeight) * 2) / 2
  if (count < 0.5) return null
  return `≈ ${formatAmount(count)} × ${item.portion.label}`
}

function weight(grams: number) {
  return grams >= 1000 ? `${formatAmount(grams / 1000)} kg` : `${formatAmount(grams)} g`
}

export default async function ShoppingPage(props: PageProps<"/shopping">) {
  const params = await props.searchParams
  const settings = await getSettings()
  const requested = one(params.week)
  const week = weekStart(parseIsoDate(requested) ? requested : isoDate(new Date()))
  const items = await shoppingList(week)
  const byCategory = new Map<string, ShoppingItem[]>()
  for (const item of items) {
    const key = item.category ?? "Other"
    byCategory.set(key, [...(byCategory.get(key) ?? []), item])
  }
  const from = parseIsoDate(week)!.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  const to = parseIsoDate(addDays(week, 6))!.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  const left = items.filter((i) => !i.checked).length

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <Link href={`/plan?week=${week}`} className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Plan
      </Link>
      <header className="grid gap-1">
        <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
          {from} – {to}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Shopping list</h1>
        <p className="text-muted-foreground">
          Everything still planned this week, with recipes broken into their ingredients.
          {items.length ? ` ${left} of ${items.length} left to get.` : ""}
        </p>
      </header>

      {items.length === 0 ? (
        <section className="surface grid gap-2 rounded-3xl p-6">
          <h2 className="text-lg font-extrabold">Nothing planned for this week</h2>
          <p className="text-muted-foreground">
            Plan some meals on the{" "}
            <Link href={`/plan?week=${week}`} className="font-bold text-primary hover:underline">
              week planner
            </Link>{" "}
            and they show up here.
          </p>
        </section>
      ) : (
        [...byCategory.entries()].map(([category, list]) => (
          <section key={category} aria-labelledby={`cat-${category}`} className="surface grid rounded-3xl px-5 py-3">
            <h2 id={`cat-${category}`} className="pt-1 pb-2 text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">
              {category}
            </h2>
            <ul className="divide-y divide-border">
              {list.map((item) => {
                const flagged = item.allergens.some((a) => settings.allergies.includes(a))
                return (
                  <li key={item.foodId} className="flex items-center gap-3 py-2.5">
                    <ShoppingCheck week={week} foodId={item.foodId} checked={item.checked} label={`Got ${item.name}`} />
                    <IngredientSwatch food={{ name: item.name, color: item.color, group: item.group }} className="size-5" />
                    <span className={cn("grid min-w-0 flex-1 gap-0.5", item.checked && "text-muted-foreground line-through")}>
                      <span className="text-sm font-bold">{item.name}</span>
                      {flagged ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-warn no-underline">
                          <TriangleAlert className="size-3" aria-hidden />
                          Contains {item.allergens.join(", ")}
                        </span>
                      ) : null}
                    </span>
                    <span className="grid justify-items-end text-right text-sm tabular-nums">
                      <span className="font-extrabold">{weight(item.grams)}</span>
                      {approx(item) ? <span className="text-xs text-muted-foreground">{approx(item)}</span> : null}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
