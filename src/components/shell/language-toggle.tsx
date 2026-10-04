"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { setLocale } from "@/app/locale-actions"
import { useLocale, useT } from "@/components/i18n-provider"
import { LOCALES } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/** English / Spanish switch. The choice is kept in a cookie. */
export function LanguageToggle() {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div role="group" aria-label={t("Language")} className={cn("flex w-full gap-1", pending && "opacity-60")}>
      {LOCALES.map((l) => (
        <button
          key={l.value}
          type="button"
          aria-pressed={locale === l.value}
          lang={l.value}
          title={l.value === "en" ? "English" : "Español"}
          onClick={() =>
            startTransition(async () => {
              await setLocale(l.value)
              router.refresh()
            })
          }
          className={cn(
            "h-8 flex-1 rounded-lg text-xs font-bold text-creative-foreground transition-colors hover:bg-white/10",
            locale === l.value && "bg-white/20"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
