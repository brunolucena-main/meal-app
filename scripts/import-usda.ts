/**
 * Imports USDA FoodData Central (Foundation Foods + SR Legacy) into the local database.
 *
 *   npm run data:import
 *
 * Expects the unzipped CSV downloads under data/raw/ (see docs/data.md). Rebuilds only the
 * USDA reference tables; any user tables in the same database are left alone.
 */
import { createReadStream, existsSync, readdirSync } from "node:fs"
import path from "node:path"

import { createClient, type InStatement } from "@libsql/client"
import { parse } from "csv-parse"

import { tagAllergens } from "../src/lib/food/allergens"
import { classifyGroup, representativeColor } from "../src/lib/food/classify"
import { NUTRIENTS, resolveNutrients } from "../src/lib/nutrition/nutrients"

const RAW = path.join(process.cwd(), "data", "raw")
const DATABASE_URL = process.env.DATABASE_URL ?? "file:data/meal-app.db"

type Source = { key: "foundation" | "sr_legacy"; folder: string; dataType: string }

const SOURCES: Source[] = [
  { key: "foundation", folder: "foundation", dataType: "foundation_food" },
  { key: "sr_legacy", folder: "sr_legacy", dataType: "sr_legacy_food" },
]

const TRACKED_IDS = new Set<number>(NUTRIENTS.flatMap((n) => [...n.fdcIds]))

/** The single dated folder inside each unzipped download. */
function datasetDir(folder: string) {
  const base = path.join(RAW, folder)
  if (!existsSync(base)) throw new Error(`Missing ${base}. Download and unzip the USDA CSVs first (docs/data.md).`)
  const inner = readdirSync(base, { withFileTypes: true }).find((d) => d.isDirectory())
  return inner ? path.join(base, inner.name) : base
}

async function* rows(file: string): AsyncGenerator<Record<string, string>> {
  const parser = createReadStream(file).pipe(parse({ columns: true, bom: true, relax_column_count: true }))
  for await (const row of parser) yield row as Record<string, string>
}

function portionLabel(row: Record<string, string>, units: Map<string, string>) {
  const amount = Number(row.amount)
  const unit = units.get(row.measure_unit_id)
  const parts: string[] = []
  if (Number.isFinite(amount) && amount > 0) parts.push(String(+amount.toFixed(2)))
  if (unit && unit !== "undetermined") parts.push(unit)
  const detail = [row.portion_description, row.modifier].map((s) => s?.trim()).filter(Boolean).join(", ")
  const label = [parts.join(" "), detail].filter(Boolean).join(" ").replace(/\s+,/g, ",")
  return label || "1 portion"
}

type FoodRow = {
  id: number
  description: string
  source: Source["key"]
  category: string | null
}

