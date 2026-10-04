"use client"

import { useRouter } from "next/navigation"

import { FoodPicker } from "@/components/food/food-picker"
import { compareHref, type CompareState } from "./url"
import { useT } from "@/components/i18n-provider"

/** Adds a food to the comparison. */
export function AddFood({ state }: { state: CompareState }) {
  const t = useT()
  const router = useRouter()
  return (
    <FoodPicker
      id="add-food"
      label={t("Add a food to compare")}
      placeholder={t("Add a food, e.g. kale")}
      onPick={(hit) => {
        if (!state.ids.includes(hit.id)) {
          router.push(compareHref({ ...state, ids: [...state.ids, hit.id] }), { scroll: false })
        }
      }}
    />
  )
}
