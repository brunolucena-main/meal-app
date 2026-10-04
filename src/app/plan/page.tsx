import { ChevronLeft, ChevronRight, ShoppingBasket } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { buttonVariants } from "@/components/ui/button"
import { formatAmount, formatDate } from "@/lib/format"
import { addDays, isoDate, parseIsoDate, SLOTS, weekStart } from "@/lib/nutrition/day"
import { cn } from "@/lib/utils"
import { getDays } from "@/server/days"
import { getSettings } from "@/server/settings"
import { getT } from "@/server/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: `${t("Plan")} · Meal App` }
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""

export default async function PlanPage(props: PageProps<"/plan">) {
  const t = await getT()
  const params = await props.searchParams
  const settings = await getSettings()
  const today = isoDate(new Date())
  const requested = one(params.week)
  const week = weekStart(parseIsoDate(requested) ? requested : today)
  const days = await getDays(week, 7)

  const energyTarget = settings.targets.energy ?? 0
  const proteinTarget = settings.targets.protein ?? 0
  const plannedDays = days.filter((d) => d.entries.length > 0)
  const avg = (key: "energy" | "protein") =>
    plannedDays.length ? plannedDays.reduce((s, d) => s + (d.totals.projected[key] ?? 0), 0) / plannedDays.length : 0
  const weekLabel = formatDate(parseIsoDate(week)!, { day: "numeric", month: "long" })

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">{t("Week of {date}", { date: weekLabel })}</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("Plan")}</h1>
        </div>
        <nav aria-label={t("Change week")} className="flex items-center gap-1">
          <Link href={`/plan?week=${addDays(week, -7)}`} aria-label={t("Previous week")} className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ChevronLeft aria-hidden />
          </Link>
          {week !== weekStart(today) ? (
            <Link href="/plan" className={buttonVariants({ variant: "outline" })}>
              {t("This week")}
            </Link>
          ) : null}
          <Link href={`/plan?week=${addDays(week, 7)}`} aria-label={t("Next week")} className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ChevronRight aria-hidden />
          </Link>
          <Link href={`/shopping?week=${week}`} className={buttonVariants({ className: "ml-2" })}>
            <ShoppingBasket aria-hidden />
            {t("Shopping list")}
          </Link>
        </nav>
      </header>

      <section aria-label={t("Week summary")} className="flex flex-wrap gap-x-8 gap-y-2 rounded-3xl bg-tint-1 px-5 py-4 text-sm">
        <span>
          <span className="font-extrabold">{t("{n} of 7", { n: plannedDays.length })}</span> {t("days planned")}
        </span>
        <span className="tabular-nums">
          {t("Average")} <span className="font-extrabold">{formatAmount(avg("energy"))}</span>{" "}
          {t("of {n} kcal", { n: formatAmount(energyTarget) })}
        </span>
        <span className="tabular-nums">
          <span className="font-extrabold">{formatAmount(avg("protein"))}</span>{" "}
          {t("of {n} g protein", { n: formatAmount(proteinTarget) })}
        </span>
      </section>

      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {days.map((d) => {
          const eaten = d.totals.eaten.energy ?? 0
          const projected = d.totals.projected.energy ?? 0
          const eatenPct = energyTarget ? Math.min((eaten / energyTarget) * 100, 100) : 0
          const projectedPct = energyTarget ? Math.min((projected / energyTarget) * 100, 100) : 0
          const date = parseIsoDate(d.date)!
          return (
            <li key={d.date}>
              <Link
                href={d.date === today ? "/" : `/log/${d.date}`}
                className={cn(
                  "surface grid h-full content-start gap-3 rounded-3xl p-4 transition-colors hover:bg-muted",
                  d.date === today && "ring-2 ring-primary"
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-extrabold">{formatDate(date, { weekday: "short", day: "numeric" })}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatAmount(projected)} / {formatAmount(energyTarget)} kcal
                  </span>
                </span>
                <span className="relative block h-2 overflow-hidden rounded-full bg-track" aria-hidden>
                  <span className="absolute inset-y-0 left-0 bg-primary/35" style={{ width: `${projectedPct}%` }} />
                  <span className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${eatenPct}%` }} />
                </span>
                {d.entries.length ? (
                  <span className="grid gap-2">
                    {SLOTS.map((slot) => {
                      const items = d.entries.filter((e) => e.slot === slot.value)
                      if (!items.length) return null
                      return (
                        <span key={slot.value} className="grid gap-1">
                          <span className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">{t(slot.label)}</span>
                          {items.map((e) => (
                            <span key={e.id} className={cn("flex min-w-0 items-center gap-1.5 text-xs font-semibold", e.status === "planned" && "text-muted-foreground")}>
                              <IngredientSwatch food={{ name: e.name, color: e.color, group: e.group }} className="size-3.5" />
                              <span className="truncate">{e.name}</span>
                            </span>
                          ))}
                        </span>
                      )
                    })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{t("Nothing planned. Open the day to add meals.")}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        Open a day to add or change what&apos;s on it. Future days start as plans; tick items as eaten when you have them.
      </p>
    </div>
  )
}
