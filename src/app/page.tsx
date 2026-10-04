import { DayView } from "@/components/day/day-view"
import { isoDate } from "@/lib/nutrition/day"
import { getDay } from "@/server/days"
import { listRecipes } from "@/server/recipes"
import { getSettings } from "@/server/settings"

export default async function TodayPage() {
  const settings = await getSettings()
  const today = isoDate(new Date())
  const [day, recipes] = await Promise.all([getDay(today), listRecipes()])
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10 md:py-12">
      <DayView
        day={day}
        today={today}
        settings={settings}
        recipes={recipes.map(({ id, name, kind }) => ({ id, name, kind }))}
        defaultStatus="eaten"
        hrefFor={(iso) => (iso === today ? "/" : `/log/${iso}`)}
      />
    </div>
  )
}
