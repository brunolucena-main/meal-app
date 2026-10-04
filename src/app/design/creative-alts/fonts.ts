import { Archivo, EB_Garamond, IBM_Plex_Mono, Instrument_Sans } from "next/font/google"

// Fonts used only by the creative-direction specimens on /design.

export const instrumentSans = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"] })

export const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
})

export const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] })

export const creativeAltFontVars = [instrumentSans, plexMono, garamond, archivo].map((f) => f.variable).join(" ")
