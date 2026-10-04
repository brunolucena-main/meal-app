import { ArrowDown, ArrowUp } from "lucide-react"

import { IngredientChip, type ChipFood } from "@/components/food/ingredient-chip"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatAmount } from "@/lib/format"
import type { Comparison, CompareRow } from "@/lib/nutrition/compare"
import { NUTRIENT_GROUP_LABELS, type NutrientGroup } from "@/lib/nutrition/nutrients"
import { cn } from "@/lib/utils"

const seriesBg = ["bg-series-1", "bg-series-2", "bg-series-3", "bg-series-4"]
const GROUP_ORDER: NutrientGroup[] = ["energy", "macros", "fats", "minerals", "vitamins"]

/**
 * Compact side-by-side table: one column per food, one row per nutrient. Each cell shows the
 * amount, % of target and a thin bar. The colored line under each header chip keys its bars.
 */
export function CompareTable({
  foods,
  comparison,
  caption,
  headerExtra,
}: {
  foods: ChipFood[]
  comparison: Comparison
  caption: string
  /** Extra controls under each food's header chip (portion picker, remove button...). */
  headerExtra?: (index: number) => React.ReactNode
}) {
  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    rows: comparison.rows.filter((r) => r.nutrient.group === g),
  })).filter((g) => g.rows.length > 0)

  return (
    <div className="surface overflow-x-auto rounded-3xl">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="px-5 pt-4 pb-1 text-left text-xs font-semibold text-muted-foreground">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-40 px-5 py-3 text-left align-top text-xs font-bold text-muted-foreground">
              Nutrient
            </th>
            {foods.map((food, i) => (
              <th key={`${food.name}-${i}`} scope="col" className="px-4 py-3 text-left align-top font-normal">
                <span className="grid gap-1.5">
                  <span className="inline-grid justify-self-start gap-1.5">
                    <IngredientChip food={food} size="sm" className="max-w-full whitespace-normal" />
                    <span aria-hidden className={cn("h-1 w-full rounded-full", seriesBg[i])} />
                  </span>
                  {headerExtra?.(i)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        {groups.map(({ group, rows }) => (
          <tbody key={group}>
            {group !== "energy" ? (
              <tr>
                <th
                  scope="colgroup"
                  colSpan={foods.length + 1}
                  className="bg-muted px-5 py-1.5 text-left text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase"
                >
                  {NUTRIENT_GROUP_LABELS[group]}
                </th>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.nutrient.key} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-5 py-2 text-left font-semibold">
                  {row.nutrient.name}
                  {row.nutrient.kind === "limit" ? (
                    <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">limit</span>
                  ) : null}
                </th>
                {row.values.map((_, i) => (
                  <td key={i} className="px-4 py-2 align-middle">
                    <CompareCell row={row} index={i} food={foods[i]} seriesClass={seriesBg[i]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}

function CompareCell({
  row,
  index,
  food,
  seriesClass,
}: {
  row: CompareRow
  index: number
  food: ChipFood
  seriesClass: string
}) {
  const value = row.values[index]
  const { nutrient } = row
  if (value === null) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<span tabIndex={0} />}
          className="text-xs font-semibold text-muted-foreground italic underline decoration-dotted underline-offset-4"
        >
          no data
        </TooltipTrigger>
        <TooltipContent>
          No {nutrient.name.toLowerCase()} value for {food.name}. It is left out of the comparison, not counted as zero.
        </TooltipContent>
      </Tooltip>
    )
  }

  const pct = row.pctDv[index]
  const isBest = row.best === index
  const BestIcon = nutrient.kind === "limit" ? ArrowDown : ArrowUp
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} />} className="grid gap-1 rounded-md outline-offset-2">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("tabular-nums", isBest ? "font-extrabold" : "font-medium")}>
            {formatAmount(value)} <span className="text-xs text-muted-foreground">{nutrient.unit}</span>
            {isBest ? (
              <BestIcon
                className="ml-1 inline size-3.5 align-[-2px]"
                aria-label={nutrient.kind === "limit" ? "lowest" : "highest"}
              />
            ) : null}
          </span>
          {pct !== null ? <span className="text-xs text-muted-foreground tabular-nums">{Math.round(pct)}%</span> : null}
        </span>
        {pct !== null ? (
          <span className="block h-2 bg-track">
            <span
              className={cn("block h-full rounded-r-[4px]", seriesClass)}
              style={{ width: `${Math.max(Math.min(pct, 100), pct > 0 ? 1.5 : 0)}%` }}
            />
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent>
        {food.name} · {nutrient.name}: {formatAmount(value)} {nutrient.unit}
        {pct !== null ? ` = ${Math.round(pct)}% of Daily Value` : ""}
        {isBest ? (nutrient.kind === "limit" ? " · lowest here" : " · highest here") : ""}
      </TooltipContent>
    </Tooltip>
  )
}
