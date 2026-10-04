import { IngredientChip } from "@/components/food/ingredient-chip"
import { altPairings, hero, hiddenAllergenNote } from "./content"

const display = {
  fontFamily: "var(--font-bricolage), ui-sans-serif, system-ui, sans-serif",
  fontStretch: "75%",
}

/** After Hot & Cool (Copenhagen): display type set uncomfortably large, almost nothing else. */
export function BigType() {
  return (
    <div className="overflow-hidden bg-paper px-5 py-8 text-ink md:px-10 md:py-12">
      <header className="relative grid gap-6">
        <div className="relative isolate">
          {/* A block of the ingredient's color, slightly off-register behind the word. */}
          <span
            aria-hidden
            className="absolute top-[38%] left-[2%] -z-10 h-[58%] w-[66%] opacity-90"
            style={{ background: hero.food.color }}
          />
          <h3
            className="text-[clamp(84px,17vw,220px)] leading-[0.78] font-extrabold tracking-[-0.03em] uppercase"
            style={display}
          >
            {hero.food.name}
          </h3>
        </div>
        <div className="relative grid gap-4 md:ml-[38%]">
          <p className="text-2xl leading-tight font-bold" style={display}>
            {hero.tagline}
          </p>
          <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-muted">{hero.intro}</p>
        </div>
      </header>

      <ol className="mt-12 grid">
        {altPairings.map((p) => (
          <li
            key={p.food.name}
            className="grid items-baseline gap-x-6 gap-y-2 border-t-2 border-ink py-5 md:grid-cols-[110px_minmax(0,1.1fr)_minmax(0,1fr)]"
          >
            <span className="text-[64px] leading-[0.8] font-extrabold tabular-nums" style={display} aria-label={`${p.sharedAromas} shared aromas`}>
              {p.sharedAromas}
            </span>
            <span className="grid justify-items-start gap-2">
              <span className="text-[44px] leading-[0.85] font-extrabold uppercase" style={display}>
                {p.food.name}
              </span>
              <IngredientChip food={p.food} size="sm" />
            </span>
            <span className="grid gap-1 text-[15px] leading-snug">
              {p.note}
              <span className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
                {p.recipesTogether.toLocaleString("en")} recipes together
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="border-t-2 border-ink pt-4 text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
        Big numbers = shared aromas · {hiddenAllergenNote}
      </p>
    </div>
  )
}
