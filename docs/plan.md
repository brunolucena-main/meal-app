# Build plan

Personal web app, run locally on a PC in a desktop browser. Two halves: meal planning against
nutrition goals, and a creative cooking section (flavor pairing, ingredient comparison).

Work happens in sessions, split into ~15-minute chunks. Each chunk ends with a progress check.

| # | Session | Status |
|---|---|---|
| 1 | Project setup + design system | In progress |
| 2 | USDA data + food search | |
| 3 | Comparison engine + Compare screen | |
| 4 | Targets, substitutes, goal ranking, allergy filter | |
| 5 | Recipes + reusable meals | |
| 6 | Planner, log, shopping list | |
| 7 | Creative I: FlavorGraph import + pairing explorer | |
| 8 | Creative II: graph, bridges, flavor-aware substitutes | |
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
