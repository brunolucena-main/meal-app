"use client"

import { Search } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { IngredientChip } from "@/components/food/ingredient-chip"
import { Input } from "@/components/ui/input"
import type { FoodGroup } from "@/lib/food/types"

type Item = { id: number; name: string; color: string; group: FoodGroup; allergens: string[] }

const SUGGESTED = ["Spinach", "Tomato", "Lemon", "Salmon", "Dark chocolate", "Basil", "Mushroom", "Chickpea", "Strawberry", "Ginger"]

/** Filter-as-you-type over the curated ingredients; each result opens its pairings. */
export function IngredientFinder({ items, basePath, param }: { items: Item[]; basePath: string; param: string }) {
  const [query, setQuery] = useState("")
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.filter((i) => SUGGESTED.includes(i.name))
    const starts = items.filter((i) => i.name.toLowerCase().startsWith(q))
    const contains = items.filter((i) => !i.name.toLowerCase().startsWith(q) && i.name.toLowerCase().includes(q))
    return [...starts, ...contains].slice(0, 30)
  }, [items, query])

  return (
    <div className="grid gap-3">
      <div className="relative max-w-md">
        <label htmlFor={`find-${param}`} className="sr-only">
          Find an ingredient
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id={`find-${param}`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Find one of ${items.length} ingredients`}
          className="h-11 rounded-full bg-card pl-10 text-foreground"
        />
      </div>
      <ul className="flex flex-wrap gap-2" aria-live="polite">
        {shown.map((i) => (
          <li key={i.id}>
            <Link href={`${basePath}${basePath.includes("?") ? "&" : "?"}${param}=${i.id}`} className="block rounded-full focus-visible:outline-2 focus-visible:outline-ring">
              <IngredientChip
                food={{ name: i.name, color: i.color, group: i.group, allergen: i.allergens[0] }}
                className="text-foreground transition-transform hover:-translate-y-0.5"
              />
            </Link>
          </li>
        ))}
        {query && shown.length === 0 ? <li className="text-sm text-on-night-muted">No ingredient matches &ldquo;{query}&rdquo;.</li> : null}
      </ul>
    </div>
  )
}
