import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import Script from "next/script"

import { AppShell } from "@/components/shell/app-shell"
import { themeInitScript } from "@/components/shell/theme"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
})


export const metadata: Metadata = {
  title: "Meal App",
  description: "Plan meals against your nutrition goals and explore flavor pairings.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Sets light/dark before hydration, so the page doesn't flash the wrong theme. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  )
}
