# Open questions for Bruno

Things I decided on my own while you were away. Each has a default in place; tell me if you
want something different.

1. **Your profile.** Targets use an example profile (male, 35, 175 cm, 75 kg, moderate
   activity, maintain). Enter yours on the Targets page and press "Save profile".
2. **Protein and fat defaults.** Protein 1.4 g per kg of body weight, fat 30% of energy. Both
   are editable on the Targets page.
3. **Hazelnut handling.** Tagged foods are hidden from suggestions (substitutes, best sources,
   later pairings) and flagged with a warning everywhere else. You can untick it on Targets.
4. **Ingredient matches.** FlavorGraph ingredients are linked to USDA foods automatically, with
   35 hand fixes for staples. `data/flavor-matches.csv` lists all 609; some long-tail matches
   will be off. Tell me any you notice and I'll add them to `scripts/flavor-overrides.json`.
5. **Aroma data quality.** Almost half of FlavorGraph's aroma profiles are generic placeholders,
   so "Pairs well" only works for the 224 ingredients with real profiles. "Cooked together"
   covers all 609.

