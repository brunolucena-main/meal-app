"use client"

import { useState, useTransition } from "react"

import { addFoodEntry, addRecipeEntry } from "@/app/day-actions"
import { FoodPicker } from "@/components/food/food-picker"
import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { formatAmount } from "@/lib/format"
import type { EntryStatus, Slot } from "@/lib/nutrition/day"
import type { RecentItem } from "@/server/days"

/**
 * Add to a slot: one tap on a recent item (at its last amount), a food from search (100 g to
 * start, adjust in the row), or a saved meal or recipe.
 */
export function AddEntry({
  date,
  slot,
  status,
  recipes,
  recent = [],
}: {
  date: string
  slot: Slot
  status: EntryStatus
  recipes: { id: number; name: string; kind: "recipe" | "meal" }[]
  recent?: RecentItem[]
}) {
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [recipeId, setRecipeId] = useState("")
  const [servings, setServings] = useState("1")

  return (
    <div className="grid gap-2 pt-1">
      {recent.length ? (
        <div className="flex flex-wrap items-center gap-1.5" aria-label={t("Recent")}>
          <span className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">{t("Recent")}</span>
          {recent.map((r) => (
            <button
              key={`${r.kind}-${r.refId}`}
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  r.kind === "food"
                    ? addFoodEntry(date, slot, status, r.refId, r.amount)
                    : addRecipeEntry(date, slot, status, r.refId, r.amount)
                )
              }
              title={t("Add {name}", { name: r.name })}
              className="inline-flex max-w-48 items-center gap-1.5 rounded-full border border-border bg-card py-0.5 pr-2.5 pl-0.5 text-xs font-semibold hover:bg-muted"
            >
              <IngredientSwatch food={{ name: r.name, color: r.color, group: r.group }} className="size-[18px]" />
              <span className="truncate">{r.name.split(",")[0]}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {r.kind === "food" ? `${formatAmount(r.amount)} g` : `×${formatAmount(r.amount)}`}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <FoodPicker
        id={`add-${date}-${slot}`}
        label={t("Add a food")}
        placeholder={t("Add a food")}
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
            {t("Add a saved meal or recipe")}
          </label>
          <select
            id={`recipe-${date}-${slot}`}
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-full border border-border bg-card px-3 text-sm font-semibold"
          >
            <option value="">{t("Or add a saved meal or recipe…")}</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.kind === "meal" ? t("Meal:") : t("Recipe:")}{" "}
                {r.name}
              </option>
            ))}
          </select>
          <label htmlFor={`servings-${date}-${slot}`} className="sr-only">
            {t("Servings")}
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
            {t("Add")}
          </Button>
        </form>
      ) : null}
      {pending ? <span className="text-xs font-semibold text-muted-foreground">{t("Saving…")}</span> : null}
    </div>
  )
}
