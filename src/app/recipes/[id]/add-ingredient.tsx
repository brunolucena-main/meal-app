"use client"

import { useTransition } from "react"

import { FoodPicker } from "@/components/food/food-picker"
import { addIngredient } from "../actions"

export function AddIngredient({ recipeId }: { recipeId: number }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="grid gap-1">
      <FoodPicker
        id="add-ingredient"
        label="Add an ingredient"
        placeholder="Add an ingredient, e.g. oats"
        onPick={(hit) => startTransition(() => addIngredient(recipeId, hit.id))}
      />
      {pending ? <span className="text-xs font-semibold text-muted-foreground">Adding…</span> : null}
    </div>
  )
}
