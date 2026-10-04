import { searchFoods } from "@/server/foods"

/** Lightweight food search for pickers: GET /api/foods/search?q=spinach */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? ""
  const foods = await searchFoods(q, 8)
  return Response.json(
    foods.map(({ id, description, color, group, allergens, energyKcal }) => ({
      id,
      description,
      color,
      group,
      allergens,
      energyKcal,
    }))
  )
}
