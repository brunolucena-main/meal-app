@AGENTS.md

# Meal App

Personal nutrition planner + creative cooking app. Single user, runs locally on a PC
(`npm run dev`, http://localhost:3000). Progress and session plan: `docs/plan.md`.

## Commands
- `npm run dev`: app at http://localhost:3000
- `npm run data:import`: rebuild USDA tables in `data/meal-app.db` (see `docs/data.md`)
- `npm test`: unit tests (vitest); `npx tsc --noEmit` and `npx eslint src scripts` before commits
- The user opens the app from desktop/Start menu shortcuts (`scripts/launch.ps1`): production
  build on port 3001, rebuilt automatically when HEAD changes. Port 3000 stays free for `npm run dev`.

## Code map
- `src/lib/` (pure, unit-tested, no DB):
  - `nutrition/nutrients.ts` 40 nutrients, units, DVs, USDA id fallbacks
  - `nutrition/compare.ts` bases, best values, standouts; `similarity.ts` substitutes;
    `ranking.ts` best sources; `targets.ts` profile -> targets (DRIs); `recipe.ts`; `day.ts`
  - `food/` groups, colors, allergen tags, `custom.ts` (custom food form parsing, id range); `flavor/pairing.ts` aroma overlap; `flavor/tastes.ts`
    taste profiles + balancing rules (opposites, dish tastes, balance gaps); `flavor/guide.ts`
    recipe flavor guide (matching recipe foods to FlavorGraph, ranking additions, bridges)
  - `recipes/variants.ts` recipe families (variants), ingredient diffs
- `src/server/` (DB access): `db/` libSQL + Drizzle (USDA schema + user schema with migrations
  in /drizzle, applied lazily by `ensureMigrated`), `foods.ts` search + portions, `catalog.ts` all
  food profiles (USDA in memory, custom foods read fresh), `custom-foods.ts` (your own foods:
  user table, ids above 900,000,000, merged into every food read), `settings.ts`, `recipes.ts`, `days.ts` (entries, shopping), `backup.ts`,
  `flavor.ts` (FlavorGraph queries), `flavor-graph.ts` (in-memory graph with variants folded:
  opposites, bridges, swaps, map), `flavor-guide.ts` (a recipe's flavor guide), `cooking.ts`
  (cookie: the recipe the flavor pages add to). In-memory caches live on globalThis: restart the
  dev server after re-importing data or changing taste rules.
- `src/app/`: pages per nav item; server actions in `actions.ts` files, `day-actions.ts` and
  `cooking-actions.ts`. `/recipes/[id]/explore?to=...` opens a flavor page for that recipe.
- `scripts/`: `import-usda.ts`, `import-flavorgraph.ts`, `flavor-overrides.json`.
- Tests: `*.test.ts` next to the code; `src/server/server.int.test.ts` runs against a temp
  copy of the database.

## Decisions (from the user, don't re-ask)
- Desktop browser first; keep it easy to add phone support later (responsive layout,
  data access behind a server layer, DB driver that can move to a hosted libSQL later).
- Metric units. English and Spanish UI (EN/ES switch in the sidebar, cookie `lang`).
- Food data: USDA FoodData Central (Foundation Foods + SR Legacy), imported from bulk files.
- Flavor data: FlavorGraph (Apache-2.0), open data only, no AI/LLM calls.
- Potential hazelnut allergy: hide hazelnut-tagged foods from suggestions, warn (not block)
  when added manually. Synonyms include filbert, praline, gianduja.
- Comparison engine is the core: per 100 g / per 100 kcal / per serving / % of targets;
  missing values are never treated as zero.

## Design system
- Base "Calm Coach": tokens in `src/app/globals.css`, Manrope, pill buttons, rounded
  cards (rounded-3xl), thick bars, plain-language status (always word + color).
- Create section (purple sidebar block): Recipes, then Pairings, Opposites, Bridges, Flavor map.
  The flavor pages serve recipes: each recipe has a Flavor guide, and opened from it the flavor
  pages show an "Adding to" bar and + buttons. Recipe pages use the night sky too.
- Creative look: SAME look as the rest of the app (same cards, chips, bars), on a
  stylized (flat, wallpaper-like) starry pattern over a very dark purple (`--night`), the same
  color the sidebar's purple section fades into at the bottom; no divider between them.
  Both paint the same viewport-anchored `.night-gradient` (background-attachment: fixed),
  so they line up while scrolling. Phone readiness (session 9): iOS Safari ignores fixed
  backgrounds, so check this there (`src/components/creative/starry-sky.tsx`,
  `CreativeSurface`). On creative routes the sky fills the whole main area (AppShell's
  `creativeRoutes`). The sidebar's lower part is purple, full width down to the bottom, and
  holds the creative links plus tools. Violet (`bg-violet`) is the creative accent for bars.

- Ingredients: color chips with food-group textures (`src/components/food/ingredient-chip.tsx`).
  No illustrations.
- Creative copy: on hold. Show information only (names, numbers, short factual labels). If prose
  returns later: a chef's voice with some flair, accurate cultural references only where natural.
- Style guide: `docs/design-system.html` (standalone snapshot, open in a browser; not part of the app).

## Translations (English / Spanish)
- English text is the key: `t("Search foods")`. Spanish lives in `src/lib/i18n/es.ts`; missing
  entries fall back to English. Placeholders: `t("{n} items", { n })`.
- Server components: `const t = await getT()` (`src/server/i18n.ts`); client components:
  `const t = useT()` (`src/components/i18n-provider.tsx`).
- Data labels (nutrient names, categories, slots, tastes) are translated at render: `t(n.name)`.
  Food and FlavorGraph ingredient names stay English (they are the database's names).
- Numbers and dates: `formatAmount` / `formatDate` from `src/lib/format.ts` follow the locale.
- `node scripts/i18n-scan.mjs` lists unwrapped interface text; `--keys` lists all keys. Every
  new string needs a Spanish entry.

## Working agreement
- Work in ~15-minute chunks; stop after each with a short progress report.
- Commit at the end of each chunk.
