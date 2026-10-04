import { ArrowLeft, Trash2 } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { NutrientTable } from "@/components/nutrition/nutrient-table"
import { Button } from "@/components/ui/button"
import { formatAmount } from "@/lib/format"
import type { NutrientKey } from "@/lib/nutrition/nutrients"
import { cn } from "@/lib/utils"
import { getRecipe } from "@/server/recipes"
import { getSettings } from "@/server/settings"
import { removeRecipe, saveRecipeDetails } from "../actions"
import { AddIngredient } from "./add-ingredient"
import { IngredientRow } from "./ingredient-row"

async function load(props: PageProps<"/recipes/[id]">) {
  const { id } = await props.params
  const recipe = Number.isInteger(Number(id)) ? await getRecipe(Number(id)) : null
  if (!recipe) notFound()
  return recipe
}

export async function generateMetadata(props: PageProps<"/recipes/[id]">): Promise<Metadata> {
  return { title: `${(await load(props)).name} · Meal App` }
}

const headline: { key: NutrientKey; label: string; unit: string }[] = [
  { key: "energy", label: "Energy", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
]

const field = "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-semibold"

export default async function RecipePage(props: PageProps<"/recipes/[id]">) {
  const [recipe, settings] = await Promise.all([load(props), getSettings()])
  const serving = recipe.kind === "meal" ? "the meal" : "one serving"
  const partialCount = Object.keys(recipe.nutrition.partial).length
  const factor = recipe.servings > 0 ? 1 / recipe.servings : 1

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <Link href="/recipes" className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Recipes
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="grid content-start gap-4">
          <form action={saveRecipeDetails.bind(null, recipe.id)} className="surface grid gap-4 rounded-3xl p-5">
            <label className="grid gap-1.5 text-sm font-bold">
              Name
              <input name="name" defaultValue={recipe.name} required maxLength={120} className={cn(field, "h-11 text-base font-extrabold")} />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1.5 text-sm font-bold">
                Type
                <select name="kind" defaultValue={recipe.kind} className={field}>
                  <option value="recipe">Recipe</option>
                  <option value="meal">Reusable meal</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-bold">
                Servings
                <input name="servings" type="number" min={0.25} max={100} step="0.25" defaultValue={recipe.servings} className={field} />
              </label>
              <label className="grid gap-1.5 text-sm font-bold">
                Cooked weight (g)
                <input
                  name="cookedGrams"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={recipe.cookedGrams ?? ""}
                  placeholder={formatAmount(recipe.nutrition.totalGrams)}
                  className={field}
                />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-bold">
              Notes
              <textarea name="notes" defaultValue={recipe.notes ?? ""} rows={3} className="rounded-xl border border-input bg-card px-3 py-2 text-sm" />
            </label>
            <Button type="submit" className="justify-self-start">
              Save details
            </Button>
          </form>

          <section aria-labelledby="ingredients-h" className="surface grid gap-3 rounded-3xl p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="ingredients-h" className="text-lg font-extrabold">
                Ingredients
              </h2>
              <span className="text-sm text-muted-foreground tabular-nums">{formatAmount(recipe.nutrition.totalGrams)} g raw</span>
            </div>
            {recipe.items.length ? (
              <ul>
                {recipe.items.map((item) => (
                  <IngredientRow
                    key={`${item.id}-${item.grams}`}
                    recipeId={recipe.id}
                    item={item}
                    flagged={item.allergens.some((a) => settings.allergies.includes(a))}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No ingredients yet. Search below to add the first one.</p>
            )}
            <AddIngredient recipeId={recipe.id} />
            <p className="text-xs text-muted-foreground">
              Pick the form you actually weigh: &ldquo;Rice, white, cooked&rdquo; and &ldquo;Rice, white, raw&rdquo; differ about
              threefold per gram.
            </p>
          </section>

          <form action={removeRecipe.bind(null, recipe.id)}>
            <Button type="submit" variant="destructive">
              <Trash2 aria-hidden />
              Delete {recipe.kind === "meal" ? "meal" : "recipe"}
            </Button>
          </form>
        </div>

        <section aria-label="Nutrition" className="grid content-start gap-4">
          <div className="grid gap-3 rounded-3xl bg-tint-1 p-5">
            <h2 className="text-lg font-extrabold">Per {serving}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {headline.map((h) => (
                <div key={h.key} className="grid gap-0.5">
                  <span className="text-xs font-bold text-muted-foreground">{h.label}</span>
                  <span className="text-xl font-extrabold tabular-nums">
                    {recipe.nutrition.partial[h.key] ? <span className="text-warn">≥ </span> : null}
                    {formatAmount(recipe.perServing[h.key] ?? 0)}{" "}
                    <span className="text-sm font-semibold text-muted-foreground">{h.unit}</span>
                  </span>
                </div>
              ))}
            </div>
            {recipe.kind === "recipe" && recipe.nutrition.totalGrams > 0 ? (
              <p className="text-xs text-muted-foreground tabular-nums">
                Per 100 g of the {recipe.cookedGrams ? "cooked" : "raw"} dish: {formatAmount(recipe.per100g.energy ?? 0)} kcal ·{" "}
                {formatAmount(recipe.per100g.protein ?? 0)} g protein
              </p>
            ) : null}
            {partialCount ? (
              <p className="text-xs font-semibold text-warn">
                ≥ marks {partialCount} {partialCount === 1 ? "nutrient" : "nutrients"} where some ingredients have no data, so
                the real amount is at least this. Hover a value to see which.
              </p>
            ) : null}
          </div>
          {recipe.items.length ? (
            <NutrientTable
              nutrients={recipe.nutrition.totals}
              factor={factor}
              targets={settings.targets}
              partial={recipe.nutrition.partial}
              className="lg:grid-cols-1"
            />
          ) : null}
        </section>
      </div>
    </div>
  )
}
