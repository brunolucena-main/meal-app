import { IngredientChip } from "@/components/food/ingredient-chip"
import { altPairings, hero, hiddenAllergenNote } from "./content"

const sans = { fontFamily: "var(--font-instrument), ui-sans-serif, system-ui, sans-serif" }
const mono = { fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }

/** After Gretel's identity for Noma Projects: functional lab labels, modular grid, Risograph overprints. */
export function LabPantry() {
  return (
    <div className="bg-paper p-4 text-ink md:p-6" style={sans}>

      <div className="grid gap-px border border-ink bg-ink">
        <header className="relative isolate grid gap-4 overflow-hidden bg-paper p-6 md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-[14%] -z-10 size-64 rounded-full bg-[#ff48b0] opacity-80 mix-blend-multiply dark:opacity-45 dark:mix-blend-screen"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-10 -right-12 -z-10 h-32 w-72 bg-[#0078bf] opacity-75 mix-blend-multiply dark:opacity-45 dark:mix-blend-screen"
          />
          <p className="text-xs tracking-wide text-ink-muted uppercase" style={mono}>
            No. 001 · Leafy greens · Pairings
          </p>
          <h3 className="text-[clamp(48px,8vw,88px)] leading-[0.9] font-semibold tracking-[-0.03em]">{hero.food.name}</h3>
          <p className="text-sm text-ink-muted" style={mono}>
            {hero.latin} · {hero.kcalPer100g} kcal / 100 g
          </p>
          <p className="max-w-[58ch] text-[17px] leading-relaxed">{hero.intro}</p>
        </header>

        <ul className="grid gap-px sm:grid-cols-2 xl:grid-cols-3">
          {altPairings.map((p, i) => (
            <li key={p.food.name} className="grid grid-rows-[auto_auto_1fr_auto] gap-3 bg-paper p-5">
              <p className="flex items-center justify-between text-[11px] text-ink-muted uppercase" style={mono}>
                <span>No. {String(i + 1).padStart(2, "0")}</span>
                <span>{p.family}</span>
              </p>
              <IngredientChip food={p.food} className="justify-self-start" />
              <p className="text-[15px] leading-snug">{p.note}</p>
              <dl className="grid gap-1 text-xs" style={mono}>
                <div className="flex items-baseline gap-2">
                  <dt className="text-ink-muted">Shared aromas</dt>
                  <span aria-hidden className="flex-1 border-b border-dotted border-ink/40" />
                  <dd>{p.sharedAromas}</dd>
                </div>
                <div className="flex items-baseline gap-2">
                  <dt className="text-ink-muted">Recipes together</dt>
                  <span aria-hidden className="flex-1 border-b border-dotted border-ink/40" />
                  <dd>{p.recipesTogether.toLocaleString("en")}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-ink-muted" style={mono}>
        {hiddenAllergenNote}
      </p>
    </div>
  )
}
