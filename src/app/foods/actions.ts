"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { isCustomFoodId, parseCustomFoodForm } from "@/lib/food/custom"
import { NUTRIENTS } from "@/lib/nutrition/nutrients"
import { createCustomFood, deleteCustomFood, updateCustomFood } from "@/server/custom-foods"

function readForm(form: FormData) {
  const str = (key: string) => String(form.get(key) ?? "")
  const labels = form.getAll("portionLabel").map(String)
  const grams = form.getAll("portionGrams").map(String)
  return {
    name: str("name"),
    brand: str("brand"),
    category: str("category"),
    basisGrams: str("basisGrams"),
    nutrients: Object.fromEntries(NUTRIENTS.map((n) => [n.key, str(`n.${n.key}`)])),
    salt: str("salt"),
    portions: labels.map((label, i) => ({ label, grams: grams[i] ?? "" })),
    allergens: form.getAll("allergen").map(String),
    flavorId: str("flavorId"),
  }
}

/** Creates (id null) or updates a custom food, then opens its page. Returns an error key when the form is wrong. */
export async function saveCustomFood(id: number | null, form: FormData): Promise<{ error?: string }> {
  if (id !== null && !isCustomFoodId(id)) return { error: "Only your own foods can be edited." }
  const parsed = parseCustomFoodForm(readForm(form))
  if (!parsed.ok) return { error: parsed.error }
  let foodId = id
  if (foodId === null) foodId = await createCustomFood(parsed.food)
  else await updateCustomFood(foodId, parsed.food)
  // Recipes, days and lists all show the food's values.
  revalidatePath("/", "layout")
  redirect(`/foods/${foodId}`)
}

export async function removeCustomFood(id: number) {
  if (!isCustomFoodId(id)) return
  const result = await deleteCustomFood(id)
  if (!result.ok) redirect(`/foods/${id}/edit?inUse=${result.usedBy}`)
  revalidatePath("/", "layout")
  redirect("/foods")
}
