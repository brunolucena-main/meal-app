# Build plan

Personal web app, run locally on a PC in a desktop browser. Two halves: meal planning against
nutrition goals, and a creative cooking section (flavor pairing, ingredient comparison).

Work happens in sessions, split into ~15-minute chunks. Each chunk ends with a progress check.

| # | Session | Status |
|---|---|---|
| 1 | Project setup + design system | Done |
| 2 | USDA data + food search | Done |
| 3 | Comparison engine + Compare screen | Done |
| 4 | Targets, substitutes, goal ranking, allergy filter | Done |
| 5 | Recipes + reusable meals | Done |
| 6 | Planner, log, shopping list | Done |
| 7 | Creative I: FlavorGraph import + pairing explorer | Done |
| 8 | Creative II: flavor map, bridges, opposites, flavor-aware substitutes | Done |
| 9 | Polish: backup, speed, accessibility, phone readiness | Done |

## Session log

### Session 1
- Chunk 1: Next.js 16 + Tailwind v4 + shadcn/ui (Base UI) scaffold, git, Calm Coach tokens
  (light + dark), fonts, app shell with sidebar, `/design` style guide part 1.
- Revision: lighter, livelier light theme (teal-tinted near-white ground, more saturated
  series colors, soft tints, white cards with shadow, darker text).
- Revision 2: neutral near-white background, darker body and secondary text.
- Chunk 2: ingredient chips (color + food-group texture, allergen flag in words),
  compact comparison table (amount, % DV, thin series bars, best-value arrows, tooltips,
  "no data" never counted as zero). Series colors validated for color-blind separation
  in both themes.
- Chunk 3: creative register (Editorial x Market): serif headline + italic line, tinted
  pairing cards with expressive numbers, poetic copy with cultural dish references,
  allergen-hidden note, three switchable backgrounds drawn from ingredient colors.
- Revision 3: user not convinced by the B x D creative look. Researched references and built
  four alternatives (Noma Projects labels, The Flavour Thesaurus, Hot & Cool big type,
  The Gourmand gallery). Copy rewritten in a chef's voice.
- Revision 4: creative section uses the base look on a starry night sky with purple details;
  purple sidebar block with Pairings, Opposites, Bridges, Flavor map. Prose copy on hold.
  Opposites added to session 8 (often cooked together, few shared aroma compounds).
- Revision 5: calmer stars; night sky fills the whole main area on creative routes; purple
  sidebar section spans full width to the bottom. Full-page preview at /design/creative.

## Creative features (sessions 7-8)
- Pairs well: ingredients sharing the most flavor compounds (FlavorGraph compound edges).
- Opposites: contrasting tastes that balance each other, the way chefs pair (rich vs acid or
  bitter, sweet vs salty or sour, spicy vs cooling). Needs a small taste profile per
  ingredient: seeded from USDA proxies (fat, sugars, sodium) plus hand tags for sour, bitter,
  umami, spicy on the common ingredients. Secondary signal from data: often cooked together
  but few shared aroma compounds (contrast pairing, typical of East Asian cuisines per
  Ahn et al. 2011).
- Bridges: for two ingredients that rarely meet, the ingredients that pair well with both
  (shortest strong paths in the pairing graph).
- Flavor map: the network graph to browse.
- Revision 6: sidebar purple fades to very dark purple at the bottom (behind the theme
  picker); creative background is a flat stylized pattern on that same dark purple; no
  divider beside the purple part. Opposites reworked as taste contrast.
- Revision 7: main creative background follows the sidebar's purple-to-night gradient
  (one shared viewport-anchored gradient).
- Revision 8: rounded corners (28px) where white meets purple: white sidebar block curves into
  the night on creative pages; purple section curves into the light page elsewhere.

### Session 2
- USDA Foundation (Apr 2026) + SR Legacy imported into SQLite via libSQL + Drizzle:
  8,194 foods, ~265k nutrient values, ~14.6k portions, 20 hazelnut-tagged foods. See docs/data.md.
