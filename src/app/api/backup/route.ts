import { isoDate } from "@/lib/nutrition/day"
import { exportData } from "@/server/backup"

/** GET /api/backup: downloads all user data as a JSON file. */
export async function GET() {
  const backup = await exportData()
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="meal-app-backup-${isoDate(new Date())}.json"`,
      "Cache-Control": "no-store",
    },
  })
}
