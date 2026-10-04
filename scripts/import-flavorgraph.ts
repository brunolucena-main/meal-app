/**
 * Imports FlavorGraph (Park et al. 2021, Apache-2.0) into the local database.
 *
 *   npm run data:flavor
 *
 * Expects data/raw/flavorgraph/{nodes,edges,categories}.csv (see docs/data.md). Needs the USDA
 * import first: curated ingredients are matched to USDA foods by search, with manual fixes
 * from scripts/flavor-overrides.json. Writes data/flavor-matches.csv for review.
 */
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import { createClient, type InStatement } from "@libsql/client"
import { parse } from "csv-parse"

import { searchFoods } from "../src/server/foods"

const DIR = path.join(process.cwd(), "data", "raw", "flavorgraph")
const DATABASE_URL = process.env.DATABASE_URL ?? "file:data/meal-app.db"

async function* rows(file: string): AsyncGenerator<Record<string, string>> {
  const parser = createReadStream(path.join(DIR, file)).pipe(parse({ columns: true, bom: true }))
  for await (const row of parser) yield row as Record<string, string>
}

/** "feta_cheese" -> "Feta cheese" */
export function displayName(slug: string) {
  const s = slug.replace(/_/g, " ").trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type Ingredient = { id: number; slug: string; category: string | null; curated: boolean }

async function main() {
  for (const f of ["nodes.csv", "edges.csv", "categories.csv"]) {
    if (!existsSync(path.join(DIR, f))) throw new Error(`Missing ${f} in ${DIR}. See docs/data.md.`)
  }
  const categories = new Map<string, string>()
  for await (const r of rows("categories.csv")) categories.set(r.ingredient, r.category)

  const ingredients = new Map<number, Ingredient>()
  const compounds = new Set<number>()
  for await (const r of rows("nodes.csv")) {
    const id = Number(r.node_id)
    if (r.node_type === "ingredient") {
      ingredients.set(id, { id, slug: r.name, category: categories.get(r.name) ?? null, curated: categories.has(r.name) })
    } else compounds.add(id)
  }

  const ingredientCompounds: [number, number][] = []
  const cooccur: [number, number, number][] = []
  for await (const r of rows("edges.csv")) {
    const a = Number(r.id_1)
    const b = Number(r.id_2)
    if (r.edge_type === "ingr-fcomp") {
      const [ing, comp] = ingredients.has(a) ? [a, b] : [b, a]
      if (ingredients.has(ing) && compounds.has(comp)) ingredientCompounds.push([ing, comp])
    } else if (r.edge_type === "ingr-ingr" && ingredients.has(a) && ingredients.has(b)) {
      cooccur.push([a, b, Number(r.score)])
    }
  }
  const compoundCount = new Map<number, number>()
  for (const [ing] of ingredientCompounds) compoundCount.set(ing, (compoundCount.get(ing) ?? 0) + 1)

  // Rarity weight per compound: a compound most ingredients have says little about pairing.
  const df = new Map<number, number>()
  for (const [, comp] of ingredientCompounds) df.set(comp, (df.get(comp) ?? 0) + 1)
  const withAromas = compoundCount.size
  const idf = new Map([...df].map(([comp, n]) => [comp, Math.log(withAromas / n)]))
  const aromaWeight = new Map<number, number>()
  for (const [ing, comp] of ingredientCompounds) aromaWeight.set(ing, (aromaWeight.get(ing) ?? 0) + idf.get(comp)!)

  // FlavorDB gives many ingredients a placeholder profile copied from a broad group (abalone,
  // acorn and agave share one ~93-compound list). A profile nearly identical (Jaccard >= 0.85)
  // to five or more others is treated as generic and left out of aroma pairings.
  const sets = new Map<number, Set<number>>()
  for (const [ing, comp] of ingredientCompounds) {
    if (!sets.has(ing)) sets.set(ing, new Set())
    sets.get(ing)!.add(comp)
  }
  const generic = new Set<number>()
  for (const [a, A] of sets) {
    let near = 0
    for (const [b, B] of sets) {
      if (a === b) continue
      let shared = 0
      for (const x of A) if (B.has(x)) shared++
      if (shared / (A.size + B.size - shared) >= 0.85) near++
    }
    if (near >= 5) generic.add(a)
  }

  // Match curated ingredients to USDA foods. Overrides: { "slug": fdcId | null }.
  const overridesFile = path.join(process.cwd(), "scripts", "flavor-overrides.json")
  const overrides: Record<string, number | null> = existsSync(overridesFile)
    ? JSON.parse(readFileSync(overridesFile, "utf8"))
    : {}
  const matches = new Map<number, { foodId: number | null; description: string; how: string }>()
  for (const ing of ingredients.values()) {
    if (!ing.curated) continue
    if (ing.slug in overrides) {
      matches.set(ing.id, { foodId: overrides[ing.slug], description: "", how: "override" })
      continue
    }
    const [hit] = await searchFoods(ing.slug.replace(/_/g, " "), 1)
    matches.set(ing.id, hit ? { foodId: hit.id, description: hit.description, how: "search" } : { foodId: null, description: "", how: "none" })
  }

  const client = createClient({ url: DATABASE_URL })
  await client.executeMultiple(`
    DROP TABLE IF EXISTS flavor_cooccur;
    DROP TABLE IF EXISTS flavor_compound_weights;
    DROP TABLE IF EXISTS flavor_compounds;
    DROP TABLE IF EXISTS flavor_ingredients;
    CREATE TABLE flavor_ingredients (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      curated INTEGER NOT NULL,
      compound_count INTEGER NOT NULL,
      aroma_weight REAL NOT NULL,
      aroma_generic INTEGER NOT NULL,
      food_id INTEGER
    );
    CREATE TABLE flavor_compound_weights (
      compound_id INTEGER PRIMARY KEY,
      idf REAL NOT NULL
    );
    CREATE TABLE flavor_compounds (
      ingredient_id INTEGER NOT NULL,
      compound_id INTEGER NOT NULL,
      PRIMARY KEY (ingredient_id, compound_id)
    ) WITHOUT ROWID;
    CREATE INDEX flavor_compounds_compound ON flavor_compounds (compound_id);
    CREATE TABLE flavor_cooccur (
      a INTEGER NOT NULL,
      b INTEGER NOT NULL,
      score REAL NOT NULL,
      PRIMARY KEY (a, b)
    ) WITHOUT ROWID;
  `)

  const statements: InStatement[] = []
  for (const ing of ingredients.values()) {
    statements.push({
      sql: "INSERT INTO flavor_ingredients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        ing.id,
        ing.slug,
        displayName(ing.slug),
        ing.category,
        ing.curated ? 1 : 0,
        compoundCount.get(ing.id) ?? 0,
        aromaWeight.get(ing.id) ?? 0,
        generic.has(ing.id) ? 1 : 0,
        matches.get(ing.id)?.foodId ?? null,
      ],
    })
  }
  for (const [ing, comp] of ingredientCompounds) {
    statements.push({ sql: "INSERT OR IGNORE INTO flavor_compounds VALUES (?, ?)", args: [ing, comp] })
  }
  for (const [comp, weight] of idf) {
    statements.push({ sql: "INSERT INTO flavor_compound_weights VALUES (?, ?)", args: [comp, weight] })
  }
  // Store both directions so lookups only need one index.
  for (const [a, b, score] of cooccur) {
    statements.push({ sql: "INSERT OR REPLACE INTO flavor_cooccur VALUES (?, ?, ?)", args: [a, b, score] })
    statements.push({ sql: "INSERT OR REPLACE INTO flavor_cooccur VALUES (?, ?, ?)", args: [b, a, score] })
  }
  for (let i = 0; i < statements.length; i += 5000) await client.batch(statements.slice(i, i + 5000), "write")

  const report = [["slug", "category", "fdc_id", "usda_description", "how"].join(",")]
  for (const ing of [...ingredients.values()].filter((i) => i.curated).sort((a, b) => a.slug.localeCompare(b.slug))) {
    const m = matches.get(ing.id)!
    report.push([ing.slug, ing.category ?? "", m.foodId ?? "", `"${m.description.replace(/"/g, '""')}"`, m.how].join(","))
  }
  writeFileSync(path.join(process.cwd(), "data", "flavor-matches.csv"), report.join("\n"))

  const matched = [...matches.values()].filter((m) => m.foodId !== null).length
  console.log(
    `FlavorGraph: ${ingredients.size} ingredients (${matches.size} curated, ${matched} matched to USDA), ` +
      `${ingredientCompounds.length} ingredient-compound links (${sets.size - generic.size} specific aroma profiles, ` +
      `${generic.size} generic), ${cooccur.length} co-occurrence pairs.`
  )
  client.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
