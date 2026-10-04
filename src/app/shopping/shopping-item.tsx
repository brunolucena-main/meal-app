"use client"

import { Check } from "lucide-react"
import { useOptimistic, useTransition } from "react"

import { toggleShoppingItem } from "@/app/day-actions"
import { cn } from "@/lib/utils"

/** Tick box for one shopping list line; flips at once, then saves. */
export function ShoppingCheck({ week, foodId, checked, label }: { week: string; foodId: number; checked: boolean; label: string }) {
  const [optimistic, setOptimistic] = useOptimistic(checked)
  const [, startTransition] = useTransition()
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={optimistic}
      aria-label={label}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic)
          await toggleShoppingItem(week, foodId, !optimistic)
        })
      }
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
        optimistic ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary"
      )}
    >
      {optimistic ? <Check className="size-3.5" aria-hidden /> : null}
    </button>
  )
}
