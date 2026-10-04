import { formatAmount } from "@/lib/format"
import {
  NUTRIENT_GROUP_LABELS,
  NUTRIENTS,
  type NutrientGroup,
  type NutrientKey,
} from "@/lib/nutrition/nutrients"
import type { Targets } from "@/lib/nutrition/targets"
import { cn } from "@/lib/utils"
import { getT } from "@/server/i18n"

const GROUPS: NutrientGroup[] = ["macros", "fats", "minerals", "vitamins"]

/**
 * Every tracked nutrient for one food, scaled by `factor` (grams / 100). Shows the amount, the
 * share of the daily target (personal target, else Daily Value) and a bar. Nutrients the source
 * doesn't report say "no data".
 */
export async function NutrientTable({
  nutrients,
  factor,
  targets = {},
  partial = {},
  className,
}: {
  nutrients: Partial<Record<NutrientKey, number>>
  factor: number
  targets?: Targets
  /** Recipes: nutrients where some ingredients lack data, so the total is a minimum. */
  partial?: Partial<Record<NutrientKey, string[]>>
  className?: string
}) {
  const t = await getT()
  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      {GROUPS.map((group) => {
        const defs = NUTRIENTS.filter((n) => n.group === group)
        const reported = defs.filter((n) => nutrients[n.key] !== undefined).length
        return (
          <section key={group} aria-labelledby={`nt-${group}`} className="surface self-start overflow-hidden rounded-3xl">
            <div className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-2">
              <h3 id={`nt-${group}`} className="text-base font-extrabold">
                {t(NUTRIENT_GROUP_LABELS[group])}
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">
                {t("{n} of {total} reported", { n: reported, total: defs.length })}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th scope="col">{t("Nutrient")}</th>
                  <th scope="col">{t("Amount")}</th>
                  <th scope="col">{t("Percent of daily target")}</th>
                </tr>
              </thead>
              <tbody>
                {defs.map((n) => {
                  const raw = nutrients[n.key]
                  const value = raw === undefined ? undefined : raw * factor
                  const dv = targets[n.key] ?? ("dv" in n ? n.dv : undefined)
                  const pct = value !== undefined && dv ? (value / dv) * 100 : undefined
                  return (
                    <tr key={n.key} className="border-t border-border">
                      <th scope="row" className="w-[42%] px-5 py-2 text-left font-semibold">
                        {t(n.name)}
                        {n.kind === "limit" ? (
                          <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">{t("limit")}</span>
                        ) : null}
                      </th>
                      {value === undefined ? (
                        <td colSpan={2} className="px-5 py-2 text-xs font-semibold text-muted-foreground italic">
                          {t("no data")}
                        </td>
                      ) : (
                        <>
                          <td
                            className="py-2 pr-3 text-right font-bold whitespace-nowrap tabular-nums"
                            title={partial[n.key] ? t("At least this much: no data for {foods}", { foods: partial[n.key]!.join(", ") }) : undefined}
                          >
                            {partial[n.key] ? <span className="text-warn">≥ </span> : null}
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
