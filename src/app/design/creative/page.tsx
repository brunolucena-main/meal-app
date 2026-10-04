import type { Metadata } from "next"
import Link from "next/link"

import { PairingsExample } from "../creative-specimen"

export const metadata: Metadata = { title: "Creative preview · Meal App" }

/** Full-page preview of a creative screen, until the real ones arrive in sessions 7 and 8. */
export default function CreativePreviewPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <p className="text-xs font-bold tracking-[0.12em] text-on-night-muted uppercase">
        Preview · example data ·{" "}
        <Link href="/design#creative" className="text-on-night underline underline-offset-4">
          Back to the design system
        </Link>
      </p>
      <PairingsExample />
    </div>
  )
}
