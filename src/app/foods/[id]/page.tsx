import { ArrowLeft, Columns3, ExternalLink, Replace, TriangleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { buttonVariants } from "@/components/ui/button"
import { NutrientTable } from "@/components/nutrition/nutrient-table"
import { formatAmount } from "@/lib/format"
import { NUTRIENTS, type NutrientKey } from "@/lib/nutrition/nutrients"
import { cn } from "@/lib/utils"
import { getFood, SOURCE_LABELS } from "@/server/foods"
import { getSettings } from "@/server/settings"

async function load(props: PageProps<"/foods/[id]">) {
  const { id } = await props.params
  const food = Number.isInteger(Number(id)) ? await getFood(Number(id)) : null
  if (!food) notFound()
  return food
}

export async function generateMetadata(props: PageProps<"/foods/[id]">): Promise<Metadata> {
  const food = await load(props)
  return { title: `${food.description} · Meal App` }
}

const headline: { key: NutrientKey; label: string; unit: string }[] = [
  { key: "energy", label: "Energy", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
]

export default async function FoodPage(props: PageProps<"/foods/[id]">) {
  const [food, settings] = await Promise.all([load(props), getSettings()])
  const { portion: portionParam } = await props.searchParams
  const flagged = food.allergens.filter((a) => settings.allergies.includes(a))
  const portion = food.portions.find((p) => String(p.id) === portionParam)
  const grams = portion ? portion.gramWeight : 100
  const factor = grams / 100
  const basis = portion ? `${portion.label} (${formatAmount(grams)} g)` : "100 g"

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <Link href="/foods" className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Foods
      </Link>

      <header className="grid gap-3">
        <div className="flex items-center gap-4">
          <IngredientSwatch
            food={{ name: food.description, color: food.color, group: food.group }}
            className="size-12 rounded-[16px_16px_16px_5px]"
          />
          <h1 className="flex-1 text-2xl font-extrabold tracking-tight md:text-3xl">{food.description}</h1>
          <Link href={`/substitutes?id=${food.id}`} className={buttonVariants({ variant: "outline" })}>
            <Replace aria-hidden />
            Substitutes
          </Link>
          <Link href={`/compare?ids=${food.id}`} className={buttonVariants({ variant: "outline" })}>
            <Columns3 aria-hidden />
            Compare
          </Link>
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {food.category ? <span>{food.category}</span> : null}
          <span aria-hidden>·</span>
          <span>{SOURCE_LABELS[food.source]}</span>
          <span aria-hidden>·</span>
          <a
            href={`https://fdc.nal.usda.gov/food-details/${food.id}/nutrients`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            FDC {food.id}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <span aria-hidden>·</span>
          <span>
            {food.nutrientCount} of {NUTRIENTS.length} nutrients reported
          </span>
        </p>
        {flagged.length ? (
          <p className="flex items-center gap-2 justify-self-start rounded-2xl bg-warn-soft px-4 py-2.5 text-sm font-bold text-warn">
            <TriangleAlert className="size-4" aria-hidden />
            Contains {flagged.join(", ")}, which is on your allergy list.
          </p>
        ) : null}
      </header>

      <nav aria-label="Amount" className="flex flex-wrap gap-2">
        <BasisLink href={`/foods/${food.id}`} active={!portion}>
          Per 100 g
        </BasisLink>
        {food.portions.map((p) => (
          <BasisLink key={p.id} href={`/foods/${food.id}?portion=${p.id}`} active={portion?.id === p.id}>
            {p.label} <span className="font-medium opacity-70">· {formatAmount(p.gramWeight)} g</span>
          </BasisLink>
        ))}
      </nav>

      <section aria-label={`Summary per ${basis}`} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {headline.map((h, i) => {
          const raw = food.nutrients[h.key]
          return (
            <div key={h.key} className={cn("grid gap-1 rounded-3xl p-4", i === 0 ? "bg-tint-1" : "surface")}>
              <span className="text-xs font-bold text-muted-foreground">{h.label}</span>
              <span className="text-2xl font-extrabold tabular-nums">
                {raw === undefined ? (
                  <span className="text-base font-semibold text-muted-foreground italic">no data</span>
                ) : (
                  <>
                    {formatAmount(raw * factor)} <span className="text-sm font-semibold text-muted-foreground">{h.unit}</span>
                  </>
                )}
              </span>
            </div>
          )
        })}
      </section>

      <p className="-mb-2 text-sm text-muted-foreground">
        All values per <span className="font-bold text-foreground">{basis}</span>. Bars show the share of your{" "}
        <Link href="/targets" className="font-semibold text-primary hover:underline">
          daily targets
        </Link>
        .
      </p>
      <NutrientTable nutrients={food.nutrients} factor={factor} targets={settings.targets} />
    </div>
  )
}

function BasisLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-bold transition-colors",
        active ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
      )}
    >
      {children}
    </Link>
  )
}
