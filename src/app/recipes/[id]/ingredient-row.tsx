"use client"

import { Replace, TriangleAlert, X } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

import { FoodPicker } from "@/components/food/food-picker"
import { IngredientChip, IngredientSwatch } from "@/components/food/ingredient-chip"
import { formatAmount } from "@/lib/format"
import type { GuideChip } from "@/server/flavor-guide"
import type { RecipeItemView } from "@/server/recipes"
import { removeIngredient, replaceIngredient, setIngredientGrams } from "../actions"
import { useT } from "@/components/i18n-provider"

/** One ingredient: grams field (saves on blur or Enter), quick portions, remove. */
export function IngredientRow({
  recipeId,
  item,
  flagged,
  swapIdeas,
}: {
  recipeId: number
  item: RecipeItemView
  flagged: boolean
  /** Flavor guide stand-ins: used with the same partners in recipes. */
  swapIdeas: GuideChip[]
}) {
  const t = useT()
  const [grams, setGrams] = useState(String(item.grams))
  const [replacing, setReplacing] = useState(false)
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
              {item.allergens.map((a) => t(a)).join(", ")}
            </span>
          ) : null}
          {item.portions.length ? (
            <select
              aria-label={t("Set {name} to a portion", { name: item.name })}
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
              <option value="">{t("Use a portion…")}</option>
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
          {t("Grams of {name}", { name: item.name })}
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
          aria-label={t("Replace {name}", { name: item.name })}
          aria-expanded={replacing}
          title={t("Replace, keeping the amount")}
          onClick={() => setReplacing(!replacing)}
          className={`ml-1 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground ${replacing ? "bg-muted text-foreground" : ""}`}
        >
          <Replace className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={t("Remove {name}", { name: item.name })}
          disabled={pending}
          onClick={() => startTransition(() => removeIngredient(recipeId, item.id))}
          className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </span>
      {replacing ? (
        <div className="col-span-3 grid gap-2 pl-10">
          {swapIdeas.length ? (
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground">{t("Swap ideas")}</span>
              {swapIdeas.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setReplacing(false)
                    startTransition(() => replaceIngredient(recipeId, item.id, s.foodId))
                  }}
                  className="rounded-full focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <IngredientChip food={s} size="sm" className="hover:bg-muted" />
                </button>
              ))}
            </span>
          ) : null}
          <FoodPicker
            id={`replace-${item.id}`}
            label={t("Replace {name} with", { name: item.name })}
            placeholder={t("Replace with, e.g. raspberries")}
            autoFocus
            onPick={(hit) => {
              setReplacing(false)
              startTransition(() => replaceIngredient(recipeId, item.id, hit.id))
            }}
          />
          <span className="text-xs text-muted-foreground">{t("Keeps {n} g and the ingredient's place in the list.", { n: formatAmount(item.grams) })}</span>
        </div>
      ) : null}
    </li>
  )
}
