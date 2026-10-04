import { TriangleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { formatAmount } from "@/lib/format"
import { searchFoods, SOURCE_LABELS } from "@/server/foods"
import { SearchBox } from "./search-box"

export const metadata: Metadata = { title: "Foods · Meal App" }

const suggestions = ["spinach", "lentils", "oats", "salmon", "chickpeas", "greek yogurt", "sweet potato", "almonds"]

export default async function FoodsPage(props: PageProps<"/foods">) {
  const { q } = await props.searchParams
  const query = typeof q === "string" ? q : ""
  const results = query ? await searchFoods(query) : []

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Foods</h1>
        <p className="text-muted-foreground">
          Generic foods from USDA FoodData Central, with up to 40 nutrients each. Values are per 100 g.
        </p>
      </header>

      <SearchBox initialQuery={query} />

      {!query ? (
        <div className="grid gap-3">
          <p className="text-sm font-bold">Try</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Link
                key={s}
                href={`/foods?q=${encodeURIComponent(s)}`}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold hover:bg-muted"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      ) : results.length === 0 ? (
        <p className="text-muted-foreground">
          No foods match &ldquo;{query}&rdquo;. Try a single word, like &ldquo;lentil&rdquo; instead of &ldquo;red lentil
          soup&rdquo;.
        </p>
      ) : (
        <section aria-label="Results" className="grid gap-2">
          <p className="text-sm text-muted-foreground">
            {results.length === 40 ? "Top 40 matches" : `${results.length} matches`} for &ldquo;{query}&rdquo;
          </p>
          <ul className="surface divide-y divide-border overflow-hidden rounded-3xl">
            {results.map((food) => (
              <li key={food.id}>
                <Link
                  href={`/foods/${food.id}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <IngredientSwatch food={{ name: food.description, color: food.color, group: food.group }} className="size-8 rounded-[10px_10px_10px_3px]" />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="font-bold">{food.description}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {food.category ? <span>{food.category}</span> : null}
                      <span aria-hidden>·</span>
                      <span>{SOURCE_LABELS[food.source]}</span>
                      {food.allergens.length ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 font-bold text-warn">
                          <TriangleAlert className="size-3" aria-hidden />
                          {food.allergens.join(", ")}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="grid justify-items-end text-sm tabular-nums">
                    <span className="font-extrabold">
                      {food.energyKcal === null ? "—" : formatAmount(food.energyKcal)}{" "}
                      <span className="text-xs font-semibold text-muted-foreground">kcal</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {food.proteinG === null ? "no protein data" : `${formatAmount(food.proteinG)} g protein`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
