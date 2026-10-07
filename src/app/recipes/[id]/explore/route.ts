import { NextResponse, type NextRequest } from "next/server"

import { COOKING_COOKIE } from "@/server/cooking"

/**
 * Opens a flavor page "for this recipe": remembers the recipe (so ingredients there get an add
 * button) and goes to `to`, e.g. /recipes/7/explore?to=/pairings?i=42.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/recipes/[id]/explore">) {
  const { id } = await ctx.params
  const to = request.nextUrl.searchParams.get("to") ?? ""
  // Only paths inside the app.
  const target = to.startsWith("/") && !to.startsWith("//") ? to : "/pairings"
  const response = NextResponse.redirect(new URL(target, request.url))
  if (/^\d+$/.test(id)) response.cookies.set(COOKING_COOKIE, id, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 })
  return response
}
