# Food data

Source: USDA FoodData Central (public domain), generic foods only.

| Dataset | File | Foods kept |
|---|---|---|
| Foundation Foods, April 2026 | `FoodData_Central_foundation_food_csv_2026-04-30.zip` | 401 (newest version of each food) |
| SR Legacy, April 2018 | `FoodData_Central_sr_legacy_food_csv_2018-04.zip` | 7,793 |

## Rebuild the database

1. Download both CSV zips from https://fdc.nal.usda.gov/download-datasets/ into `data/raw/`.
2. Unzip them into `data/raw/foundation/` and `data/raw/sr_legacy/`.
3. Run `npm run data:import` (about 15 s). It rebuilds only the USDA tables in
   `data/meal-app.db`; `data/` is git-ignored.

## What the import does
- Keeps `foundation_food` and `sr_legacy_food` records (Foundation's sample and acquisition
  records are skipped). Foundation republishes some foods under new ids; only the newest is kept.
- Maps USDA nutrient ids to the 40 nutrients in `src/lib/nutrition/nutrients.ts`, with fallbacks
  (energy: 1008, else Atwater specific 2048, else general 2047; fat 1004 else 1085; carbs 1005
  else 1050; sugars 2000 else 1063; folate DFE 1190 else total 1177).
- Missing values stay missing. 91 Foundation records have no energy because they are partial lab
  analyses without protein, fat or carbohydrate either (e.g. dry beans at 0% moisture).
- Adds a food group, a representative color (`src/lib/food/classify.ts`) and allergen tags
  (`src/lib/food/allergens.ts`; hazelnut also matches filbert, praline, gianduja, mixed nuts).
- Builds an FTS5 index on descriptions for search (`src/server/foods.ts`).

# Flavor data

Source: FlavorGraph (Park et al., Scientific Reports 2021), Apache-2.0,
https://github.com/lamypark/FlavorGraph. Files from its `input/` folder, saved in
`data/raw/flavorgraph/` as `nodes.csv`, `edges.csv` and `categories.csv` (the 616-ingredient
"Top300+FDB400+HyperFoods104" list). Import: `npm run data:flavor` (after the USDA import).

- 6,653 ingredients, 1,645 flavor compounds; 111,355 cooked-together scores (recipe
  co-occurrence, 0-1) and 35,440 ingredient-compound links (from FlavorDB).
- Only the 609 curated ingredients are shown. 491 are matched to a USDA food by search;
  `scripts/flavor-overrides.json` fixes wrong matches (slug -> FDC id, or null for none).
  `data/flavor-matches.csv` lists every match for review.
- Shared aromas are weighted by rarity (idf) and ranked by cosine overlap, so compound-rich
  foods don't win by size.
- 176 of the 400 ingredients with compound data have a generic placeholder profile (near
  identical to 5+ others, e.g. abalone, acorn, agave). They are left out of aroma pairings;
  224 ingredients have specific profiles. Bakery, dishes and "ETC" are also excluded from aroma
  pairings because they inherit their base ingredient's compounds.

