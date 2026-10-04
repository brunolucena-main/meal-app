import { ChevronLeft, ChevronRight, Copy, Medal } from "lucide-react"
import Link from "next/link"

import { copyDayTo } from "@/app/day-actions"
import { AddEntry } from "@/components/day/add-entry"
import { EntryRow } from "@/components/day/entry-row"
import { statusForGoal, statusForLimit, TargetBar } from "@/components/nutrition/target-bar"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatAmount, formatDate } from "@/lib/format"
import type { T } from "@/lib/i18n"
import { addDays, largestGaps, parseIsoDate, SLOTS, type EntryStatus } from "@/lib/nutrition/day"
import { NUTRIENT_BY_KEY, type NutrientKey } from "@/lib/nutrition/nutrients"
import type { DayView as Day, RecentItem } from "@/server/days"
import { getT } from "@/server/i18n"
import type { Settings } from "@/server/settings"

const BARS: NutrientKey[] = ["protein", "fiber", "carbs", "fat"]
const LIMITS: NutrientKey[] = ["sodium", "satFat"]

export function formatDayTitle(iso: string, today: string, t: T) {
  if (iso === today) return t("Today")
  if (iso === addDays(today, -1)) return t("Yesterday")
  if (iso === addDays(today, 1)) return t("Tomorrow")
  return formatDate(parseIsoDate(iso)!, { weekday: "long", day: "numeric", month: "long" })
}

/**
 * One day: energy summary, target bars, the biggest gaps, then the meal slots with their
 * entries. `defaultStatus` decides whether new entries are logged as eaten or planned.
 */
