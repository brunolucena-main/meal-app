"use client"

import { useTransition } from "react"

import { FoodPicker } from "@/components/food/food-picker"
import { addIngredient } from "../actions"
import { useT } from "@/components/i18n-provider"

export function AddIngredient({ recipeId }: { recipeId: number }) {
  const t = useT()
  const [pending, startTransition] = useTransition()
  return (
    <div className="grid gap-1">
      <FoodPicker
        id="add-ingredient"
        label={t("Add an ingredient")}
        placeholder={t("Add an ingredient, e.g. oats")}
        onPick={(hit) => startTransition(() => addIngredient(recipeId, hit.id))}
      />
      {pending ? <span className="text-xs font-semibold text-muted-foreground">{t("Adding…")}</span> : null}
    </div>
  )
}
