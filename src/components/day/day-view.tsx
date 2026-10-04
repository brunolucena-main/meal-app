import { ChevronLeft, ChevronRight, Copy, Medal } from "lucide-react"
import Link from "next/link"

import { copyDayTo } from "@/app/day-actions"
import { AddEntry } from "@/components/day/add-entry"
import { EntryRow } from "@/components/day/entry-row"
import { statusForGoal, statusForLimit, TargetBar } from "@/components/nutrition/target-bar"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatAmount } from "@/lib/format"
import { addDays, largestGaps, parseIsoDate, SLOTS, type EntryStatus } from "@/lib/nutrition/day"
import { NUTRIENT_BY_KEY, type NutrientKey } from "@/lib/nutrition/nutrients"
import type { DayView as Day } from "@/server/days"
import type { Settings } from "@/server/settings"

const BARS: NutrientKey[] = ["protein", "fiber", "carbs", "fat"]
const LIMITS: NutrientKey[] = ["sodium", "satFat"]

export function formatDayTitle(iso: string, today: string) {
  if (iso === today) return "Today"
  if (iso === addDays(today, -1)) return "Yesterday"
  if (iso === addDays(today, 1)) return "Tomorrow"
  return parseIsoDate(iso)!.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
}

/**
 * One day: energy summary, target bars, the biggest gaps, then the meal slots with their
 * entries. `defaultStatus` decides whether new entries are logged as eaten or planned.
 */
export function DayView({
  day,
  today,
  settings,
  recipes,
  defaultStatus,
  hrefFor,
}: {
  day: Day
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
  const title = formatDayTitle(day.date, today)

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
            {parseIsoDate(day.date)!.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        </div>
        <nav aria-label="Change day" className="flex items-center gap-1">
          <Link href={hrefFor(addDays(day.date, -1))} aria-label="Previous day" className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ChevronLeft aria-hidden />
          </Link>
          {day.date !== today ? (
            <Link href={hrefFor(today)} className={buttonVariants({ variant: "outline" })}>
              Today
            </Link>
          ) : null}
          <Link href={hrefFor(addDays(day.date, 1))} aria-label="Next day" className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ChevronRight aria-hidden />
          </Link>
        </nav>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section aria-label="Energy" className="grid content-start gap-3 rounded-3xl bg-tint-1 p-5 md:p-6">
          <span className="text-xs font-bold tracking-[0.12em] text-accent-foreground uppercase">Energy</span>
          <span className="text-[40px] leading-none font-extrabold tabular-nums">
            {formatAmount(eatenKcal)}{" "}
            <span className="text-base font-semibold text-muted-foreground">of {formatAmount(energyTarget)} kcal eaten</span>
          </span>
          <div
            role="meter"
            aria-label="Energy eaten"
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
              ? `${formatAmount(energyTarget - eatenKcal - plannedKcal)} kcal free`
              : `${formatAmount(eatenKcal + plannedKcal - energyTarget)} kcal over`}
            <span className="font-medium text-muted-foreground">
              {plannedKcal > 0 ? ` · ${formatAmount(plannedKcal)} kcal still planned` : " · nothing else planned"}
            </span>
          </p>
        </section>

        <section aria-label="Targets" className="surface grid gap-5 rounded-3xl p-5 sm:grid-cols-2 md:p-6">
          {[...BARS, ...LIMITS].map((key) => {
            const n = NUTRIENT_BY_KEY[key]
            const target = settings.targets[key] ?? 0
            const value = totals.eaten[key] ?? 0
            return (
              <TargetBar
                key={key}
                label={`${n.name}${partial.has(key) && value > 0 ? " (at least)" : ""}`}
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
        <section aria-label="Biggest gaps" className="surface flex flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl px-5 py-4">
          <span className="text-sm font-extrabold">Still short on</span>
          {gapKeys.map((k) => {
            const target = settings.targets[k]!
            const have = totals.projected[k] ?? 0
            return (
              <span key={k} className="rounded-full bg-warn-soft px-3 py-1 text-sm font-bold text-warn">
                {NUTRIENT_BY_KEY[k].name} {Math.round((have / target) * 100)}%
              </span>
            )
          })}
          <Link
            href={`/best?want=${gapKeys.join(",")}&day=${day.date}`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "ml-auto" })}
          >
            <Medal aria-hidden />
            Foods that fill these
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
                  {slot.label}
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
                <p className="py-2 text-sm text-muted-foreground">Nothing here yet.</p>
              )}
              <AddEntry date={day.date} slot={slot.value} status={defaultStatus} recipes={recipes} />
            </section>
          )
        })}
      </div>

      <form action={copyDayTo.bind(null, day.date)} className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="copy-to" className="font-bold">
          Copy this day to
        </label>
        <input id="copy-to" name="to" type="date" required defaultValue={addDays(day.date, 1)} className="h-9 rounded-full border border-border bg-card px-3 font-semibold" />
        <Button type="submit" variant="outline" size="sm">
          <Copy aria-hidden />
          Copy as planned
        </Button>
      </form>
    </div>
  )
}
