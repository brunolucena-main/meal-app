// Lists user-facing English text in .tsx files that isn't wrapped in t(...).
//   node scripts/i18n-scan.mjs            -> untranslated text
//   node scripts/i18n-scan.mjs --keys     -> every literal key passed to t("...")
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

const root = path.join(process.cwd(), "src")
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full)
    else if (/\.(tsx|ts)$/.test(name) && !/\.test\.ts$/.test(name)) files.push(full)
  }
}
walk(root)

if (process.argv.includes("--keys")) {
  const keys = new Set()
  for (const f of files) {
    for (const m of readFileSync(f, "utf8").matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(m[1])
  }
  console.log(JSON.stringify([...keys].sort(), null, 1))
  process.exit(0)
}

for (const f of files.filter((f) => f.endsWith(".tsx"))) {
  const lines = readFileSync(f, "utf8").split("\n")
  lines.forEach((line, i) => {
    const t = line.trim()
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("import")) return
    const hits = []
    // JSX text on its own line: starts with a letter, no code characters.
    if (/^[A-Z][^{}<>=;]*$/.test(t) && !/^(const|let|return|export|function|type|if|else)\b/.test(t)) hits.push(t)
    // Inline JSX text: >Some words<
    for (const m of line.matchAll(/>([^<>{}]*[A-Za-z]{2,}[^<>{}]*)</g)) if (/[a-z]/.test(m[1])) hits.push(m[1].trim())
    // Literal attributes people read.
    for (const m of line.matchAll(/\b(aria-label|placeholder|title|label|alt)="([^"]*[A-Za-z][^"]*)"/g)) hits.push(`${m[1]}="${m[2]}"`)
    if (hits.length) console.log(`${path.relative(process.cwd(), f).split(path.sep).join("/")}:${i + 1}: ${hits.join(" | ")}`)
  })
}
