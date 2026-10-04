@AGENTS.md

# Meal App

Personal nutrition planner + creative cooking app. Single user, runs locally on a PC
(`npm run dev`, http://localhost:3000). Progress and session plan: `docs/plan.md`.

## Decisions (from the user, don't re-ask)
- Desktop browser first; keep it easy to add phone support later (responsive layout,
  data access behind a server layer, DB driver that can move to a hosted libSQL later).
- Metric units, English UI.
- Food data: USDA FoodData Central (Foundation Foods + SR Legacy), imported from bulk files.
- Flavor data: FlavorGraph (Apache-2.0), open data only, no AI/LLM calls.
- Potential hazelnut allergy: hide hazelnut-tagged foods from suggestions, warn (not block)
  when added manually. Synonyms include filbert, praline, gianduja.
- Comparison engine is the core: per 100 g / per 100 kcal / per serving / % of targets;
  missing values are never treated as zero.

## Design system
- Base "Calm Coach": tokens in `src/app/globals.css`, Manrope, pill buttons, rounded
  cards (rounded-3xl), thick bars, plain-language status (always word + color).
- Creative section: mix of Editorial (Newsreader headlines) and Market Expressive
  (Bricolage Grotesque, produce tonal containers). No illustrated ingredients: use a
  representative color + light styling, kept compact.
- Creative copy voice: how a chef with some artistic flair talks. Practical kitchen knowledge
  (technique, timing, why it works) said with a light touch. Cultural references only where
  they fit naturally (e.g. Greek spanakopita, Catalan spinach with pine nuts); must be accurate.
  Not flowery or forced.
- Creative look: under review. Four alternatives on `/design` (Lab labels / Flavour thesaurus /
  Big type / Gallery) in `src/app/design/creative-alts/`. Ingredient chips stay.
- Creative backgrounds tint themselves from the ingredients on screen
  (`src/components/creative/creative-backdrop.tsx`: field / market / rings).
- Living style guide at `/design`.

## Working agreement
- Work in ~15-minute chunks; stop after each with a short progress report.
- Commit at the end of each chunk.
