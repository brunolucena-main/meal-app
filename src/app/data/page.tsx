import { CheckCircle2, Download, TriangleAlert, Upload } from "lucide-react"
import type { Metadata } from "next"

import { Button, buttonVariants } from "@/components/ui/button"
import { dataCounts } from "@/server/backup"
import { restoreBackup } from "./actions"
import { getT } from "@/server/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: `${t("Backup")} · Meal App` }
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""

const ERRORS: Record<string, string> = {
  confirm: "Tick the box to confirm that the backup should replace your current data.",
  file: "Choose a backup file first.",
}

export default async function DataPage(props: PageProps<"/data">) {
  const t = await getT()
  const params = await props.searchParams
  const error = one(params.error)
  const restored = one(params.restored) === "1"
  const counts = await dataCounts()

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-8 md:px-10 md:py-12">
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("Backup")}</h1>
        <p className="text-muted-foreground">
          {t("Everything you create lives in one file on this computer")} (<code className="text-sm">data/meal-app.db</code>).{" "}
          {t("Download a backup now and then, and keep it somewhere else.")}
        </p>
      </header>

      {restored ? (
        <p className="flex items-center gap-2 rounded-2xl bg-good-soft px-4 py-3 text-sm font-bold text-good">
          <CheckCircle2 className="size-4" aria-hidden />
          {t("Backup restored.")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-2xl bg-bad-soft px-4 py-3 text-sm font-bold text-bad">
          <TriangleAlert className="size-4" aria-hidden />
          {t(ERRORS[error] ?? error)}
        </p>
      ) : null}

      <section className="surface grid gap-4 rounded-3xl p-5 md:p-6">
        <h2 className="text-lg font-extrabold">{t("Download")}</h2>
        <p className="text-sm text-muted-foreground">
          {counts.profileSaved ? t("Your profile and targets,") : t("Your profile and targets (still the example profile),")}{" "}
          {t("{recipes} recipes and meals, {foods} foods of your own, and {entries} planned or logged items over {days} days.", {
            recipes: counts.recipes,
            foods: counts.customFoods,
            entries: counts.entries,
            days: counts.days,
          })}{" "}
          {t("Food and flavor data are not included: the import scripts rebuild them.")}
        </p>
        <a href="/api/backup" className={buttonVariants({ className: "justify-self-start" })}>
          <Download aria-hidden />
          {t("Download backup")}
        </a>
      </section>

      <form action={restoreBackup} className="surface grid gap-4 rounded-3xl p-5 md:p-6">
        <h2 className="text-lg font-extrabold">{t("Restore")}</h2>
        <p className="text-sm text-muted-foreground">{t("Replaces all your current data with the backup's.")}</p>
        <label className="grid gap-1.5 text-sm font-bold">
          {t("Backup file")}
          <input name="file" type="file" accept="application/json,.json" required className="text-sm font-medium" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="confirm" value="yes" className="size-4 accent-primary" />
          {t("Replace my current data with this backup")}
        </label>
        <Button type="submit" variant="outline" className="justify-self-start">
          <Upload aria-hidden />
          {t("Restore")}
        </Button>
      </form>
    </div>
  )
}
