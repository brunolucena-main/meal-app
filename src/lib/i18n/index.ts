/**
 * Minimal i18n: English text is the key, and `es.ts` maps it to Spanish. Missing entries fall
 * back to English, so a forgotten string shows up in English instead of breaking the page.
 * Placeholders use braces: t("{n} matches", { n: 3 }).
 */
import { es } from "./es"

export type Locale = "en" | "es"
export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
]
export const LOCALE_COOKIE = "lang"

export type Vars = Record<string, string | number>
export type T = (text: string, vars?: Vars) => string

export function translate(locale: Locale, text: string, vars?: Vars): string {
  let out = locale === "es" ? (es[text] ?? text) : text
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v))
  return out
}

export function makeT(locale: Locale): T {
  return (text, vars) => translate(locale, text, vars)
}

export function parseLocale(value: string | undefined | null): Locale {
  return value === "es" ? "es" : "en"
}

/** BCP 47 tag for number and date formatting. */
export function intlLocale(locale: Locale): string {
  return locale === "es" ? "es-ES" : "en-GB"
}