- Nutrient catalog (40 nutrients, FDA Daily Values, goal/limit/info) with id fallbacks.
- /foods: live search with ranking tuned for USDA naming ("Fish, salmon, ...").
- /foods/[id]: full profile per 100 g or per USDA portion, grouped tables, % DV bars,
  "no data" for missing values, allergen warning, link to the FDC page.
- Unit tests (vitest) for nutrient resolution, grouping/colors and allergen tags.

### Session 3
- `src/lib/nutrition/compare.ts`: basis factors (per 100 g / per 100 kcal / per serving), best value
  per nutrient (goal = highest, limit = lowest, 0.5% tie band, missing never wins), % of DV or
  personal targets, win counts over nutrients every food reports, per-food standouts
  ("2.6x the calcium", only where the leader has >= 5% DV and >= 1.5x the runner-up). Tested.
- /compare: up to 4 foods in the URL (?ids=&basis=&portions=&all=1), search-as-you-type picker
  (GET /api/foods/search), basis tabs, portion picker per food for "per serving", summary card,
  key nutrients or all 40, quick-start pairs. Food pages have a Compare button.

### Session 4
- Targets (`src/lib/nutrition/targets.ts`): Mifflin-St Jeor x activity x goal, protein g/kg,
  fat share, carbs remainder, fiber 14 g/1000 kcal, sat fat and added sugars < 10% energy,
  NIH DRIs by sex/age, food-relevant upper limits. /targets page with profile, allergy list
  and per-nutrient overrides. Settings stored in SQLite via Drizzle migrations (/drizzle).
- Food and compare pages measure against personal targets.
- Substitutes (`similarity.ts`): log-compressed share-of-target vectors per 100 g, weighted
  RMS distance -> exp(-d), discounted by shared-nutrient coverage; "more X" (>= +25%) and
  "less Y" (<= -20%) filters; same group or all foods; one row per food. /substitutes?id=.
- Best sources (`ranking.ts`): average capped coverage of chosen nutrients per 100 kcal or
  100 g, penalty for burning sodium / sat fat / added sugar budgets faster than energy.
  /best. Ready to take real daily gaps once logging exists (session 6).
- Allergy filter: hazelnut-tagged foods hidden from substitutes and best sources (count shown),
  flagged on food and compare pages.
- Open questions for Bruno: docs/questions.md.

### Session 5
- Recipes and reusable meals (one table, `kind`), ingredients in grams (Drizzle migration 0001).
- `src/lib/nutrition/recipe.ts`: totals by weight, per serving, per 100 g of the cooked dish
  (optional cooked weight); totals are marked partial (shown as >=) when an ingredient lacks
  data, with the ingredients named. Tested.
- /recipes list (meals and recipes, allergen flags) and /recipes/[id] editor: details form,
  ingredient rows with grams and quick USDA portions, add via the shared FoodPicker, live
  nutrition per serving against personal targets.
- Fixes: migrations re-run when the journal changes (new migration while dev server runs);
  replaced next-themes with a small built-in theme script (React 19.2 warned about its
  inline script); search requires whole words in name parts ("milk" no longer finds milkfish).

### Session 6
- Entries table: one row per planned or eaten item (food in grams or recipe in servings), by
  date and slot; shopping check marks per week (migration 0002).
- `src/lib/nutrition/day.ts`: eaten / planned / projected totals, partial markers, remaining
  gaps for goal nutrients (unknowns skipped once something is logged), local date helpers.
- Today (home) and /log/[date]: energy card (eaten solid, planned light), target bars,
  biggest gaps with a link to Best sources ranked by that day's gaps, four meal slots, tick to
  log, edit amounts, add foods or saved meals, copy a day as planned. /log lists logged days.
- /plan: week grid (Mon-Sun) with projected energy per day and weekly averages.
- /shopping: the week's planned items with recipes expanded into ingredients, grouped by USDA
  category, grams plus approximate USDA portions, tick-off that persists.

