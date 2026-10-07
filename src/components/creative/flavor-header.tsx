import { ExternalLink } from "lucide-react"
import Link from "next/link"

import { AddToCooking, CookingBar } from "@/components/creative/cooking"
import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { TASTE_LABELS, type Taste, type TasteProfile } from "@/lib/flavor/tastes"
import { cn } from "@/lib/utils"
import { getT } from "@/server/i18n"
import type { FlavorIngredient } from "@/server/flavor"

const VIEWS = [
  { key: "pairings", label: "Pairings", href: (id: number) => `/pairings?i=${id}` },
  { key: "opposites", label: "Opposites", href: (id: number) => `/opposites?i=${id}` },
  { key: "map", label: "Flavor map", href: (id: number) => `/flavor-map?i=${id}` },
  { key: "bridges", label: "Bridge to…", href: (id: number) => `/bridges?a=${id}` },
] as const

/** Ingredient title on the night sky, with its tastes and links to the other creative views. */
export async function FlavorHeader({
  ingredient,
  tastes,
  current,
  section,
}: {
  ingredient: FlavorIngredient
  tastes?: TasteProfile
  current: (typeof VIEWS)[number]["key"]
  section: string
}) {
  const t = await getT()
  const tasteList = tastes ? (Object.entries(tastes) as [Taste, 1 | 2][]) : []
  return (
    <header className="grid gap-3">
      <CookingBar />
      <p className="text-xs font-bold tracking-[0.12em] text-on-night-muted uppercase">{t(section)}</p>
      <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight">
        <IngredientSwatch
          food={{ name: ingredient.name, color: ingredient.color, group: ingredient.group }}
          className="size-10 rounded-[14px_14px_14px_4px]"
        />
        {ingredient.name}
        <AddToCooking foodId={ingredient.foodId} name={ingredient.name} />
      </h1>
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-on-night-muted">
        {ingredient.category ? <span>{t(ingredient.category)}</span> : null}
        {tasteList.map(([taste, s]) => (
          <span key={taste} className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", s === 2 ? "bg-white/25 text-on-night" : "bg-white/12 text-on-night-muted")}>
            {t(TASTE_LABELS[taste])}
            {s === 2 ? "" : ` ${t("(mild)")}`}
          </span>
        ))}
        {ingredient.foodId ? (
          <Link href={`/foods/${ingredient.foodId}`} className="inline-flex items-center gap-1 font-bold text-on-night hover:underline">
            {t("Nutrition")}
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      <nav aria-label={t("Views")} className="flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={v.href(ingredient.id)}
            aria-current={v.key === current ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors",
              v.key === current ? "bg-card text-foreground" : "bg-white/10 text-on-night hover:bg-white/20"
            )}
          >
            {t(v.label)}
          </Link>
        ))}
      </nav>
    </header>
  )
}
