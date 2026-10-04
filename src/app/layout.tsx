import type { Metadata } from "next"
import { Manrope } from "next/font/google"

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
      <head>
        {/* Sets light/dark before first paint, so the page never flashes the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  )
}
