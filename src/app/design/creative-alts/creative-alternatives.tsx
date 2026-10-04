"use client"

import { useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type AltKey = "lab" | "thesaurus" | "bigtype" | "gallery"

const options: { value: AltKey; label: string; description: string; source: string; href: string }[] = [
  {
    value: "lab",
    label: "Lab labels",
    description:
      "Every pairing is a jar label in a modular grid: plain sans, monospaced details, dotted leaders, with two Risograph inks overprinting in the corner for warmth.",
    source: "Gretel's identity for Noma Projects",
    href: "https://www.itsnicethat.com/news/gretel-noma-projects-graphic-design-120522",
  },
  {
    value: "thesaurus",
    label: "Flavour thesaurus",
    description:
      "A reference book you read pair by pair. Garamond, a drop cap, and a flavor wheel showing which families this ingredient reaches.",
    source: "The Flavour Thesaurus by Niki Segnit",
    href: "https://en.wikipedia.org/wiki/The_Flavour_Thesaurus",
  },
  {
    value: "bigtype",
    label: "Big type",
    description:
      "The ingredient name set huge in a condensed grotesk over a block of its own color, then a ruled list with big numbers. Loud, confident, almost a zine.",
    source: "Hot & Cool, Copenhagen food magazine",
    href: "https://welovedaily.net/rankings/editorial-design-2026-30-magazine-layouts",
  },
  {
    value: "gallery",
    label: "Gallery",
    description:
      "Full-bleed color fields stand in for photography, using the chip textures at full size. Wide uppercase captions and uneven margins, like a gallery wall.",
    source: "The Gourmand, art direction by David Lane",
    href: "https://welovedaily.net/rankings/editorial-design-2026-30-magazine-layouts",
  },
]

export function CreativeAlternatives({ panels }: { panels: Record<AltKey, React.ReactNode> }) {
  const [current, setCurrent] = useState<AltKey>("lab")
  const option = options.find((o) => o.value === current)!

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Tabs value={current} onValueChange={(value) => setCurrent(value as AltKey)}>
          <TabsList className="h-10 rounded-full bg-track p-1">
            {options.map((o) => (
              <TabsTrigger
                key={o.value}
                value={o.value}
                className="rounded-full px-4 text-muted-foreground data-active:text-foreground"
              >
                {o.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="max-w-[75ch] text-sm text-muted-foreground">
          {option.description}{" "}
          <span className="whitespace-nowrap">
            After{" "}
            <a href={option.href} target="_blank" rel="noopener" className="font-semibold text-primary underline-offset-4 hover:underline">
              {option.source}
            </a>
            .
          </span>
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-border">{panels[current]}</div>
      <p className="text-xs text-muted-foreground">
        Example content. Aroma and recipe counts are placeholders until the flavor data arrives in session 7.
      </p>
    </div>
  )
}
