import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import Script from "next/script"

import { I18nProvider } from "@/components/i18n-provider"
import { AppShell } from "@/components/shell/app-shell"
import { themeInitScript } from "@/components/shell/theme"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getLocale, getT } from "@/server/i18n"
import "./globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
    title: "Meal App",
    description: t("Plan meals against your nutrition goals and explore flavor pairings."),
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale()
  return (
    <html lang={locale} suppressHydrationWarning className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/* Sets light/dark before hydration, so the page doesn't flash the wrong theme. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <I18nProvider locale={locale}>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
