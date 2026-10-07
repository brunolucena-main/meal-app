import type { Metadata } from "next"

import { CookingBar } from "@/components/creative/cooking"
import { FlavorHeader } from "@/components/creative/flavor-header"
import { swatchStyle } from "@/components/food/ingredient-chip"
import { listFlavorIngredients } from "@/server/flavor"
import { flavorMap } from "@/server/flavor-graph"
import { getSettings } from "@/server/settings"
import { IngredientFinder } from "../pairings/ingredient-finder"
import { getT } from "@/server/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: `${t("Flavor map")} · Meal App` }
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""
const W = 900
const H = 620

export default async function FlavorMapPage(props: PageProps<"/flavor-map">) {
  const t = await getT()
  const params = await props.searchParams
  const id = Number(one(params.i))
  const [settings, all, map] = await Promise.all([
    getSettings(),
    listFlavorIngredients(),
    Number.isInteger(id) && id > 0 ? flavorMap(id, 16) : Promise.resolve(null),
  ])
  const finderItems = all.map(({ id, name, color, group, allergens }) => ({ id, name, color, group, allergens }))

  if (!map) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:px-10 md:py-12">
        <header className="grid gap-2">
          <CookingBar />
          <p className="text-xs font-bold tracking-[0.12em] text-on-night-muted uppercase">{t("Create")}</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("Flavor map")}</h1>
          <p className="max-w-[65ch] text-on-night-muted">
            {t("An ingredient's neighborhood: what recipes put next to it, and which of those also go together. Pick an ingredient to start, then click any neighbor to move to it.")}
          </p>
        </header>
        <IngredientFinder items={finderItems} basePath="/flavor-map" param="i" />
      </div>
    )
  }

  const nodes = map.nodes.filter((n) => !n.ingredient.allergens.some((a) => settings.allergies.includes(a)))
  const pos = new Map(nodes.map((n) => [n.ingredient.id, { x: n.x * W, y: n.y * H }]))
  const cx = W / 2
  const cy = H / 2

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <FlavorHeader ingredient={map.center} tastes={map.center.tastes} current="map" section="Flavor map" />

      {nodes.length === 0 ? (
        <p className="text-on-night-muted">{t("No recipe partners on record for {name}.", { name: map.center.name.toLowerCase() })}</p>
      ) : (
        <figure className="grid gap-2">
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[640px]" role="img" aria-labelledby="map-title map-desc">
              <title id="map-title">{t("Flavor map of {name}", { name: map.center.name })}</title>
              <desc id="map-desc">
                {t("{name} in the center, surrounded by the {n} ingredients recipes combine with it most. Closer means more often.", { name: map.center.name, n: nodes.length })}
              </desc>
              {map.edges.map((e) => {
                const a = pos.get(e.a)
                const b = pos.get(e.b)
                if (!a || !b) return null
                return <line key={`${e.a}-${e.b}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#b7a2f5" strokeOpacity={0.12 + e.score * 0.4} strokeWidth={1.2} />
              })}
              {nodes.map((n) => (
                <line
                  key={`c-${n.ingredient.id}`}
                  x1={cx}
                  y1={cy}
                  x2={n.x * W}
                  y2={n.y * H}
                  stroke="#d9cffb"
                  strokeOpacity={0.25 + n.strength * 0.5}
                  strokeWidth={1 + n.strength * 3}
                />
              ))}
              {nodes.map((n) => {
                const x = n.x * W
                const y = n.y * H
                const r = 9 + n.strength * 9
                return (
                  <a key={n.ingredient.id} href={`/flavor-map?i=${n.ingredient.id}`} aria-label={t("{name}, open its map", { name: n.ingredient.name })}>
                    <circle cx={x} cy={y} r={r + 3} fill="var(--night)" />
                    <foreignObject x={x - r} y={y - r} width={r * 2} height={r * 2}>
                      <div style={{ ...swatchStyle(n.ingredient.color, n.ingredient.group), width: "100%", height: "100%", borderRadius: "50%" }} />
                    </foreignObject>
                    <text x={x} y={y + r + 16} textAnchor="middle" fill="var(--on-night)" fontSize={13} fontWeight={700}>
                      {n.ingredient.name}
                    </text>
                  </a>
                )
              })}
              <circle cx={cx} cy={cy} r={34} fill="var(--night)" stroke="#d9cffb" strokeWidth={3} />
              <foreignObject x={cx - 30} y={cy - 30} width={60} height={60}>
                <div style={{ ...swatchStyle(map.center.color, map.center.group), width: "100%", height: "100%", borderRadius: "50%" }} />
              </foreignObject>
              <text x={cx} y={cy + 56} textAnchor="middle" fill="var(--on-night)" fontSize={16} fontWeight={800}>
                {map.center.name}
              </text>
            </svg>
          </div>
          <figcaption className="text-xs text-on-night-muted">
            {t("Closer and thicker lines: recipes combine them more. Faint lines link neighbors that also go together. Click a neighbor to move the map to it.")}
          </figcaption>
        </figure>
      )}
    </div>
  )
}
