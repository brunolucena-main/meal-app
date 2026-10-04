import { ArrowDown, ArrowUp } from "lucide-react"

import { IngredientChip, type ChipFood } from "@/components/food/ingredient-chip"
import { formatAmount } from "@/components/nutrition/target-bar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type CompareRow = {
  key: string
  label: string
  unit: string
  /** Daily Value (or personal target) used for the % figure and the bar. */
  dv?: number
  /** goal = more is better, limit = less is better, info = no winner. */
  kind: "goal" | "limit" | "info"
  /** One value per food; null means the source has no data (never treated as zero). */
  values: (number | null)[]
}

export type CompareGroup = { label: string; rows: CompareRow[] }

const seriesBg = ["bg-series-1", "bg-series-2", "bg-series-3", "bg-series-4"]

function bestIndex(row: CompareRow): number | null {
  if (row.kind === "info") return null
  const known = row.values.flatMap((v, i) => (v === null ? [] : [[v, i] as const]))
  if (known.length < 2) return null
  const sorted = [...known].sort((a, b) => (row.kind === "goal" ? b[0] - a[0] : a[0] - b[0]))
  return sorted[0][0] === sorted[1][0] ? null : sorted[0][1]
}

/**
 * Compact side-by-side table: one column per food, one row per nutrient. Each cell shows the
 * amount, % of target and a thin bar. The header chips double as the legend for series colors.
 */
export function CompareTable({
  foods,
  groups,
  basis,
}: {
  foods: ChipFood[]
  groups: CompareGroup[]
  basis: string
}) {
  return (
    <div className="surface overflow-x-auto rounded-3xl">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="px-5 pt-4 pb-1 text-left text-xs font-semibold text-muted-foreground">{basis}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-36 px-5 py-3 text-left text-xs font-bold text-muted-foreground">
              Nutrient
            </th>
            {foods.map((food, i) => (
              <th key={food.name} scope="col" className="px-4 py-3 text-left font-normal">
                {/* The colored underline keys this column's bars to the food. */}
                <span className="inline-grid gap-1.5">
                  <IngredientChip food={food} size="sm" />
                  <span aria-hidden className={cn("h-1 w-full rounded-full", seriesBg[i])} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.label}>
            <tr>
              <th
                scope="colgroup"
                colSpan={foods.length + 1}
                className="bg-muted px-5 py-1.5 text-left text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase"
              >
                {group.label}
              </th>
            </tr>
            {group.rows.map((row) => {
              const best = bestIndex(row)
              return (
                <tr key={row.key} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-5 py-2 text-left font-semibold">
                    {row.label}
                    {row.kind === "limit" ? (
                      <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">limit</span>
                    ) : null}
                  </th>
                  {row.values.map((value, i) => (
                    <td key={foods[i].name} className="px-4 py-2 align-middle">
                      <CompareCell
                        row={row}
                        value={value}
                        food={foods[i]}
                        seriesClass={seriesBg[i]}
                        isBest={best === i}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        ))}
      </table>
    </div>
  )
}

function CompareCell({
  row,
  value,
  food,
  seriesClass,
  isBest,
}: {
  row: CompareRow
  value: number | null
  food: ChipFood
  seriesClass: string
  isBest: boolean
}) {
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
          USDA has no {row.label.toLowerCase()} value for {food.name.toLowerCase()}. It is left out of the
          comparison, not counted as zero.
        </TooltipContent>
      </Tooltip>
    )
  }

  const pct = row.dv ? (value / row.dv) * 100 : null
  const BestIcon = row.kind === "limit" ? ArrowDown : ArrowUp
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} />} className="grid gap-1 rounded-md outline-offset-2">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("tabular", isBest ? "font-extrabold" : "font-medium")}>
            {formatAmount(value)} <span className="text-xs text-muted-foreground">{row.unit}</span>
            {isBest ? (
              <BestIcon
                className="ml-1 inline size-3.5 align-[-2px]"
                aria-label={row.kind === "limit" ? "lowest" : "highest"}
              />
            ) : null}
          </span>
          {pct !== null ? <span className="tabular text-xs text-muted-foreground">{Math.round(pct)}%</span> : null}
        </span>
        {pct !== null ? (
          <span className="block h-2 bg-track">
            <span
              className={cn("block h-full rounded-r-[4px]", seriesClass)}
              style={{ width: `${Math.max(Math.min(pct, 100), 1.5)}%` }}
            />
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent>
        {food.name} · {row.label}: {formatAmount(value)} {row.unit}
        {pct !== null ? ` = ${Math.round(pct)}% of Daily Value` : ""}
        {isBest ? (row.kind === "limit" ? " · lowest here" : " · highest here") : ""}
      </TooltipContent>
    </Tooltip>
  )
}
