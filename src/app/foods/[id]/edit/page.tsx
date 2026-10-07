import { ArrowLeft, Trash2 } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { customFoodDescription, isCustomFoodId, toFormValues } from "@/lib/food/custom"
import { getCustomFoodRow } from "@/server/custom-foods"
import { getT } from "@/server/i18n"
import { removeCustomFood, saveCustomFood } from "../../actions"
import { CustomFoodForm } from "../../custom-food-form"

async function load(props: PageProps<"/foods/[id]/edit">) {
  const { id } = await props.params
  const n = Number(id)
  const row = Number.isInteger(n) && isCustomFoodId(n) ? await getCustomFoodRow(n) : null
  if (!row) notFound()
  return row
}

export async function generateMetadata(props: PageProps<"/foods/[id]/edit">): Promise<Metadata> {
  const row = await load(props)
  return { title: `${customFoodDescription(row.name, row.brand)} · Meal App` }
}

export default async function EditFoodPage(props: PageProps<"/foods/[id]/edit">) {
  const t = await getT()
  const [row, search] = await Promise.all([load(props), props.searchParams])
  const inUse = Number(Array.isArray(search.inUse) ? search.inUse[0] : search.inUse) || 0

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <Link href={`/foods/${row.id}`} className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {customFoodDescription(row.name, row.brand)}
      </Link>
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("Edit food")}</h1>
        <p className="text-muted-foreground">{t("Values are shown per 100 g. Changes apply everywhere the food is used, including past days.")}</p>
      </header>
      <CustomFoodForm initial={toFormValues(row)} submitLabel={t("Save changes")} action={saveCustomFood.bind(null, row.id)} />

      {inUse > 0 ? (
        <p role="alert" className="rounded-2xl bg-warn-soft px-4 py-3 text-sm font-bold text-warn">
          {t("Used in {n} recipes, planned or logged items. Remove it from those first, so your log stays accurate.", { n: inUse })}
        </p>
      ) : null}
      <form action={removeCustomFood.bind(null, row.id)}>
        <Button type="submit" variant="destructive">
          <Trash2 aria-hidden />
          {t("Delete food")}
        </Button>
      </form>
    </div>
  )
}
