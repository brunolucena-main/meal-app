"use client"

import { TriangleAlert, X } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { formatAmount } from "@/lib/format"
import type { RecipeItemView } from "@/server/recipes"
import { removeIngredient, setIngredientGrams } from "../actions"

/** One ingredient: grams field (saves on blur or Enter), quick portions, remove. */
export function IngredientRow({
  recipeId,
  item,
  flagged,
}: {
  recipeId: number
  item: RecipeItemView
  flagged: boolean
}) {
  const [grams, setGrams] = useState(String(item.grams))
  const [pending, startTransition] = useTransition()

  function commit(value: number) {
    if (!Number.isFinite(value) || value < 0 || value === item.grams) return
    startTransition(() => setIngredientGrams(recipeId, item.id, value))
  }

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-2.5 first:border-t-0">
      <IngredientSwatch food={{ name: item.name, color: item.color, group: item.group }} className="size-7" />
      <span className="grid min-w-0 gap-1">
        <Link href={`/foods/${item.foodId}`} className="truncate text-sm font-bold hover:underline">
          {item.name}
        </Link>
        <span className="flex flex-wrap items-center gap-2">
          {flagged ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-bold text-warn">
              <TriangleAlert className="size-3" aria-hidden />
              {item.allergens.join(", ")}
            </span>
          ) : null}
          {item.portions.length ? (
            <select
              aria-label={`Set ${item.name} to a portion`}
              value=""
              onChange={(e) => {
                const g = Number(e.target.value)
                if (g > 0) {
                  setGrams(String(g))
                  commit(g)
                }
              }}
              className="h-7 max-w-56 rounded-full border border-border bg-card px-2 text-xs font-semibold text-muted-foreground"
            >
              <option value="">Use a portion…</option>
              {item.portions.map((p) => (
                <option key={p.id} value={p.gramWeight}>
                  {p.label} · {formatAmount(p.gramWeight)} g
                </option>
              ))}
            </select>
          ) : null}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <label className="sr-only" htmlFor={`grams-${item.id}`}>
          Grams of {item.name}
        </label>
        <input
          id={`grams-${item.id}`}
          type="number"
          min={0}
          step="any"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          onBlur={() => commit(Number(grams))}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(Number(grams))
          }}
          className="h-9 w-20 rounded-lg border border-input bg-card px-2 text-right text-sm font-bold tabular-nums"
        />
        <span className="text-xs font-semibold text-muted-foreground">g</span>
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          disabled={pending}
          onClick={() => startTransition(() => removeIngredient(recipeId, item.id))}
          className="ml-1 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </span>
    </li>
  )
}
