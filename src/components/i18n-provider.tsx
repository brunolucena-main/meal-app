"use client"

import { createContext, useContext, useMemo } from "react"

import { setFormatLocale } from "@/lib/format"
import { makeT, type Locale, type T } from "@/lib/i18n"

const LocaleContext = createContext<Locale>("en")

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  // Client-side number and date formatting follow the same locale as the server render.
  setFormatLocale(locale)
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

/** Translator for client components. */
export function useT(): T {
  const locale = useContext(LocaleContext)
  return useMemo(() => makeT(locale), [locale])
}
