"use client"

import { Check, TriangleAlert, X } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

import { removeEntry, setEntryAmount, setEntryStatus } from "@/app/day-actions"
import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { formatAmount } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { EntryView } from "@/server/days"

/** One planned or eaten item: tick to log it, edit the amount, or remove it. */
export function EntryRow({ entry, flagged }: { entry: EntryView; flagged: boolean }) {
  const [amount, setAmount] = useState(String(entry.amount))
  const [pending, startTransition] = useTransition()
  const eaten = entry.status === "eaten"
  const unit = entry.kind === "food" ? "g" : entry.amount === 1 ? "serving" : "servings"

  function commit() {
    const value = Number(amount)
    if (value > 0 && value !== entry.amount) startTransition(() => setEntryAmount(entry.id, entry.kind, value))
  }

  return (
    <li className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2", pending && "opacity-60")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={eaten}
        aria-label={eaten ? `Mark ${entry.name} as not eaten` : `Mark ${entry.name} as eaten`}
        onClick={() => startTransition(() => setEntryStatus(entry.id, eaten ? "planned" : "eaten"))}
        className={cn(
          "grid size-7 place-items-center rounded-full border-2 transition-colors",
          eaten ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary"
        )}
      >
        {eaten ? <Check className="size-4" aria-hidden /> : null}
      </button>
      <span className="grid min-w-0 gap-0.5">
        <Link
          href={entry.kind === "food" ? `/foods/${entry.refId}` : `/recipes/${entry.refId}`}
          className={cn("flex min-w-0 items-center gap-2 text-sm font-bold hover:underline", !eaten && "text-muted-foreground")}
        >
          <IngredientSwatch food={{ name: entry.name, color: entry.color, group: entry.group }} className="size-5" />
          <span className="truncate" title={entry.name}>
            {entry.name}
          </span>
        </Link>
        <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
          {formatAmount(entry.nutrients.energy ?? 0)} kcal · {formatAmount(entry.nutrients.protein ?? 0)} g protein
          {eaten ? "" : " · planned"}
          {flagged ? (
            <span className="inline-flex items-center gap-1 font-bold text-warn">
              <TriangleAlert className="size-3" aria-hidden />
              {entry.allergens.join(", ")}
            </span>
          ) : null}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <label htmlFor={`amount-${entry.id}`} className="sr-only">
          Amount of {entry.name} in {unit}
        </label>
        <input
          id={`amount-${entry.id}`}
          type="number"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
          }}
          className="h-8 w-[4.5rem] rounded-lg border border-input bg-card px-2 text-right text-sm font-bold tabular-nums"
        />
        <span className="w-14 text-xs font-semibold text-muted-foreground">{unit}</span>
        <button
          type="button"
          aria-label={`Remove ${entry.name}`}
          onClick={() => startTransition(() => removeEntry(entry.id))}
          className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </span>
    </li>
  )
}
