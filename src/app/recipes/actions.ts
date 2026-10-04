"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  addRecipeItem,
  createRecipe,
  deleteRecipe,
  removeRecipeItem,
  updateRecipe,
  updateRecipeItem,
  type RecipeKind,
} from "@/server/recipes"

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export async function newRecipe(kind: RecipeKind) {
  const id = await createRecipe(kind)
  redirect(`/recipes/${id}`)
}

export async function saveRecipeDetails(id: number, form: FormData) {
  const servings = Number(form.get("servings"))
  const cooked = String(form.get("cookedGrams") ?? "").trim()
  await updateRecipe(id, {
    name: String(form.get("name") ?? "").trim().slice(0, 120) || "Untitled",
    kind: form.get("kind") === "meal" ? "meal" : "recipe",
    servings: Number.isFinite(servings) && servings > 0 ? clamp(servings, 0.25, 100) : 1,
    cookedGrams: cooked && Number(cooked) > 0 ? Number(cooked) : null,
    notes: String(form.get("notes") ?? "").trim().slice(0, 4000) || null,
  })
  revalidatePath("/recipes", "layout")
}

export async function addIngredient(recipeId: number, foodId: number) {
  // Start at 100 g; the row's portion picker or grams field adjusts it.
  await addRecipeItem(recipeId, foodId, 100)
  revalidatePath(`/recipes/${recipeId}`)
}

export async function setIngredientGrams(recipeId: number, itemId: number, grams: number) {
  if (!Number.isFinite(grams) || grams < 0) return
  await updateRecipeItem(itemId, clamp(grams, 0, 10000))
  revalidatePath(`/recipes/${recipeId}`)
}

export async function removeIngredient(recipeId: number, itemId: number) {
  await removeRecipeItem(itemId)
  revalidatePath(`/recipes/${recipeId}`)
}

export async function removeRecipe(id: number) {
  const result = await deleteRecipe(id)
  if (!result.ok) redirect(`/recipes/${id}?inUse=${result.usedBy}`)
  revalidatePath("/recipes", "layout")
  redirect("/recipes")
}
