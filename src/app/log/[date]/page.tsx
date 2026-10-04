import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DayView, formatDayTitle } from "@/components/day/day-view"
import { isoDate, parseIsoDate } from "@/lib/nutrition/day"
import { getDay, recentItems } from "@/server/days"
import { listRecipes } from "@/server/recipes"
import { getSettings } from "@/server/settings"

export async function generateMetadata(props: PageProps<"/log/[date]">): Promise<Metadata> {
  const { date } = await props.params
  return { title: parseIsoDate(date) ? `${formatDayTitle(date, isoDate(new Date()))} · Meal App` : "Log · Meal App" }
}

export default async function DayPage(props: PageProps<"/log/[date]">) {
  const { date } = await props.params
  if (!parseIsoDate(date)) notFound()
  const settings = await getSettings()
  const today = isoDate(new Date())
  const [day, recipes, recent] = await Promise.all([getDay(date), listRecipes(), recentItems(6)])
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10 md:py-12">
      <DayView
        day={day}
        today={today}
        settings={settings}
        recipes={recipes.map(({ id, name, kind }) => ({ id, name, kind }))}
        recent={recent}
        // Future days are plans; today and past days are logs.
        defaultStatus={date > today ? "planned" : "eaten"}
        hrefFor={(iso) => (iso === today ? "/" : `/log/${iso}`)}
      />
    </div>
  )
}
