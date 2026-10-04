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
- Living style guide at `/design`.

## Working agreement
- Work in ~15-minute chunks; stop after each with a short progress report.
- Commit at the end of each chunk.
