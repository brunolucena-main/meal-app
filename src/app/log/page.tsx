import type { Metadata } from "next"
import Link from "next/link"

import { formatDayTitle } from "@/components/day/day-view"
import { formatAmount } from "@/lib/format"
import { isoDate } from "@/lib/nutrition/day"
import { getDay, loggedDates } from "@/server/days"
import { getSettings } from "@/server/settings"

export const metadata: Metadata = { title: "Log · Meal App" }

export default async function LogPage() {
  const settings = await getSettings()
  const today = isoDate(new Date())
  const dates = await loggedDates(30)
  const days = await Promise.all(dates.map((d) => getDay(d)))
  const energy = settings.targets.energy ?? 0
  const protein = settings.targets.protein ?? 0

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Log</h1>
        <p className="text-muted-foreground">Days you logged food on, most recent first. Open one to see or edit it.</p>
      </header>
      {days.length === 0 ? (
        <section className="surface grid gap-2 rounded-3xl p-6">
          <h2 className="text-lg font-extrabold">Nothing logged yet</h2>
          <p className="text-muted-foreground">
            Add what you eat on the{" "}
            <Link href="/" className="font-bold text-primary hover:underline">
              Today
            </Link>{" "}
            screen, or tick planned items as eaten.
          </p>
        </section>
      ) : (
        <ul className="surface divide-y divide-border overflow-hidden rounded-3xl">
          {days.map((d) => {
            const kcal = d.totals.eaten.energy ?? 0
            const prot = d.totals.eaten.protein ?? 0
            return (
              <li key={d.date}>
                <Link href={d.date === today ? "/" : `/log/${d.date}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 hover:bg-muted">
                  <span className="grid gap-0.5">
                    <span className="font-bold">{formatDayTitle(d.date, today)}</span>
                    <span className="text-xs text-muted-foreground">{d.entries.filter((e) => e.status === "eaten").length} items</span>
                  </span>
                  <span className="grid justify-items-end text-sm tabular-nums">
                    <span className="font-extrabold">
                      {formatAmount(kcal)} <span className="text-xs font-semibold text-muted-foreground">/ {formatAmount(energy)} kcal</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatAmount(prot)} / {formatAmount(protein)} g protein
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
