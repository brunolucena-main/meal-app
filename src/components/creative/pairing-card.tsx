import { IngredientSwatch, type ChipFood } from "@/components/food/ingredient-chip"

export type Pairing = {
  food: ChipFood
  /** One sensory line about what the pairing does. */
  note: string
  /** Flavor compounds the two ingredients share. */
  sharedAromas: number
  /** Recipes in the source data that use both. */
  recipesTogether: number
}

/** Creative-register card: a tonal container tinted by the ingredient, serif name, expressive numbers. */
export function PairingCard({ pairing }: { pairing: Pairing }) {
  const { food, note, sharedAromas, recipesTogether } = pairing
  return (
    <li
      className="grid grid-rows-[auto_1fr_auto] gap-3 rounded-[28px_28px_28px_8px] p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
      style={{
        background: `color-mix(in oklab, ${food.color} 16%, var(--paper))`,
        border: `1px solid color-mix(in oklab, ${food.color} 34%, var(--paper))`,
      }}
    >
      <div className="flex items-center gap-3">
        <IngredientSwatch food={food} className="size-9 rounded-[12px_12px_12px_4px]" />
        <h4 className="font-display text-[26px] leading-none font-medium tracking-tight">{food.name}</h4>
      </div>
      <p className="font-display text-[17px] leading-snug text-ink-muted italic">{note}</p>
      <dl className="flex gap-6">
        <div className="grid gap-0.5">
          <dt className="text-[11px] font-bold tracking-[0.08em] text-ink-muted uppercase">Shared aromas</dt>
          <dd className="font-expressive text-[28px] leading-none font-extrabold">{sharedAromas}</dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-[11px] font-bold tracking-[0.08em] text-ink-muted uppercase">Recipes together</dt>
          <dd className="font-expressive text-[28px] leading-none font-extrabold">
            {recipesTogether.toLocaleString("en")}
          </dd>
        </div>
      </dl>
    </li>
  )
}
