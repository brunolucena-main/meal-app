import { formatAmount } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getT } from "@/server/i18n"

export { formatAmount }

export type TargetStatus = "under" | "on" | "over"

const fillByStatus: Record<TargetStatus, string> = {
  under: "bg-primary",
  on: "bg-good",
  over: "bg-bad",
}

const textByStatus: Record<TargetStatus, string> = {
  under: "text-muted-foreground",
  on: "text-good",
  over: "text-bad",
}

const statusLabel: Record<TargetStatus, string> = {
  under: "Below target",
  on: "On target",
  over: "Over limit",
}

/** Status for a nutrient you want to reach (protein, fiber, magnesium...). */
export function statusForGoal(value: number, target: number, upperLimit?: number): TargetStatus {
  if (upperLimit !== undefined && value > upperLimit) return "over"
  return value >= target * 0.9 ? "on" : "under"
}

/** Status for a nutrient you want to stay under (sodium, saturated fat...). */
export function statusForLimit(value: number, limit: number): TargetStatus {
  return value > limit ? "over" : "on"
}

export async function TargetBar({
  label,
  value,
  target,
  unit,
  status,
  className,
}: {
  label: string
  value: number
  target: number
  unit: string
  status: TargetStatus
  className?: string
}) {
  const t = await getT()
  const pct = target > 0 ? (value / target) * 100 : 0
  const statusText = t(statusLabel[status])
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-bold">{label}</span>
        <span className="tabular text-muted-foreground">
          <span className="font-bold text-foreground">{formatAmount(value)}</span> / {formatAmount(target)} {unit}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={t("{pct}% of target, {status}", { pct: Math.round(pct), status: statusText.toLowerCase() })}
        className="h-2.5 overflow-hidden rounded-full bg-track"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", fillByStatus[status])}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold", textByStatus[status])}>
        {Math.round(pct)}% · {statusText}
      </span>
    </div>
  )
}
