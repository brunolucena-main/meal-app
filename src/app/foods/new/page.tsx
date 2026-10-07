import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { toFormValues } from "@/lib/food/custom"
import { flavorOptions } from "@/server/flavor"
import { getT } from "@/server/i18n"
import { saveCustomFood } from "../actions"
import { CustomFoodForm } from "../custom-food-form"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: `${t("New food")} · Meal App` }
}

export default async function NewFoodPage() {
  const [t, options] = await Promise.all([getT(), flavorOptions()])
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <Link href="/foods" className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {t("Foods")}
      </Link>
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("New food")}</h1>
        <p className="text-muted-foreground">
          {t("Add a food that isn't in the USDA list, like the brand of milk you buy. It then works everywhere: search, recipes, your days and comparisons.")}
        </p>
      </header>
      <CustomFoodForm initial={toFormValues()} submitLabel={t("Save food")} action={saveCustomFood.bind(null, null)} flavorOptions={options} />
    </div>
  )
}
