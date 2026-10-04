"use server"

import { revalidatePath } from "next/cache"

import { NUTRIENTS } from "@/lib/nutrition/nutrients"
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENT, type Activity, type Goal, type Targets } from "@/lib/nutrition/targets"
import { updateSettings } from "@/server/settings"

function number(form: FormData, key: string, min: number, max: number, fallback: number) {
  const value = Number(form.get(key))
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}

export async function saveProfile(form: FormData) {
  const activity = String(form.get("activity")) as Activity
  const goal = String(form.get("goal")) as Goal
  await updateSettings({
    profile: {
      sex: form.get("sex") === "female" ? "female" : "male",
      // DRIs used here cover adults only.
      age: Math.round(number(form, "age", 19, 100, 35)),
      heightCm: number(form, "heightCm", 120, 230, 175),
      weightKg: number(form, "weightKg", 30, 250, 75),
      activity: activity in ACTIVITY_FACTORS ? activity : "moderate",
      goal: goal in GOAL_ADJUSTMENT ? goal : "maintain",
      proteinPerKg: number(form, "proteinPerKg", 0.6, 3, 1.4),
      fatShare: number(form, "fatPercent", 15, 50, 30) / 100,
    },
    allergies: form.getAll("allergies").map(String),
  })
  revalidatePath("/", "layout")
}

export async function saveOverrides(form: FormData) {
  const overrides: Targets = {}
  for (const n of NUTRIENTS) {
    const raw = String(form.get(`t_${n.key}`) ?? "").trim()
    const value = Number(raw)
    if (raw !== "" && Number.isFinite(value) && value >= 0) overrides[n.key] = value
  }
  await updateSettings({ overrides })
  revalidatePath("/", "layout")
}
