import { intlLocale, type Locale } from "@/lib/i18n"

/*
  Number and date formatting follow the interface language. The app has one user and renders
  per request, so the active locale is a module setting: the server sets it while handling a
  request (getT), and the browser sets it from the I18n provider.
*/
let current: Locale = "en"

export function setFormatLocale(locale: Locale) {
  current = locale
}

const numberFormats = new Map<string, Intl.NumberFormat>()

/** Compact amount for nutrition figures: 1,640 · 23 · 2.9 · 0.73 (1640 · 23 · 2,9 · 0,73 in Spanish). */
export function formatAmount(value: number) {
  if (value === 0) return "0"
  const digits = value >= 10 ? 0 : value >= 1 ? 1 : 2
  const key = `${current}:${digits}`
  let format = numberFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(intlLocale(current), { maximumFractionDigits: digits, minimumFractionDigits: 0 })
    numberFormats.set(key, format)
  }
  return format.format(value)
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString(intlLocale(current), options)
}
