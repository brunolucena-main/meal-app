"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { COOKING_COOKIE } from "@/server/cooking"
import { addRecipeItem } from "@/server/recipes"

/** Adds a food suggested by the flavor guide or a flavor page (100 g, like any new ingredient). */
export async function addSuggestion(recipeId: number, foodId: number) {
  await addRecipeItem(recipeId, foodId, 100)
  revalidatePath("/", "layout")
}

/** Leaves "adding to a recipe" mode on the flavor pages. */
export async function stopCooking() {
  ;(await cookies()).delete(COOKING_COOKIE)
  revalidatePath("/", "layout")
}
