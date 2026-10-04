/**
 * Allergen tagging by name. USDA generic foods carry no allergen labels, so we match the
 * description. This is a convenience, not a safety guarantee: names can miss ingredients.
 */

export type Allergen = "hazelnut"

const RULES: Record<Allergen, RegExp> = {
  // Filbert is another name for hazelnut; praline and gianduja are usually made with it.
  // Mixed nuts are tagged conservatively because they commonly include filberts.
  hazelnut: /hazelnut|filbert|praline|gianduja|nutella|frangelico|mixed nuts|nuts, mixed/i,
}

export function tagAllergens(description: string): Allergen[] {
  return (Object.keys(RULES) as Allergen[]).filter((a) => RULES[a].test(description))
}
