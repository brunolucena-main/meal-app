import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import type { Profile, Targets } from "@/lib/nutrition/targets"

/*
  User data. Managed by Drizzle migrations (`npm run db:generate` after editing this file;
  migrations in /drizzle are applied automatically on first use). Kept apart from the USDA
  reference schema, which the import script rebuilds.
*/

/** Single-row settings table (id = 1). */
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  profile: text("profile", { mode: "json" }).$type<Profile>().notNull(),
  targetOverrides: text("target_overrides", { mode: "json" }).$type<Targets>().notNull(),
  allergies: text("allergies", { mode: "json" }).$type<string[]>().notNull(),
  /** False until the user saves their own profile; the app then shows example targets. */
  profileSaved: integer("profile_saved", { mode: "boolean" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})
