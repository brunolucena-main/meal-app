import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

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

const globalForMigrations = globalThis as unknown as { migrated?: Promise<void> }

/** Applies pending user-table migrations once per server process. Await before touching user data. */
export function ensureMigrated(): Promise<void> {
  globalForMigrations.migrated ??= migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") })
  return globalForMigrations.migrated
}
