"use client"

import { Plus, TriangleAlert } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { Input } from "@/components/ui/input"
import { formatAmount } from "@/lib/format"
import type { FoodGroup } from "@/lib/food/types"

export type FoodHit = {
  id: number
  description: string
  color: string
  group: FoodGroup
  allergens: string[]
  energyKcal: number | null
}

/** Search-as-you-type food picker (combobox). Calls `onPick` with the chosen food. */
export function FoodPicker({
  id,
  label,
  placeholder,
  onPick,
  autoFocus,
}: {
  id: string
  label: string
  placeholder: string
  onPick: (food: FoodHit) => void
  autoFocus?: boolean
}) {
  const listId = useId()
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<FoodHit[]>([])
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function search(q: string) {
    clearTimeout(timer.current)
    if (!q.trim()) {
      setHits([])
      return
    }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) return
      setHits((await res.json()) as FoodHit[])
      setActive(0)
      setOpen(true)
    }, 200)
  }

  function choose(hit: FoodHit) {
    setQuery("")
    setHits([])
    setOpen(false)
    onPick(hit)
  }

  const showList = open && hits.length > 0

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Plus
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          search(e.target.value)
        }}
        onFocus={() => {
          if (hits.length) setOpen(true)
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!showList) return
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setActive((a) => (a + 1) % hits.length)
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setActive((a) => (a - 1 + hits.length) % hits.length)
          } else if (e.key === "Enter") {
            e.preventDefault()
            choose(hits[active])
          } else if (e.key === "Escape") {
            setOpen(false)
          }
        }}
        className="h-11 rounded-full bg-card pl-10"
      />
      {showList ? (
        <ul id={listId} role="listbox" className="surface absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl p-1.5">
          {hits.map((hit, i) => (
            <li
              key={hit.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(hit)
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm ${i === active ? "bg-muted" : ""}`}
            >
              <IngredientSwatch food={{ name: hit.description, color: hit.color, group: hit.group }} className="size-6" />
              <span className="min-w-0 flex-1 font-semibold">{hit.description}</span>
              {hit.allergens.length ? (
                <TriangleAlert className="size-4 text-warn" aria-label={`Contains ${hit.allergens.join(", ")}`} />
              ) : null}
              <span className="text-xs text-muted-foreground tabular-nums">
                {hit.energyKcal === null ? "" : `${formatAmount(hit.energyKcal)} kcal`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
