"use client"

import { useState, useTransition } from "react"

import { addFoodEntry, addRecipeEntry } from "@/app/day-actions"
import { FoodPicker } from "@/components/food/food-picker"
import { Button } from "@/components/ui/button"
import type { EntryStatus, Slot } from "@/lib/nutrition/day"

/** Add a food (100 g to start, adjust in the row) or a saved meal/recipe to a slot. */
export function AddEntry({
  date,
  slot,
  status,
  recipes,
}: {
  date: string
  slot: Slot
  status: EntryStatus
  recipes: { id: number; name: string; kind: "recipe" | "meal" }[]
}) {
  const [pending, startTransition] = useTransition()
  const [recipeId, setRecipeId] = useState("")
  const [servings, setServings] = useState("1")

  return (
    <div className="grid gap-2 pt-1">
      <FoodPicker
        id={`add-${date}-${slot}`}
        label={`Add a food to ${slot}`}
        placeholder="Add a food"
        onPick={(hit) => startTransition(() => addFoodEntry(date, slot, status, hit.id, 100))}
      />
      {recipes.length ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const id = Number(recipeId)
            if (id) startTransition(() => addRecipeEntry(date, slot, status, id, Number(servings) || 1))
          }}
        >
          <label htmlFor={`recipe-${date}-${slot}`} className="sr-only">
            Add a saved meal or recipe
          </label>
          <select
            id={`recipe-${date}-${slot}`}
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-full border border-border bg-card px-3 text-sm font-semibold"
          >
            <option value="">Or add a saved meal or recipe…</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.kind === "meal" ? "Meal: " : "Recipe: "}
                {r.name}
              </option>
            ))}
          </select>
          <label htmlFor={`servings-${date}-${slot}`} className="sr-only">
            Servings
          </label>
          <input
            id={`servings-${date}-${slot}`}
            type="number"
            min={0.25}
            step="0.25"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="h-9 w-16 rounded-full border border-border bg-card px-3 text-right text-sm font-semibold"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={!recipeId}>
            Add
          </Button>
        </form>
      ) : null}
      {pending ? <span className="text-xs font-semibold text-muted-foreground">Saving…</span> : null}
    </div>
  )
}
