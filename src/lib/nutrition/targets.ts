/**
 * Personal daily targets from a profile.
 *
 * Energy: Mifflin-St Jeor resting energy x activity factor, adjusted for the goal.
 * Macros: protein from g per kg body weight, fat as a share of energy, carbohydrate the rest.
 * Fiber 14 g per 1,000 kcal; saturated fat and added sugars under 10% of energy (Dietary
 * Guidelines for Americans). Vitamins and minerals: NIH Dietary Reference Intakes for adults
 * (RDA, or AI where no RDA exists), by sex and age band.
 *
 * Upper limits (UL) are listed only where they apply to total intake from food, not just
 * supplements, so they can warn about food choices.
 */
import type { NutrientKey } from "./nutrients"

export type Sex = "female" | "male"
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active"
export type Goal = "lose" | "maintain" | "gain"

export type Profile = {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: Activity
  goal: Goal
  /** Grams of protein per kg of body weight. */
  proteinPerKg: number
  /** Share of energy from fat, 0-1. */
  fatShare: number
}

export const DEFAULT_PROFILE: Profile = {
  sex: "male",
  age: 35,
  heightCm: 175,
  weightKg: 75,
  activity: "moderate",
  goal: "maintain",
  proteinPerKg: 1.4,
  fatShare: 0.3,
}

export const ACTIVITY_FACTORS: Record<Activity, { factor: number; label: string }> = {
  sedentary: { factor: 1.2, label: "Sedentary: desk job, little exercise" },
  light: { factor: 1.375, label: "Light: exercise 1-3 days a week" },
  moderate: { factor: 1.55, label: "Moderate: exercise 3-5 days a week" },
  active: { factor: 1.725, label: "Active: hard exercise 6-7 days a week" },
  very_active: { factor: 1.9, label: "Very active: physical job plus training" },
}

export const GOAL_ADJUSTMENT: Record<Goal, { factor: number; label: string }> = {
  lose: { factor: 0.85, label: "Lose weight (15% under maintenance)" },
  maintain: { factor: 1, label: "Maintain weight" },
  gain: { factor: 1.1, label: "Gain weight (10% over maintenance)" },
}

export type Targets = Partial<Record<NutrientKey, number>>

export function restingEnergy(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age
  return p.sex === "male" ? base + 5 : base - 161
}

export function energyTarget(p: Profile): number {
  return restingEnergy(p) * ACTIVITY_FACTORS[p.activity].factor * GOAL_ADJUSTMENT[p.goal].factor
}

type Band = "19-30" | "31-50" | "51-70" | "71+"

function band(age: number): Band {
  if (age <= 30) return "19-30"
  if (age <= 50) return "31-50"
  if (age <= 70) return "51-70"
  return "71+"
}

/** NIH DRIs for adults: RDA where set, otherwise AI. */
function micronutrientTargets(sex: Sex, age: number): Targets {
  const b = band(age)
  const male = sex === "male"
  const older = b === "51-70" || b === "71+"
  return {
    calcium: male ? (b === "71+" ? 1200 : 1000) : older ? 1200 : 1000,
    iron: male || older ? 8 : 18,
    magnesium: male ? (b === "19-30" ? 400 : 420) : b === "19-30" ? 310 : 320,
    phosphorus: 700,
    potassium: male ? 3400 : 2600,
    zinc: male ? 11 : 8,
    copper: 0.9,
    manganese: male ? 2.3 : 1.8,
    selenium: 55,
    iodine: 150,
    vitA: male ? 900 : 700,
    vitC: male ? 90 : 75,
    vitD: b === "71+" ? 20 : 15,
    vitE: 15,
    vitK: male ? 120 : 90,
    thiamin: male ? 1.2 : 1.1,
    riboflavin: male ? 1.3 : 1.1,
    niacin: male ? 16 : 14,
    pantothenic: 5,
    vitB6: older ? (male ? 1.7 : 1.5) : 1.3,
    folate: 400,
    vitB12: 2.4,
    choline: male ? 550 : 425,
  }
}

/** Tolerable upper intake levels that apply to food, by age band. */
export function upperLimits(age: number): Targets {
  const b = band(age)
  return {
    calcium: b === "19-30" || b === "31-50" ? 2500 : 2000,
    iron: 45,
    phosphorus: b === "71+" ? 3000 : 4000,
    zinc: 40,
    copper: 10,
    manganese: 11,
    selenium: 400,
    iodine: 1100,
    vitC: 2000,
    vitD: 100,
    choline: 3500,
  }
}

/** Computed daily targets. Limit nutrients (sodium, saturated fat...) are ceilings. */
export function computeTargets(p: Profile): Targets {
  const energy = energyTarget(p)
  const protein = p.proteinPerKg * p.weightKg
  const fat = (energy * p.fatShare) / 9
  const carbs = Math.max(0, (energy - protein * 4 - fat * 9) / 4)
  return {
    energy,
    protein,
    fat,
    carbs,
    fiber: (energy / 1000) * 14,
    satFat: (energy * 0.1) / 9,
    addedSugars: (energy * 0.1) / 4,
    sodium: 2300,
    cholesterol: 300,
    ...micronutrientTargets(p.sex, p.age),
  }
}

/** Personal overrides win over computed values. */
export function resolveTargets(p: Profile, overrides: Targets): Targets {
  return { ...computeTargets(p), ...overrides }
}
