"use client"

import { Plus, X } from "lucide-react"
import { useState, useTransition } from "react"

import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { ALLERGENS } from "@/lib/food/allergens"
import { CUSTOM_FOOD_CATEGORIES, fieldText as text, saltToSodiumMg, sodiumMgToSalt, type CustomFoodFormValues } from "@/lib/food/custom"
import { NUTRIENT_GROUP_LABELS, NUTRIENTS, type NutrientKey } from "@/lib/nutrition/nutrients"
import { cn } from "@/lib/utils"

/** What a nutrition label shows, in label order. Sodium gets a salt field next to it. */
const LABEL_KEYS: NutrientKey[] = ["energy", "fat", "satFat", "carbs", "sugars", "fiber", "protein"]
const MORE = NUTRIENTS.filter((n) => !LABEL_KEYS.includes(n.key) && n.key !== "sodium")

const field = "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-semibold"

const parse = (s: string) => Number(s.trim().replace(",", "."))

export function CustomFoodForm({
  initial,
  submitLabel,
  action,
}: {
  initial: CustomFoodFormValues
  submitLabel: string
  action: (form: FormData) => Promise<{ error?: string }>
}) {
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sodium, setSodium] = useState(initial.nutrients.sodium ?? "")
  const [salt, setSalt] = useState(() => {
    const mg = parse(initial.nutrients.sodium ?? "")
    return initial.nutrients.sodium && Number.isFinite(mg) ? text(sodiumMgToSalt(mg)) : ""
  })
  const [portions, setPortions] = useState(initial.portions.length ? initial.portions : [{ label: "", grams: "" }])
  const moreFilled = MORE.some((n) => initial.nutrients[n.key])

  function onSalt(value: string) {
    setSalt(value)
    const g = parse(value)
    setSodium(value.trim() && Number.isFinite(g) ? text(saltToSodiumMg(g)) : "")
  }
  function onSodium(value: string) {
    setSodium(value)
    const mg = parse(value)
    setSalt(value.trim() && Number.isFinite(mg) ? text(sodiumMgToSalt(mg)) : "")
  }

  // Submitted by hand rather than through <form action>, which would clear the fields when the
  // server sends back a validation error.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await action(form)
      if (result?.error) setError(result.error)
    })
  }

  const nutrientInput = (key: NutrientKey, label: string, unit: string, extra?: Partial<React.ComponentProps<"input">>) => (
    <label key={key} className="grid gap-1 text-xs font-bold text-muted-foreground">
      <span>
        {label} <span className="font-semibold">({unit})</span>
      </span>
      <input
        name={`n.${key}`}
        inputMode="decimal"
        autoComplete="off"
        defaultValue={initial.nutrients[key] ?? ""}
        placeholder={t("no data")}
        className={cn(field, "text-right tabular-nums text-foreground placeholder:font-medium placeholder:italic")}
        {...extra}
      />
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <section className="surface grid gap-4 rounded-3xl p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-bold">
            {t("Name")}
            <input
              name="name"
              defaultValue={initial.name}
              required
              maxLength={120}
              placeholder={t("e.g. Semi-skimmed milk")}
              className={cn(field, "h-11 text-base font-extrabold")}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            {t("Brand or store (optional)")}
            <input name="brand" defaultValue={initial.brand} maxLength={80} className={cn(field, "h-11")} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-bold">
            {t("Category")}
            <select name="category" defaultValue={initial.category} className={field}>
              <option value="">{t("Other")}</option>
              {CUSTOM_FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(c)}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="grid gap-1.5 text-sm font-bold">
            <legend className="mb-1.5">{t("Allergens")}</legend>
            {ALLERGENS.map((a) => (
              <label key={a} className="flex items-center gap-2 font-semibold">
                <input type="checkbox" name="allergen" value={a} defaultChecked={initial.allergens.includes(a)} className="size-4" />
                {t("Contains {allergens}", { allergens: t(a) })}
              </label>
            ))}
          </fieldset>
        </div>
      </section>

      <section aria-labelledby="label-h" className="surface grid gap-4 rounded-3xl p-5">
        <div className="grid gap-1">
          <h2 id="label-h" className="text-lg font-extrabold">
            {t("Nutrition label")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("Copy the values from the package. When the label says 0 or “no significant amount”, enter 0. Leave a field blank only when the label doesn't list it: blank means no data, not zero.")}
          </p>
        </div>
        <label className="flex flex-wrap items-center gap-2 text-sm font-bold">
          {t("Values are per")}
          <input
            name="basisGrams"
            inputMode="decimal"
            defaultValue="100"
            required
            aria-describedby="basis-hint"
            className={cn(field, "w-24 text-right tabular-nums")}
          />
          g
        </label>
        <p id="basis-hint" className="-mt-2 text-xs text-muted-foreground">
          {t("Use 100 for the “per 100 g” column, or the serving size in grams for the “per serving” column. For milk and other drinks, 100 ml weighs about 100 g.")}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {LABEL_KEYS.map((key) => {
            const n = NUTRIENTS.find((x) => x.key === key)!
            return nutrientInput(key, t(n.name), n.unit)
          })}
          <label className="grid gap-1 text-xs font-bold text-muted-foreground">
            <span>
              {t("Salt")} <span className="font-semibold">(g)</span>
            </span>
            <input
              name="salt"
              inputMode="decimal"
              autoComplete="off"
              value={salt}
              onChange={(e) => onSalt(e.target.value)}
              placeholder={t("no data")}
              className={cn(field, "text-right tabular-nums text-foreground placeholder:font-medium placeholder:italic")}
            />
          </label>
          {nutrientInput("sodium", t("Sodium"), "mg", { value: sodium, defaultValue: undefined, onChange: (e) => onSodium(e.target.value) })}
        </div>

        <details open={moreFilled} className="group grid gap-3">
          <summary className="cursor-pointer text-sm font-bold text-primary">{t("More nutrients (vitamins, minerals, fats)")}</summary>
          {(["macros", "fats", "minerals", "vitamins"] as const).map((group) => {
            const list = MORE.filter((n) => n.group === group)
            if (!list.length) return null
            return (
              <fieldset key={group} className="mt-3 grid gap-2">
                <legend className="mb-2 text-sm font-extrabold">{t(NUTRIENT_GROUP_LABELS[group])}</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((n) => nutrientInput(n.key, t(n.name), n.unit))}
                </div>
              </fieldset>
            )
          })}
        </details>
      </section>

      <section aria-labelledby="portions-h" className="surface grid gap-3 rounded-3xl p-5">
        <div className="grid gap-1">
          <h2 id="portions-h" className="text-lg font-extrabold">
            {t("Portions")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("Optional shortcuts for adding the food, e.g. “1 glass” = 250 g.")}</p>
        </div>
        <ul className="grid gap-2">
          {portions.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                name="portionLabel"
                aria-label={t("Portion name")}
                value={p.label}
                maxLength={60}
                placeholder={t("e.g. 1 glass")}
                onChange={(e) => setPortions(portions.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                className={cn(field, "min-w-0 flex-1")}
              />
              <input
                name="portionGrams"
                aria-label={t("Portion weight in grams")}
                inputMode="decimal"
                value={p.grams}
                placeholder="250"
                onChange={(e) => setPortions(portions.map((x, j) => (j === i ? { ...x, grams: e.target.value } : x)))}
                className={cn(field, "w-24 text-right tabular-nums")}
              />
              <span className="text-xs font-semibold text-muted-foreground">g</span>
              <button
                type="button"
                aria-label={t("Remove portion")}
                onClick={() => setPortions(portions.length > 1 ? portions.filter((_, j) => j !== i) : [{ label: "", grams: "" }])}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        {portions.length < 12 ? (
          <Button
            type="button"
            variant="outline"
            className="justify-self-start"
            onClick={() => setPortions([...portions, { label: "", grams: "" }])}
          >
            <Plus aria-hidden />
            {t("Add a portion")}
          </Button>
        ) : null}
      </section>

      {error ? (
        <p role="alert" className="rounded-2xl bg-warn-soft px-4 py-3 text-sm font-bold text-warn">
          {t(error)}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="justify-self-start">
        {pending ? t("Saving…") : submitLabel}
      </Button>
    </form>
  )
}
