"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { LOCALE_COOKIE, parseLocale, type Locale } from "@/lib/i18n"

export async function setLocale(locale: Locale) {
  ;(await cookies()).set(LOCALE_COOKIE, parseLocale(locale), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 5,
  })
  revalidatePath("/", "layout")
}