async function main() {
  const started = Date.now()
  const foods: FoodRow[] = []
  const amounts = new Map<number, Map<number, number>>()
  const portions: { foodId: number; label: string; gramWeight: number; seq: number }[] = []

  for (const source of SOURCES) {
    const dir = datasetDir(source.folder)
    const categories = new Map<string, string>()
    for await (const r of rows(path.join(dir, "food_category.csv"))) categories.set(r.id, r.description)
    const units = new Map<string, string>()
    for await (const r of rows(path.join(dir, "measure_unit.csv"))) units.set(r.id, r.name)

    // Foundation Foods republishes some foods under a new id; keep only the newest of each.
    const latest = new Map<string, { row: FoodRow; published: string }>()
    for await (const r of rows(path.join(dir, "food.csv"))) {
      if (r.data_type !== source.dataType) continue
      const row: FoodRow = {
        id: Number(r.fdc_id),
        description: r.description.trim(),
        source: source.key,
        category: categories.get(r.food_category_id) ?? null,
      }
      const seen = latest.get(row.description)
      const newer = !seen || r.publication_date > seen.published || (r.publication_date === seen.published && row.id > seen.row.id)
      if (newer) latest.set(row.description, { row, published: r.publication_date })
    }
    const ids = new Set<number>()
    for (const { row } of latest.values()) {
      ids.add(row.id)
      foods.push(row)
    }

    for await (const r of rows(path.join(dir, "food_nutrient.csv"))) {
      const id = Number(r.fdc_id)
      const nutrientId = Number(r.nutrient_id)
      if (!ids.has(id) || !TRACKED_IDS.has(nutrientId) || r.amount === "") continue
      let m = amounts.get(id)
      if (!m) amounts.set(id, (m = new Map()))
      m.set(nutrientId, Number(r.amount))
    }

    const seqByFood = new Map<number, number>()
    for await (const r of rows(path.join(dir, "food_portion.csv"))) {
      const id = Number(r.fdc_id)
      const grams = Number(r.gram_weight)
      if (!ids.has(id) || !(grams > 0)) continue
      const seq = (seqByFood.get(id) ?? 0) + 1
      seqByFood.set(id, seq)
      portions.push({ foodId: id, label: portionLabel(r, units), gramWeight: grams, seq: Number(r.seq_num) || seq })
    }
    console.log(`${source.key}: ${ids.size} foods`)
  }

  const client = createClient({ url: DATABASE_URL })
  await client.executeMultiple(`
    DROP TABLE IF EXISTS foods_fts;
    DROP TABLE IF EXISTS food_portions;
    DROP TABLE IF EXISTS food_nutrients;
    DROP TABLE IF EXISTS foods;
    CREATE TABLE foods (
      id INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      source TEXT NOT NULL,
      category TEXT,
      food_group TEXT NOT NULL,
      color TEXT NOT NULL,
      allergens TEXT,
      energy_kcal REAL,
      protein_g REAL,
      nutrient_count INTEGER NOT NULL
    );
    CREATE TABLE food_nutrients (
      food_id INTEGER NOT NULL,
      nutrient TEXT NOT NULL,
      amount REAL NOT NULL,
      PRIMARY KEY (food_id, nutrient)
    ) WITHOUT ROWID;
    CREATE TABLE food_portions (
      id INTEGER PRIMARY KEY,
      food_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      gram_weight REAL NOT NULL,
      seq INTEGER NOT NULL
    );
    CREATE INDEX food_portions_food ON food_portions (food_id);
    CREATE INDEX food_nutrients_nutrient ON food_nutrients (nutrient, amount);
  `)

  const statements: InStatement[] = []
  let nutrientRows = 0
  for (const f of foods) {
    const resolved = resolveNutrients(amounts.get(f.id) ?? new Map())
    const group = classifyGroup(f.description, f.category)
    const allergens = tagAllergens(f.description)
    const entries = Object.entries(resolved)
    statements.push({
      sql: "INSERT INTO foods VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        f.id,
        f.description,
        f.source,
        f.category,
        group,
        representativeColor(f.description, group),
        allergens.length ? allergens.join(",") : null,
        resolved.energy ?? null,
        resolved.protein ?? null,
        entries.length,
      ],
    })
    for (const [key, amount] of entries) {
      statements.push({ sql: "INSERT INTO food_nutrients VALUES (?, ?, ?)", args: [f.id, key, amount] })
      nutrientRows++
    }
  }
  for (const p of portions) {
    statements.push({
      sql: "INSERT INTO food_portions (food_id, label, gram_weight, seq) VALUES (?, ?, ?, ?)",
      args: [p.foodId, p.label, p.gramWeight, p.seq],
    })
  }

  // One write transaction per chunk keeps memory flat and the import fast.
  const CHUNK = 5000
  for (let i = 0; i < statements.length; i += CHUNK) {
    await client.batch(statements.slice(i, i + CHUNK), "write")
  }

  await client.executeMultiple(`
    CREATE VIRTUAL TABLE foods_fts USING fts5(description, content='foods', content_rowid='id', tokenize='porter unicode61');
    INSERT INTO foods_fts (rowid, description) SELECT id, description FROM foods;
  `)

  const tagged = foods.filter((f) => tagAllergens(f.description).length).length
  console.log(
    `Imported ${foods.length} foods, ${nutrientRows} nutrient values, ${portions.length} portions, ` +
      `${tagged} tagged with an allergen, in ${((Date.now() - started) / 1000).toFixed(1)} s.`
  )
  client.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
