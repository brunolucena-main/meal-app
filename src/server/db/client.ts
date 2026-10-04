import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

import { statSync } from "node:fs"
import path from "node:path"

import { migrate } from "drizzle-orm/libsql/migrator"

import * as schema from "./schema"
import * as userSchema from "./user-schema"

/**
 * Local SQLite file by default. libSQL also speaks to a hosted database (e.g. Turso) through
 * the same URL setting, which keeps the door open for phone access later.
 */
export const DATABASE_URL = process.env.DATABASE_URL ?? "file:data/meal-app.db"

const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> }

// Reuse one client across hot reloads in development.
export const libsql = globalForDb.libsql ?? createClient({ url: DATABASE_URL })
if (process.env.NODE_ENV !== "production") globalForDb.libsql = libsql

export const db = drizzle({ client: libsql, schema: { ...schema, ...userSchema } })

const MIGRATIONS = path.join(process.cwd(), "drizzle")
const globalForMigrations = globalThis as unknown as { migrated?: { key: number; done: Promise<void> } }

/**
 * Applies pending user-table migrations. Runs once per server process, and again when the
 * migration journal changes (a new migration added while the dev server is running).
 * Await before touching user data.
 */
export function ensureMigrated(): Promise<void> {
  const key = statSync(path.join(MIGRATIONS, "meta", "_journal.json")).mtimeMs
  if (globalForMigrations.migrated?.key !== key) {
    globalForMigrations.migrated = { key, done: migrate(db, { migrationsFolder: MIGRATIONS }) }
  }
  return globalForMigrations.migrated.done
}
