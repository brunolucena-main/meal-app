import { defineConfig } from "drizzle-kit"

// Only user tables are migrated; USDA tables come from scripts/import-usda.ts.
export default defineConfig({
  dialect: "turso",
  schema: "./src/server/db/user-schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "file:data/meal-app.db" },
})
