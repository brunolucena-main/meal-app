import { eq } from "drizzle-orm"
import { connection } from "next/server"

import { DEFAULT_PROFILE, resolveTargets, upperLimits, type Profile, type Targets } from "@/lib/nutrition/targets"
import { db, ensureMigrated } from "@/server/db/client"
import { settings } from "@/server/db/user-schema"

export type Settings = {
  profile: Profile
  profileSaved: boolean
  overrides: Targets
  allergies: string[]
  /** Computed targets with overrides applied. */
  targets: Targets
  upperLimits: Targets
}

// The user mentioned a potential hazelnut allergy, so it starts on the list.
const DEFAULT_ALLERGIES = ["hazelnut"]

export async function getSettings(): Promise<Settings> {
  // Settings change at runtime: never prerender a page that reads them.
  await connection()
  await ensureMigrated()
  const row = (await db.select().from(settings).where(eq(settings.id, 1)).limit(1))[0]
  const profile = { ...DEFAULT_PROFILE, ...(row?.profile ?? {}) }
  const overrides = row?.targetOverrides ?? {}
  return {
    profile,
    profileSaved: row?.profileSaved ?? false,
    overrides,
    allergies: row?.allergies ?? DEFAULT_ALLERGIES,
    targets: resolveTargets(profile, overrides),
    upperLimits: upperLimits(profile.age),
  }
}

export async function updateSettings(patch: {
  profile?: Profile
  overrides?: Targets
  allergies?: string[]
}): Promise<void> {
  const current = await getSettings()
  const next = {
    id: 1,
    profile: patch.profile ?? current.profile,
    targetOverrides: patch.overrides ?? current.overrides,
    allergies: patch.allergies ?? current.allergies,
    profileSaved: current.profileSaved || patch.profile !== undefined,
    updatedAt: new Date(),
  }
  await db.insert(settings).values(next).onConflictDoUpdate({ target: settings.id, set: next })
}
