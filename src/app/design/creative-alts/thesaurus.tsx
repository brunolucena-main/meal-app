import { IngredientSwatch } from "@/components/food/ingredient-chip"
import { altPairings, families, hero, hiddenAllergenNote } from "./content"

const serif = { fontFamily: "var(--font-garamond), Garamond, Georgia, serif" }

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const pt = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map((n) => n.toFixed(2)).join(" ")
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${pt(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${pt(r1, a1)} L ${pt(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${pt(r0, a0)} Z`
}

/** Flavor families around the ingredient; the ones it pairs with here are in full color. */
function FamilyWheel() {
  const used = new Set(altPairings.map((p) => p.family))
  const step = (Math.PI * 2) / families.length
  return (
    <figure className="grid justify-items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-full max-w-[220px]" role="img" aria-label="Flavor families that pair with spinach">
        {families.map((f, i) => {
          const a0 = -Math.PI / 2 + i * step
          return (
            <path
              key={f.name}
              d={arcPath(100, 100, 58, 96, a0, a0 + step)}
              fill={f.color}
              fillOpacity={used.has(f.name) ? 1 : 0.18}
              stroke="var(--paper)"
              strokeWidth={2}
            />
          )
        })}
      </svg>
      <figcaption className="grid grid-cols-2 gap-x-4 gap-y-1 text-[15px]" style={serif}>
        {families.map((f) => (
          <span key={f.name} className={used.has(f.name) ? "flex items-center gap-2" : "flex items-center gap-2 text-ink-muted/60"}>
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: f.color, opacity: used.has(f.name) ? 1 : 0.35 }} />
            {f.name}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

/** After Niki Segnit's The Flavour Thesaurus: a reference book, pair by pair, around a flavor wheel. */
export function Thesaurus() {
  return (
    <div className="bg-paper px-6 py-10 text-ink md:px-12" style={serif}>
      <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        <aside className="grid content-start gap-6 lg:sticky lg:top-6">
          <FamilyWheel />
        </aside>

        <div className="grid gap-8">
          <header className="grid gap-3">
            <p className="flex items-center gap-2 text-sm tracking-[0.2em] text-ink-muted uppercase">
              <IngredientSwatch food={hero.food} className="size-4" />
              Leafy &amp; green
            </p>
            <h3 className="text-[clamp(44px,6vw,64px)] leading-none font-medium">{hero.food.name}</h3>
            <p className="text-xl text-ink-muted italic">{hero.tagline}</p>
            <p className="max-w-[60ch] text-[19px] leading-relaxed first-letter:float-left first-letter:mr-2 first-letter:text-[64px] first-letter:leading-[0.8] first-letter:font-medium">
              {hero.intro}
            </p>
          </header>

          <div className="grid gap-7 border-t border-ink/20 pt-7">
            {altPairings.map((p) => {
              const family = families.find((f) => f.name === p.family)
              return (
                <article key={p.food.name} className="grid max-w-[60ch] gap-1.5">
                  <h4 className="flex flex-wrap items-baseline gap-x-3 text-[24px] font-semibold">
                    <span>
                      {hero.food.name} &amp; {p.food.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-normal tracking-[0.15em] text-ink-muted uppercase">
                      <span aria-hidden className="size-2 rounded-full" style={{ background: family?.color }} />
                      {p.family}
                    </span>
                  </h4>
                  <p className="text-[18px] leading-relaxed">{p.note}</p>
                  <p className="text-sm tracking-[0.08em] text-ink-muted uppercase">
                    {p.sharedAromas} shared aromas · {p.recipesTogether.toLocaleString("en")} recipes together
                  </p>
                </article>
              )
            })}
          </div>
          <p className="text-[15px] text-ink-muted italic">{hiddenAllergenNote}</p>
        </div>
      </div>
    </div>
  )
}
