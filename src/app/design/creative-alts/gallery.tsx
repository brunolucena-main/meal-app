import { IngredientChip, swatchStyle } from "@/components/food/ingredient-chip"
import { cn } from "@/lib/utils"
import { altPairings, hero, hiddenAllergenNote } from "./content"

const wide = {
  fontFamily: "var(--font-archivo), ui-sans-serif, system-ui, sans-serif",
  fontStretch: "125%",
}

/**
 * After The Gourmand: full-bleed color in place of photography, uppercase wide sans,
 * uneven margins, captions like a gallery wall. The chip textures grow into the "photos".
 */
export function Gallery() {
  return (
    <div className="bg-paper text-ink">
      <header
        className="relative grid min-h-[340px] content-end gap-3 px-6 pt-24 pb-8 text-white md:pr-[30%] md:pl-[12%]"
        style={{ ...swatchStyle(hero.food.color, hero.food.group), backgroundSize: "auto" }}
      >
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-85" style={wide}>
          Pairings · {hero.latin}
        </p>
        <h3 className="text-[clamp(44px,8vw,96px)] leading-[0.9] font-bold uppercase" style={wide}>
          {hero.food.name}
        </h3>
        <p className="max-w-[46ch] text-[15px] leading-relaxed opacity-90">{hero.tagline}</p>
      </header>

      <div className="grid gap-10 px-6 py-10 md:pr-[6%] md:pl-[12%]">
        <p className="max-w-[60ch] text-[17px] leading-relaxed">{hero.intro}</p>

        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {altPairings.map((p, i) => (
            <li key={p.food.name} className={cn("grid content-start gap-3", i === 0 && "lg:col-span-2")}>
              <div
                aria-hidden
                className={cn("w-full", i === 0 ? "aspect-[2/1]" : "aspect-[4/3]")}
                style={swatchStyle(p.food.color, p.food.group)}
              />
              <div className="grid gap-1.5">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-bold tracking-[0.06em] uppercase" style={wide}>
                    {p.food.name}
                  </span>
                  <span className="text-xs text-ink-muted italic">{p.latin}</span>
                </p>
                <p className="text-[15px] leading-snug">{p.note}</p>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase" style={wide}>
                  {p.sharedAromas} aromas · {p.recipesTogether.toLocaleString("en")} recipes
                </p>
                <IngredientChip food={p.food} size="sm" className="mt-1 justify-self-start" />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-muted uppercase" style={wide}>
          {hiddenAllergenNote}
        </p>
      </div>
    </div>
  )
}
