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
| 5 | Recipes + reusable meals | |
| 6 | Planner, log, shopping list | |
| 7 | Creative I: FlavorGraph import + pairing explorer | |
| 8 | Creative II: flavor map, bridges, opposites, flavor-aware substitutes | |
| 9 | Polish: backup, speed, accessibility, phone readiness | |

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
