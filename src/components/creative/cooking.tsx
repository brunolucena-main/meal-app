import { ChefHat } from "lucide-react"
import Link from "next/link"

import { stopCooking } from "@/app/cooking-actions"
import { AddButton } from "@/components/creative/add-button"
import { getCooking } from "@/server/cooking"
import { getT } from "@/server/i18n"

/** On the flavor pages: which recipe the add buttons add to, with a way back and a way out. */
export async function CookingBar() {
  const cooking = await getCooking()
  if (!cooking) return null
  const t = await getT()
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-self-start rounded-3xl bg-white/12 px-4 py-2.5 text-sm text-on-night">
      <ChefHat className="size-4 shrink-0" aria-hidden />
      <span>
        {t("Adding to")} <span className="font-extrabold">{cooking.name}</span>
      </span>
      <Link href={`/recipes/${cooking.id}`} className="font-bold underline-offset-4 hover:underline">
        {t("Back to the recipe")}
      </Link>
      <form action={stopCooking}>
        <button type="submit" className="font-bold text-on-night-muted underline-offset-4 hover:text-on-night hover:underline">
          {t("Done")}
        </button>
      </form>
    </div>
  )
}

/** "+" for a flavor ingredient with a USDA match, shown only while adding to a recipe. */
export async function AddToCooking({ foodId, name }: { foodId: number | null; name: string }) {
  if (foodId === null) return null
  const cooking = await getCooking()
  if (!cooking) return null
  return <AddButton recipeId={cooking.id} recipeName={cooking.name} foodId={foodId} name={name} added={cooking.foodIds.has(foodId)} />
}
