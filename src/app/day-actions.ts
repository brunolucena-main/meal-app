"use server"

import { revalidatePath } from "next/cache"

import { parseIsoDate, type EntryStatus, type Slot } from "@/lib/nutrition/day"
import { addEntry, copyDay, deleteEntry, setShoppingCheck, updateEntry } from "@/server/days"

const SLOTS: Slot[] = ["breakfast", "lunch", "dinner", "snack"]

function valid(date: string, slot: Slot) {
  return parseIsoDate(date) !== null && SLOTS.includes(slot)
}

function refresh() {
  revalidatePath("/", "layout")
}

export async function addFoodEntry(date: string, slot: Slot, status: EntryStatus, foodId: number, grams: number) {
  if (!valid(date, slot) || !(grams > 0)) return
  await addEntry({ date, slot, status, food: { id: foodId, grams: Math.min(grams, 5000) } })
  refresh()
}

export async function addRecipeEntry(date: string, slot: Slot, status: EntryStatus, recipeId: number, servings: number) {
  if (!valid(date, slot) || !(servings > 0)) return
  await addEntry({ date, slot, status, recipe: { id: recipeId, servings: Math.min(servings, 50) } })
  refresh()
}

export async function setEntryStatus(id: number, status: EntryStatus) {
  await updateEntry(id, { status })
  refresh()
}

export async function setEntryAmount(id: number, kind: "food" | "recipe", amount: number) {
  if (!(amount > 0)) return
  await updateEntry(id, kind === "food" ? { grams: Math.min(amount, 5000) } : { servings: Math.min(amount, 50) })
  refresh()
}

export async function removeEntry(id: number) {
  await deleteEntry(id)
  refresh()
}

export async function copyDayTo(from: string, form: FormData) {
  const to = String(form.get("to") ?? "")
  if (!parseIsoDate(from) || !parseIsoDate(to) || from === to) return
  await copyDay(from, to)
  refresh()
}

export async function toggleShoppingItem(week: string, foodId: number, checked: boolean) {
  if (!parseIsoDate(week)) return
  await setShoppingCheck(week, foodId, checked)
  refresh()
}
