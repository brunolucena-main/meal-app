import { ChefHat, TriangleAlert, Utensils } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { Button } from "@/components/ui/button"
import { formatAmount } from "@/lib/format"
import { listRecipes, type RecipeView } from "@/server/recipes"
import { getSettings } from "@/server/settings"
import { newRecipe } from "./actions"

export const metadata: Metadata = { title: "Recipes · Meal App" }

export default async function RecipesPage() {
  const [all, settings] = await Promise.all([listRecipes(), getSettings()])
  const meals = all.filter((r) => r.kind === "meal")
  const recipes = all.filter((r) => r.kind === "recipe")

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:px-10 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Recipes</h1>
          <p className="max-w-[60ch] text-muted-foreground">
            Recipes divide into servings. Reusable meals, like your usual breakfast, are eaten as one serving and drop
            straight into a day.
          </p>
        </div>
        <div className="flex gap-2">
          <form action={newRecipe.bind(null, "meal")}>
            <Button type="submit" variant="outline">
              <Utensils aria-hidden />
              New meal
            </Button>
          </form>
          <form action={newRecipe.bind(null, "recipe")}>
            <Button type="submit">
              <ChefHat aria-hidden />
              New recipe
            </Button>
          </form>
        </div>
      </header>

      {all.length === 0 ? (
        <section className="surface grid gap-2 rounded-3xl p-6">
          <h2 className="text-lg font-extrabold">Nothing saved yet</h2>
          <p className="text-muted-foreground">
            Start a recipe, add ingredients in grams, and its nutrition per serving appears as you go.
          </p>
        </section>
      ) : (
        <>
          <RecipeList title="Reusable meals" items={meals} allergies={settings.allergies} />
          <RecipeList title="Recipes" items={recipes} allergies={settings.allergies} />
        </>
      )}
    </div>
  )
}

function RecipeList({ title, items, allergies }: { title: string; items: RecipeView[]; allergies: string[] }) {
  if (!items.length) return null
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((r) => {
          const flagged = r.allergens.filter((a) => allergies.includes(a))
          return (
            <li key={r.id}>
              <Link href={`/recipes/${r.id}`} className="surface grid gap-3 rounded-3xl p-5 transition-colors hover:bg-muted">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-base font-extrabold">{r.name}</span>
                  {flagged.length ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-xs font-bold text-warn">
                      <TriangleAlert className="size-3" aria-hidden />
                      {flagged.join(", ")}
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap gap-1">
                  {r.items.slice(0, 8).map((i) => (
                    <IngredientSwatch key={i.id} food={{ name: i.name, color: i.color, group: i.group }} className="size-5" />
                  ))}
                  {r.items.length === 0 ? <span className="text-xs text-muted-foreground">No ingredients yet</span> : null}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {r.kind === "recipe" ? `${formatAmount(r.servings)} servings · ` : ""}
                  <span className="font-bold text-foreground">{formatAmount(r.perServing.energy ?? 0)} kcal</span>
                  {r.kind === "recipe" ? " per serving" : ""} · {formatAmount(r.perServing.protein ?? 0)} g protein
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
