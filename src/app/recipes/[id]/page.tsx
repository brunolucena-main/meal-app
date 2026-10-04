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
import { getT } from "@/server/i18n"

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
  const t = await getT()
  const [recipe, settings, search] = await Promise.all([load(props), getSettings(), props.searchParams])
  const inUse = Number(Array.isArray(search.inUse) ? search.inUse[0] : search.inUse) || 0
  const serving = recipe.kind === "meal" ? t("Per the meal") : t("Per one serving")
  const partialCount = Object.keys(recipe.nutrition.partial).length
  const factor = recipe.servings > 0 ? 1 / recipe.servings : 1

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <Link href="/recipes" className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {t("Recipes")}
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="grid content-start gap-4">
          <form action={saveRecipeDetails.bind(null, recipe.id)} className="surface grid gap-4 rounded-3xl p-5">
            <label className="grid gap-1.5 text-sm font-bold">
              {t("Name")}
              <input name="name" defaultValue={recipe.name} required maxLength={120} className={cn(field, "h-11 text-base font-extrabold")} />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1.5 text-sm font-bold">
                {t("Type")}
                <select name="kind" defaultValue={recipe.kind} className={field}>
                  <option value="recipe">{t("Recipe")}</option>
                  <option value="meal">{t("Reusable meal")}</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-bold">
                {t("Servings")}
                <input name="servings" type="number" min={0.25} max={100} step="0.25" defaultValue={recipe.servings} className={field} />
              </label>
              <label className="grid gap-1.5 text-sm font-bold">
                {t("Cooked weight (g)")}
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
              {t("Notes")}
              <textarea name="notes" defaultValue={recipe.notes ?? ""} rows={3} className="rounded-xl border border-input bg-card px-3 py-2 text-sm" />
            </label>
            <Button type="submit" className="justify-self-start">
              {t("Save details")}
            </Button>
          </form>

          <section aria-labelledby="ingredients-h" className="surface grid gap-3 rounded-3xl p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="ingredients-h" className="text-lg font-extrabold">
                {t("Ingredients")}
              </h2>
              <span className="text-sm text-muted-foreground tabular-nums">{t("{n} g raw", { n: formatAmount(recipe.nutrition.totalGrams) })}</span>
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
              <p className="text-sm text-muted-foreground">{t("No ingredients yet. Search below to add the first one.")}</p>
            )}
            <AddIngredient recipeId={recipe.id} />
            <p className="text-xs text-muted-foreground">
              {t("Pick the form you actually weigh: “Rice, white, cooked” and “Rice, white, raw” differ about threefold per gram.")}
            </p>
          </section>

          {inUse > 0 ? (
            <p role="alert" className="rounded-2xl bg-warn-soft px-4 py-3 text-sm font-bold text-warn">
              {t("Used on {n} planned or logged items. Remove it from those days first, so your log stays accurate.", { n: inUse })}
            </p>
          ) : null}
          <form action={removeRecipe.bind(null, recipe.id)}>
            <Button type="submit" variant="destructive">
              <Trash2 aria-hidden />
              {recipe.kind === "meal" ? t("Delete meal") : t("Delete recipe")}
            </Button>
          </form>
        </div>

        <section aria-label={t("Nutrition")} className="grid content-start gap-4">
          <div className="grid gap-3 rounded-3xl bg-tint-1 p-5">
            <h2 className="text-lg font-extrabold">{serving}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {headline.map((h) => (
                <div key={h.key} className="grid gap-0.5">
                  <span className="text-xs font-bold text-muted-foreground">{t(h.label)}</span>
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
                {recipe.cookedGrams ? t("Per 100 g of the cooked dish:") : t("Per 100 g of the raw dish:")}{" "}
                {formatAmount(recipe.per100g.energy ?? 0)} kcal · {t("{n} g protein", { n: formatAmount(recipe.per100g.protein ?? 0) })}
              </p>
            ) : null}
            {partialCount ? (
              <p className="text-xs font-semibold text-warn">
                {t("≥ marks {n} nutrients where some ingredients have no data, so the real amount is at least this. Hover a value to see which.", { n: partialCount })}
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
