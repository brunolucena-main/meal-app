"use client"

import { useRouter } from "next/navigation"

import { formatAmount } from "@/lib/format"
import { compareHref, type CompareState } from "./url"

/** Picks which USDA portion counts as "one serving" for a food. */
export function PortionSelect({
  state,
  foodId,
  portions,
  selected,
}: {
  state: CompareState
  foodId: number
  portions: { id: number; label: string; gramWeight: number }[]
  selected: number
}) {
  const router = useRouter()
  return (
    <select
      aria-label="Serving"
      value={selected}
      onChange={(e) =>
        router.push(compareHref({ ...state, portions: { ...state.portions, [foodId]: Number(e.target.value) } }), {
          scroll: false,
        })
      }
      className="h-8 max-w-full rounded-full border border-border bg-card px-3 text-xs font-semibold"
    >
      {portions.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label} · {formatAmount(p.gramWeight)} g
        </option>
      ))}
    </select>
  )
}