export async function DayView({
  day,
  today,
  settings,
  recipes,
  defaultStatus,
  hrefFor,
  recent = [],
}: {
  day: Day
  recent?: RecentItem[]
  today: string
  settings: Settings
  recipes: { id: number; name: string; kind: "recipe" | "meal" }[]
  defaultStatus: EntryStatus
  hrefFor: (iso: string) => string
}) {
  const { totals } = day
  const energyTarget = settings.targets.energy ?? 0
  const eatenKcal = totals.eaten.energy ?? 0
  const plannedKcal = totals.planned.energy ?? 0
  const eatenPct = energyTarget ? Math.min((eatenKcal / energyTarget) * 100, 100) : 0
  const plannedPct = energyTarget ? Math.min((plannedKcal / energyTarget) * 100, 100 - eatenPct) : 0
  const gapKeys = largestGaps(settings.targets, totals.projected, 4, day.entries.length > 0)
  const partial = new Set(totals.partial)
  const t = await getT()
  const title = formatDayTitle(day.date, today, t)

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
            {formatDate(parseIsoDate(day.date)!, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        </div>
        <nav aria-label={t("Change day")} className="flex items-center gap-1">
          <Link href={hrefFor(addDays(day.date, -1))} aria-label={t("Previous day")} className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ChevronLeft aria-hidden />
          </Link>
          {day.date !== today ? (
            <Link href={hrefFor(today)} className={buttonVariants({ variant: "outline" })}>
              {t("Today")}
            </Link>
          ) : null}
          <Link href={hrefFor(addDays(day.date, 1))} aria-label={t("Next day")} className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ChevronRight aria-hidden />
          </Link>
        </nav>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section aria-label={t("Energy")} className="grid content-start gap-3 rounded-3xl bg-tint-1 p-5 md:p-6">
          <span className="text-xs font-bold tracking-[0.12em] text-accent-foreground uppercase">{t("Energy")}</span>
          <span className="text-[40px] leading-none font-extrabold tabular-nums">
            {formatAmount(eatenKcal)}{" "}
            <span className="text-base font-semibold text-muted-foreground">{t("of {n} kcal eaten", { n: formatAmount(energyTarget) })}</span>
          </span>
          <div
            role="meter"
            aria-label={t("Energy eaten")}
            aria-valuenow={Math.round(eatenPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="flex h-4 overflow-hidden rounded-full bg-card"
          >
            <div className="h-full bg-primary" style={{ width: `${eatenPct}%` }} />
            <div className="h-full bg-primary/35" style={{ width: `${plannedPct}%` }} />
          </div>
          <p className="text-sm font-bold">
            {energyTarget - eatenKcal - plannedKcal >= 0
              ? t("{n} kcal free", { n: formatAmount(energyTarget - eatenKcal - plannedKcal) })
              : t("{n} kcal over", { n: formatAmount(eatenKcal + plannedKcal - energyTarget) })}
            <span className="font-medium text-muted-foreground">
              {` · ${plannedKcal > 0 ? t("{n} kcal still planned", { n: formatAmount(plannedKcal) }) : t("nothing else planned")}`}
            </span>
          </p>
        </section>

        <section aria-label={t("Targets")} className="surface grid gap-5 rounded-3xl p-5 sm:grid-cols-2 md:p-6">
          {[...BARS, ...LIMITS].map((key) => {
            const n = NUTRIENT_BY_KEY[key]
            const target = settings.targets[key] ?? 0
            const value = totals.eaten[key] ?? 0
            return (
              <TargetBar
                key={key}
                label={`${t(n.name)}${partial.has(key) && value > 0 ? ` ${t("(at least)")}` : ""}`}
                value={value}
                target={target}
                unit={n.unit}
                status={n.kind === "limit" ? statusForLimit(value, target) : statusForGoal(value, target)}
              />
            )
          })}
        </section>
      </div>

      {gapKeys.length ? (
        <section aria-label={t("Biggest gaps")} className="surface flex flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl px-5 py-4">
          <span className="text-sm font-extrabold">{t("Still short on")}</span>
          {gapKeys.map((k) => {
            const target = settings.targets[k]!
            const have = totals.projected[k] ?? 0
            return (
              <span key={k} className="rounded-full bg-warn-soft px-3 py-1 text-sm font-bold text-warn">
                {t(NUTRIENT_BY_KEY[k].name)} {Math.round((have / target) * 100)}%
              </span>
            )
          })}
          <Link
            href={`/best?want=${gapKeys.join(",")}&day=${day.date}`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "ml-auto" })}
          >
            <Medal aria-hidden />
            {t("Foods that fill these")}
          </Link>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {SLOTS.map((slot) => {
          const items = day.entries.filter((e) => e.slot === slot.value)
          const kcal = items.reduce((sum, e) => sum + (e.nutrients.energy ?? 0), 0)
          return (
            <section key={slot.value} aria-labelledby={`slot-${slot.value}`} className="surface grid content-start gap-1 rounded-3xl p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id={`slot-${slot.value}`} className="text-base font-extrabold">
                  {t(slot.label)}
                </h2>
                <span className="text-sm text-muted-foreground tabular-nums">{formatAmount(kcal)} kcal</span>
              </div>
              {items.length ? (
                <ul className="divide-y divide-border">
                  {items.map((e) => (
                    <EntryRow key={`${e.id}-${e.amount}-${e.status}`} entry={e} flagged={e.allergens.some((a) => settings.allergies.includes(a))} />
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">{t("Nothing here yet.")}</p>
              )}
              <AddEntry date={day.date} slot={slot.value} status={defaultStatus} recipes={recipes} recent={recent} />
            </section>
          )
        })}
      </div>

      <form action={copyDayTo.bind(null, day.date)} className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="copy-to" className="font-bold">
          {t("Copy this day to")}
        </label>
        <input id="copy-to" name="to" type="date" required defaultValue={addDays(day.date, 1)} className="h-9 rounded-full border border-border bg-card px-3 font-semibold" />
        <Button type="submit" variant="outline" size="sm">
          <Copy aria-hidden />
          {t("Copy as planned")}
        </Button>
      </form>
    </div>
  )
}
