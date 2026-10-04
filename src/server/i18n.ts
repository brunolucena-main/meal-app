import { cookies } from "next/headers"

import { setFormatLocale } from "@/lib/format"
import { LOCALE_COOKIE, makeT, parseLocale, type Locale, type T } from "@/lib/i18n"

export async function getLocale(): Promise<Locale> {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value)
}

/** Translator for server components; also points number and date formatting at the locale. */
export async function getT(): Promise<T> {
  const locale = await getLocale()
  setFormatLocale(locale)
  return makeT(locale)
}
