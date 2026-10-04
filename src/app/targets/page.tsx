import { Info } from "lucide-react"
import type { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { formatAmount } from "@/lib/format"
import { NUTRIENT_GROUP_LABELS, NUTRIENTS, type NutrientGroup } from "@/lib/nutrition/nutrients"
import {
  ACTIVITY_FACTORS,
  computeTargets,
  energyTarget,
  GOAL_ADJUSTMENT,
  restingEnergy,
} from "@/lib/nutrition/targets"
import { getSettings } from "@/server/settings"
import { saveOverrides, saveProfile } from "./actions"

export const metadata: Metadata = { title: "Targets · Meal App" }

const field = "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-semibold"
const label = "grid gap-1.5 text-sm font-bold"

export default async function TargetsPage() {
  const s = await getSettings()
  const { profile: p } = s
  const computed = computeTargets(p)
  const groups: NutrientGroup[] = ["energy", "macros", "fats", "minerals", "vitamins"]

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-10 md:py-12">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Targets</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Your daily targets, computed from your profile. Comparisons and rankings measure foods against them.
        </p>
      </header>

      {!s.profileSaved ? (
        <p className="flex items-start gap-2 rounded-2xl bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          These targets come from an example profile. Enter your own details and save to make them yours.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <form action={saveProfile} className="surface grid gap-5 rounded-3xl p-5 md:p-6">
          <h2 className="text-lg font-extrabold">Profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Sex
              <select name="sex" defaultValue={p.sex} className={field}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>
            <label className={label}>
              Age
              <input name="age" type="number" min={19} max={100} defaultValue={p.age} className={field} />
            </label>
            <label className={label}>
              Height (cm)
              <input name="heightCm" type="number" min={120} max={230} step="0.5" defaultValue={p.heightCm} className={field} />
            </label>
            <label className={label}>
              Weight (kg)
              <input name="weightKg" type="number" min={30} max={250} step="0.1" defaultValue={p.weightKg} className={field} />
            </label>
            <label className={`${label} sm:col-span-2`}>
              Activity
              <select name="activity" defaultValue={p.activity} className={field}>
                {Object.entries(ACTIVITY_FACTORS).map(([value, a]) => (
                  <option key={value} value={value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${label} sm:col-span-2`}>
              Goal
              <select name="goal" defaultValue={p.goal} className={field}>
                {Object.entries(GOAL_ADJUSTMENT).map(([value, g]) => (
                  <option key={value} value={value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Protein (g per kg)
              <input name="proteinPerKg" type="number" min={0.6} max={3} step="0.1" defaultValue={p.proteinPerKg} className={field} />
            </label>
            <label className={label}>
              Fat (% of energy)
              <input name="fatPercent" type="number" min={15} max={50} step="1" defaultValue={Math.round(p.fatShare * 100)} className={field} />
            </label>
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-bold">Allergies</legend>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="allergies" value="hazelnut" defaultChecked={s.allergies.includes("hazelnut")} className="size-4 accent-primary" />
              Hazelnut (also filbert, praline, gianduja, mixed nuts)
            </label>
            <p className="text-xs text-muted-foreground">
              Tagged foods are hidden from suggestions and flagged everywhere else. Tags come from food names, so treat
              them as a helper, not a guarantee.
            </p>
          </fieldset>
          <Button type="submit" size="lg" className="justify-self-start">
            Save profile
          </Button>
        </form>

        <section className="grid content-start gap-4 self-start rounded-3xl bg-tint-1 p-5 md:p-6" aria-label="Energy">
          <h2 className="text-lg font-extrabold">Daily energy</h2>
          <p className="text-[40px] leading-none font-extrabold tabular-nums">
            {formatAmount(s.targets.energy ?? 0)} <span className="text-base font-semibold text-muted-foreground">kcal</span>
          </p>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Resting energy (Mifflin-St Jeor)</dt>
              <dd className="font-bold tabular-nums">{formatAmount(restingEnergy(p))} kcal</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">× activity</dt>
              <dd className="font-bold tabular-nums">{ACTIVITY_FACTORS[p.activity].factor}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">× goal</dt>
              <dd className="font-bold tabular-nums">{GOAL_ADJUSTMENT[p.goal].factor}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-2">
              <dt className="font-bold">Computed</dt>
              <dd className="font-bold tabular-nums">{formatAmount(energyTarget(p))} kcal</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Protein {formatAmount(s.targets.protein ?? 0)} g · fat {formatAmount(s.targets.fat ?? 0)} g · carbs{" "}
            {formatAmount(s.targets.carbs ?? 0)} g · fiber {formatAmount(s.targets.fiber ?? 0)} g
          </p>
        </section>
      </div>

      <form action={saveOverrides} className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-lg font-extrabold">All targets</h2>
            <p className="text-sm text-muted-foreground">
              Leave a field empty to use the computed value. Vitamins and minerals follow the NIH Dietary Reference
              Intakes for your sex and age.
            </p>
          </div>
          <Button type="submit">Save targets</Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => {
            const defs = NUTRIENTS.filter((n) => n.group === g && computed[n.key] !== undefined)
            if (!defs.length) return null
            return (
              <section key={g} className="surface self-start overflow-hidden rounded-3xl">
                <h3 className="px-5 pt-4 pb-2 text-base font-extrabold">{NUTRIENT_GROUP_LABELS[g]}</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th scope="col" className="px-5 pb-2 font-semibold">Nutrient</th>
                      <th scope="col" className="pb-2 font-semibold">Computed</th>
                      <th scope="col" className="pr-5 pb-2 font-semibold">Yours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defs.map((n) => (
                      <tr key={n.key} className="border-t border-border">
                        <th scope="row" className="px-5 py-2 text-left font-semibold">
                          {n.name}
                          {n.kind === "limit" ? <span className="ml-1.5 text-[11px] text-muted-foreground">max</span> : null}
                          {s.upperLimits[n.key] !== undefined ? (
                            <span className="block text-[11px] font-medium text-muted-foreground">
                              Upper limit {formatAmount(s.upperLimits[n.key]!)} {n.unit}
                            </span>
                          ) : null}
                        </th>
                        <td className="py-2 font-bold tabular-nums">
                          {formatAmount(computed[n.key]!)} <span className="text-xs text-muted-foreground">{n.unit}</span>
                        </td>
                        <td className="py-2 pr-5">
                          <input
                            name={`t_${n.key}`}
                            type="number"
                            min={0}
                            step="any"
                            aria-label={`Your ${n.name} target in ${n.unit}`}
                            defaultValue={s.overrides[n.key] ?? ""}
                            placeholder={formatAmount(computed[n.key]!)}
                            className="h-9 w-24 rounded-lg border border-input bg-card px-2 text-sm tabular-nums"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )
          })}
        </div>
      </form>
    </div>
  )
}