### Session 7
- FlavorGraph import (`scripts/import-flavorgraph.ts`, see docs/data.md): ingredients,
  compound links with rarity weights, co-occurrence; curated ingredients matched to USDA with
  overrides; generic aroma profiles detected and excluded.
- /pairings: ingredient finder (609 curated) and, per ingredient, "Pairs well" (weighted aroma
  overlap) and "Cooked together" (recipe co-occurrence), each showing the other signal too,
  chips colored from the USDA match, link to nutrition, allergens hidden with a count.
- Taste profiles for Opposites moved to session 8, where Opposites is built.

### Session 8
- Taste profiles (`src/lib/flavor/tastes.ts`): sweet/salty/rich from USDA nutrients, sour/
  bitter/savory/hot from whole-word name tags; balancing rules (acid cuts richness, salt and
  sweetness tame bitterness, sweet balances sour, sweet rounds savory, richness cools heat...).
- Flavor graph in memory (`src/server/flavor-graph.ts`): FlavorGraph variants ("pork_chop",
  "lemon_zest") folded into their curated base ingredient, so the median ingredient has 63
  recipe partners instead of a handful (pork: 8 -> 237).
- /opposites: balancing partners ranked by contrast strength x how often recipes combine them.
- /bridges: ingredients cooked with both A and B; two-step chains when no single bridge exists.
- /flavor-map: ego-network SVG on the night sky (closer = cooked together more), click to move.
- Pairings: shared header with tastes and view links; "Swap in" card (same recipe context by
  cosine of co-occurrence profiles, plus nutrition similarity when both match USDA).
- Fixes: theme script via next/script beforeInteractive (React 19.2 warning); explicit
  columns in flavor queries so re-imports don't break a running server.

### Session 9
- Backup: /data page, GET /api/backup (JSON of all user tables), restore with confirmation
  (replaces data in one transaction; foreign or newer files rejected). Round trip tested.
- Accessibility: skip-to-content link, main landmark focusable; labels on all inputs; status
  always shown in words as well as color.
- Phone readiness: below the md breakpoint the sidebar folds behind a Menu button (closes on
  navigation); pages fit at 375 px. Known gap for real phone use: iOS Safari ignores the fixed
  background used by the creative gradient (falls back to a scrolling gradient, still fine).
- README rewritten with setup, data import and development commands.

### After session 9 (hardening)
- Production build passes (`npm run build`); data pages render per request.
- Recipes in use on planned or logged days can't be deleted (keeps logs accurate).
- Backup restores up to 25 MB (server action body limit raised).
- Integration tests against a temp copy of the database (search, recipes, day totals,
  shopping list, delete guard, backup round trip). 58 tests total.
- Today and day pages: "Recent" row under each slot re-adds a recent food or meal at its last
  amount in one click.

## Ideas for later
- Your real profile on the Targets page (see docs/questions.md).
- Barcode / branded foods (Open Food Facts) if packaged foods matter.
- Prose for creative pages when wanted (chef voice; see CLAUDE.md).
- Hosting for phone use: libSQL already supports a hosted database via DATABASE_URL.

### Requested after session 9
- Design system moved out of the app into `docs/design-system.html` (standalone snapshot).
- Spanish interface with an EN/ES switch; number and date formats follow the language. Food
  names stay in English (USDA and FlavorGraph data).

### Custom foods
- Add your own foods by hand (a brand of milk from your store): /foods/new, edit and delete
  from the food page. Stored in a user table (`custom_foods`, migration 0003) so USDA
  re-imports never touch them; ids start above 900,000,000, so they work anywhere a USDA id
  does (search lists them first, recipes, days, shopping, compare, substitutes, best sources).
- Form follows a nutrition label: values per 100 g or per serving (scaled to 100 g), salt and
  sodium kept in sync (salt x 400 = sodium mg), comma decimals, blank = no data. Optional
  portions ("1 glass" = 250 g). Hazelnut tag from a checkbox or the name.
- Deleting is refused while the food is in a recipe or on a day. Included in backups (version 2;
  version 1 files still restore).
