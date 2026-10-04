# Meal App

A personal nutrition planner and creative cooking companion that runs on your own computer.

- **Plan and log**: a Today screen, a week planner, a food log and a shopping list built from
  the plan.
- **Know your food**: 8,000+ USDA foods with up to 40 nutrients each, compared side by side
  per 100 g, per 100 kcal or per serving, against your own daily targets.
- **Find better options**: nutritional substitutes ("like spinach, but more protein") and the
  best sources for whatever you're short on today.
- **Cook creatively**: flavor pairings, taste opposites, bridges between ingredients and a
  flavor map, from FlavorGraph's recipe and aroma data.

## Run it

Needs Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### First-time data setup

The food and flavor data are downloaded once and imported into `data/meal-app.db` (git-ignored).
See [docs/data.md](docs/data.md) for the download links, then:

```bash
npm run data:import   # USDA FoodData Central, about 15 s
npm run data:flavor   # FlavorGraph, needs the USDA import first
```

Your own data (profile, recipes, plans, logs) lives in the same database file. Download a backup
from the **Backup** page now and then.

## Develop

```bash
npm test              # unit tests (vitest)
npx tsc --noEmit      # type check
npx eslint src scripts
npm run db:generate   # after editing src/server/db/user-schema.ts
```

- Plan and progress: [docs/plan.md](docs/plan.md)
- Data sources and import details: [docs/data.md](docs/data.md)
- Open questions: [docs/questions.md](docs/questions.md)
- Style guide: [docs/design-system.html](docs/design-system.html) (open in a browser)

## Data sources

- USDA FoodData Central (Foundation Foods, SR Legacy): public domain.
- FlavorGraph (Park et al., Scientific Reports 2021): Apache-2.0.
- Daily targets: Mifflin-St Jeor energy equation, NIH Dietary Reference Intakes, Dietary
  Guidelines for Americans.

Nutrition figures are estimates from public data. Allergen flags come from food names and can
miss ingredients: treat them as a helper, not a guarantee.
