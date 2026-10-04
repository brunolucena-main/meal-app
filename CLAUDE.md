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
- Creative section: SAME look as the rest of the app (same cards, chips, bars), on a
  stylized (flat, wallpaper-like) starry pattern over a very dark purple (`--night`), the same
  color the sidebar's purple section fades into at the bottom; no divider between them.
  Both paint the same viewport-anchored `.night-gradient` (background-attachment: fixed),
  so they line up while scrolling. Phone readiness (session 9): iOS Safari ignores fixed
  backgrounds, so check this there (`src/components/creative/starry-sky.tsx`,
  `CreativeSurface`). On creative routes the sky fills the whole main area (AppShell's
  `creativeRoutes`). The sidebar's lower part is purple, full width down to the bottom, and
  holds the creative links plus tools. Violet (`bg-violet`) is the creative accent for bars.
  Full-page preview: `/design/creative`.
- Ingredients: color chips with food-group textures (`src/components/food/ingredient-chip.tsx`).
  No illustrations.
- Creative copy: on hold. Show information only (names, numbers, short factual labels). If prose
  returns later: a chef's voice with some flair, accurate cultural references only where natural.
- Living style guide at `/design`.

## Working agreement
- Work in ~15-minute chunks; stop after each with a short progress report.
- Commit at the end of each chunk.
