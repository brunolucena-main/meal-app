import { Sparkles } from "lucide-react"
import Link from "next/link"

import { AddButton } from "@/components/creative/add-button"
import { IngredientChip } from "@/components/food/ingredient-chip"
import { TASTE_LABELS, type Taste } from "@/lib/flavor/tastes"
import type { T } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { FlavorGuide as Guide, GuideChip } from "@/server/flavor-guide"
import type { RecipeView } from "@/server/recipes"

/** A flavor page opened "for this recipe", so its ingredients can be added (src/server/cooking.ts). */
export const exploreHref = (recipeId: number, path: string) => `/recipes/${recipeId}/explore?to=${encodeURIComponent(path)}`

/**
 * The creative section inside the recipe editor: the dish's tastes and what would balance
 * them, what goes with its ingredients, which of them rarely meet, and links into the flavor
 * pages for this recipe. Every suggestion can be added in one click.
 */
export function FlavorGuide({ recipe, guide, t }: { recipe: RecipeView; guide: Guide | null; t: T }) {
  const add = (c: GuideChip) => (
    <span key={c.id} className="inline-flex items-center gap-1">
      <Link href={exploreHref(recipe.id, `/pairings?i=${c.id}`)} className="rounded-full focus-visible:outline-2 focus-visible:outline-ring">
        <IngredientChip food={c} size="sm" className="hover:bg-muted" />
      </Link>
      <AddButton recipeId={recipe.id} recipeName={recipe.name} foodId={c.foodId} name={c.name} className="size-6" />
    </span>
  )
  const tastes = guide ? (Object.entries(guide.tastes) as [Taste, 1 | 2][]) : []

  return (
    <section aria-labelledby="guide-h" className="surface grid gap-5 rounded-3xl p-5">
      <div className="grid gap-1">
        <h2 id="guide-h" className="flex items-center gap-2 text-lg font-extrabold">
          <Sparkles className="size-5 text-violet" aria-hidden />
          {t("Flavor guide")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("From about a million recipes (FlavorGraph) and the dish's own tastes. + adds an ingredient at 100 g.")}
        </p>
      </div>

      {!guide ? (
        <p className="text-sm text-muted-foreground">{t("Flavor data isn't imported yet (npm run data:flavor).")}</p>
      ) : recipe.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Add a first ingredient and the guide suggests what goes with it.")}</p>
      ) : (
        <>
          <Block title={t("Tastes")}>
            {tastes.length ? (
              <span className="flex flex-wrap gap-1.5">
                {tastes.map(([taste, s]) => (
                  <span key={taste} className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", s === 2 ? "bg-violet text-white" : "bg-violet-soft")}>
                    {t(TASTE_LABELS[taste])}
                    {s === 2 ? "" : ` ${t("(mild)")}`}
                  </span>
                ))}
              </span>
            ) : (
              <p className="text-sm text-muted-foreground">{t("No strong taste yet: a blank canvas.")}</p>
            )}
          </Block>

          {guide.balance.length ? (
            <Block title={t("Balance")}>
              <ul className="grid gap-3">
                {guide.balance.map(({ gap, options }) => (
                  <li key={gap.theirs} className="grid gap-1.5">
                    <span className="text-sm">
                      <span className="font-bold">
                        {t("{a} · no {b} yet", { a: t(TASTE_LABELS[gap.mine]), b: t(TASTE_LABELS[gap.theirs]).toLowerCase() })}
                      </span>{" "}
                      <span className="text-muted-foreground">· {t(gap.reason)}</span>
                    </span>
                    <span className="flex flex-wrap gap-2">{options.map(add)}</span>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}

          {guide.companions.length ? (
            <Block title={t("Goes with your ingredients")}>
              <ul className="grid gap-x-6 sm:grid-cols-2">
                {guide.companions.map(({ chip, with: partners }) => (
                  <li key={chip.id} className="grid gap-0.5 border-t border-border py-2">
                    {add(chip)}
                    <span className="pl-1 text-[11px] text-muted-foreground">{t("with {names}", { names: partners.join(", ").toLowerCase() })}</span>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}

          {guide.rare.length ? (
            <Block title={t("Rarely together")}>
              <ul className="grid gap-2">
                {guide.rare.map(({ a, b, bridge }) => (
                  <li key={`${a.id}-${b.id}`} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold">{t("{a} and {b}", { a: a.name, b: b.name })}</span>
                    {bridge ? (
                      <>
                        <span className="text-muted-foreground">{t("meet through")}</span>
                        {add(bridge)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">{t("rarely share a dish")}</span>
                    )}
                    <Link href={exploreHref(recipe.id, `/bridges?a=${a.id}&b=${b.id}`)} className="text-xs font-bold text-violet hover:underline">
                      {t("More bridges")}
                    </Link>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}

          {guide.matched.length ? (
            <Block title={t("Explore your ingredients")}>
              <span className="flex flex-wrap gap-2">
                {guide.matched.map(({ ingredient }) => (
                  <Link
                    key={ingredient.id}
                    href={exploreHref(recipe.id, `/pairings?i=${ingredient.id}`)}
                    className="rounded-full focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <IngredientChip food={ingredient} size="sm" className="hover:bg-muted" />
                  </Link>
                ))}
              </span>
              <p className="text-xs text-muted-foreground">
                {t("Opens Pairings, Opposites, Bridges and the Flavor map for this recipe: anything you find there can be added with +.")}
              </p>
            </Block>
          ) : null}

          {guide.unmatched.length ? (
            <p className="text-xs text-muted-foreground">
              {t("No flavor data for {names}.", { names: guide.unmatched.join(", ") })}
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <h3 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  )
}
