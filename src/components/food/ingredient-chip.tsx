import type { CSSProperties } from "react"

import type { FoodGroup } from "@/lib/food/types"
import { AllergenFlag } from "./allergen-flag"
import { cn } from "@/lib/utils"

export type { FoodGroup } from "@/lib/food/types"

export type ChipFood = {
  name: string
  /** Representative color of the ingredient, e.g. "#3f7d3a" for spinach. */
  color: string
  group: FoodGroup
  /** Allergen this food is tagged with for the current profile, e.g. "hazelnut". */
  allergen?: string
}

function relativeLuminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

/** Texture drawn over the ingredient color. Light colors get dark marks, dark colors light ones. */
export function swatchStyle(color: string, group: FoodGroup): CSSProperties {
  const light = relativeLuminance(color) > 0.45
  const ink = light ? "rgb(0 0 0 / 0.16)" : "rgb(255 255 255 / 0.3)"
  const edge = light ? "inset 0 0 0 1px rgb(0 0 0 / 0.14)" : "inset 0 0 0 1px rgb(0 0 0 / 0.08)"

  const textures: Record<FoodGroup, Pick<CSSProperties, "backgroundImage" | "backgroundSize" | "boxShadow">> = {
    leafy: { backgroundImage: `repeating-linear-gradient(45deg, ${ink} 0 1.5px, transparent 1.5px 5px)` },
    vegetable: { backgroundImage: `repeating-linear-gradient(90deg, ${ink} 0 1.5px, transparent 1.5px 5px)` },
    fruit: { backgroundImage: `radial-gradient(circle at 32% 30%, rgb(255 255 255 / 0.5) 0 16%, transparent 17%)` },
    legume: { backgroundImage: `radial-gradient(${ink} 1.3px, transparent 1.7px)`, backgroundSize: "5px 5px" },
    grain: { backgroundImage: `repeating-linear-gradient(0deg, ${ink} 0 1px, transparent 1px 4px)` },
    nut: {
      backgroundImage: `radial-gradient(${ink} 1px, transparent 1.5px), radial-gradient(${ink} 1px, transparent 1.5px)`,
      backgroundSize: "6px 6px",
    },
    dairy: { boxShadow: `inset 0 0 0 3px ${ink}` },
    meat: { backgroundImage: `repeating-linear-gradient(135deg, ${ink} 0 3px, transparent 3px 8px)` },
    fish: {
      backgroundImage: `repeating-linear-gradient(45deg, ${ink} 0 1px, transparent 1px 5px), repeating-linear-gradient(135deg, ${ink} 0 1px, transparent 1px 5px)`,
    },
    herb: { backgroundImage: `radial-gradient(${ink} 0.8px, transparent 1.2px)`, backgroundSize: "3px 3px" },
    fat: { backgroundImage: `linear-gradient(180deg, rgb(255 255 255 / 0.45), transparent 65%)` },
    other: {},
  }

  const texture = textures[group]
  return {
    backgroundColor: color,
    ...texture,
    // Offset the second dot grid of "nut" so the dots interleave.
    backgroundPosition: group === "nut" ? "0 0, 3px 3px" : undefined,
    boxShadow: [texture.boxShadow, edge].filter(Boolean).join(", "),
  }
}

export function IngredientSwatch({ food, className }: { food: ChipFood; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-5 shrink-0 rounded-[7px_7px_7px_2px]", className)}
      style={swatchStyle(food.color, food.group)}
    />
  )
}

/** Compact ingredient label: textured color swatch + name. Flags allergens in words, not just color. */
export function IngredientChip({
  food,
  size = "md",
  className,
}: {
  food: ChipFood
  size?: "sm" | "md"
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-card font-bold whitespace-nowrap",
        size === "md" ? "py-1 pr-3 pl-1 text-sm" : "py-0.5 pr-2.5 pl-0.5 text-xs",
        food.allergen ? "border-warn bg-warn-soft" : "border-border",
        className
      )}
    >
      <IngredientSwatch food={food} className={size === "md" ? "size-6" : "size-[18px]"} />
      {food.name}
      {food.allergen ? <AllergenFlag name={food.name} allergen={food.allergen} /> : null}
    </span>
  )
}
