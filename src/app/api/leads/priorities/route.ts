import { NextResponse } from "next/server"
import { db } from "@/db"
import { leads } from "@/db/schema"
import { eq } from "drizzle-orm"
import { scoreLeads } from "@/lib/priority-scorer"
import { getSessionUserId } from "@/lib/session"

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db.select().from(leads).where(eq(leads.userId, userId))
  const prioritized = scoreLeads(rows)
  return NextResponse.json(prioritized)
}
