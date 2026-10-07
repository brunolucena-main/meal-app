"use client"

import { Check, Plus } from "lucide-react"
import { useState, useTransition } from "react"

import { addSuggestion } from "@/app/cooking-actions"
import { useT } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"

/** Round "+" that adds a food to a recipe; a check once it's in. */
export function AddButton({
  recipeId,
  recipeName,
  foodId,
  name,
  added = false,
  className,
}: {
  recipeId: number
  recipeName: string
  foodId: number
  name: string
  added?: boolean
  className?: string
}) {
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(added)
  if (done) {
    return (
      <span
        title={t("{name} is in {recipe}", { name, recipe: recipeName })}
        className={cn("grid size-7 shrink-0 place-items-center rounded-full bg-violet-soft text-violet", className)}
      >
        <Check className="size-4" aria-hidden />
        <span className="sr-only">{t("{name} is in {recipe}", { name, recipe: recipeName })}</span>
      </span>
    )
  }
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t("Add {name} to {recipe}", { name, recipe: recipeName })}
      title={t("Add {name} to {recipe}", { name, recipe: recipeName })}
      onClick={() =>
        startTransition(async () => {
          await addSuggestion(recipeId, foodId)
          setDone(true)
        })
      }
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full bg-violet text-white transition-opacity hover:opacity-85 disabled:opacity-50",
        className
      )}
    >
      <Plus className="size-4" aria-hidden />
    </button>
  )
}
