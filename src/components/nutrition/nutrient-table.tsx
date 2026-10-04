import { formatAmount } from "@/lib/format"
import {
  NUTRIENT_GROUP_LABELS,
  NUTRIENTS,
  type NutrientGroup,
  type NutrientKey,
} from "@/lib/nutrition/nutrients"
import { cn } from "@/lib/utils"

const GROUPS: NutrientGroup[] = ["macros", "fats", "minerals", "vitamins"]

/**
 * Every tracked nutrient for one food, scaled by `factor` (grams / 100). Shows the amount, the
 * share of the Daily Value and a bar. Nutrients the source doesn't report say "no data".
 */
export function NutrientTable({
  nutrients,
  factor,
}: {
  nutrients: Partial<Record<NutrientKey, number>>
  factor: number
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {GROUPS.map((group) => {
        const defs = NUTRIENTS.filter((n) => n.group === group)
        const reported = defs.filter((n) => nutrients[n.key] !== undefined).length
        return (
          <section key={group} aria-labelledby={`nt-${group}`} className="surface self-start overflow-hidden rounded-3xl">
            <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-2">
              <h3 id={`nt-${group}`} className="text-base font-extrabold">
                {NUTRIENT_GROUP_LABELS[group]}
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">
                {reported} of {defs.length} reported
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Nutrient</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Percent of Daily Value</th>
                </tr>
              </thead>
              <tbody>
                {defs.map((n) => {
                  const raw = nutrients[n.key]
                  const value = raw === undefined ? undefined : raw * factor
                  const dv = "dv" in n ? n.dv : undefined
                  const pct = value !== undefined && dv ? (value / dv) * 100 : undefined
                  return (
                    <tr key={n.key} className="border-t border-border">
                      <th scope="row" className="w-[42%] px-5 py-2 text-left font-semibold">
                        {n.name}
                        {n.kind === "limit" ? (
                          <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">limit</span>
                        ) : null}
                      </th>
                      {value === undefined ? (
                        <td colSpan={2} className="px-5 py-2 text-xs font-semibold text-muted-foreground italic">
                          no data
                        </td>
                      ) : (
                        <>
                          <td className="py-2 pr-3 text-right font-bold whitespace-nowrap tabular-nums">
                            {formatAmount(value)} <span className="text-xs font-semibold text-muted-foreground">{n.unit}</span>
                          </td>
                          <td className="w-[38%] py-2 pr-5">
                            {pct !== undefined ? (
                              <span className="flex items-center gap-2">
                                <span className="block h-2 flex-1 bg-track">
                                  <span
                                    className={cn("block h-full rounded-r-[4px]", n.kind === "limit" ? "bg-series-4" : "bg-primary")}
                                    style={{ width: `${Math.max(Math.min(pct, 100), pct > 0 ? 1.5 : 0)}%` }}
                                  />
                                </span>
                                <span className="w-11 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                                  {pct >= 1000 ? `${Math.round(pct / 100) / 10}k` : Math.round(pct)}%
                                </span>
                              </span>
                            ) : null}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        )
      })}
    </div>
  )
}
