"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { importData } from "@/server/backup"

export async function restoreBackup(form: FormData) {
  const file = form.get("file")
  if (form.get("confirm") !== "yes") redirect("/data?error=confirm")
  if (!(file instanceof File) || file.size === 0) redirect("/data?error=file")
  let message = ""
  try {
    await importData(JSON.parse(await file.text()))
  } catch (error) {
    message = error instanceof SyntaxError ? "That file isn't valid JSON." : (error as Error).message
  }
  if (message) redirect(`/data?error=${encodeURIComponent(message)}`)
  revalidatePath("/", "layout")
  redirect("/data?restored=1")
}
