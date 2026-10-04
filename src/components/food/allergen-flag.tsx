"use client"

import { TriangleAlert } from "lucide-react"

import { useT } from "@/components/i18n-provider"

/** Inline allergen warning for chips. A client component so it works in server and client trees. */
export function AllergenFlag({ name, allergen }: { name: string; allergen: string }) {
  const t = useT()
  // "Hazelnut ⚠ allergen" reads better than repeating the name.
  const repeats = name.toLowerCase().includes(allergen.toLowerCase())
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-warn">
      <TriangleAlert className="size-3.5" aria-hidden />
      {repeats ? t("allergen") : t(allergen)}
    </span>
  )
}
