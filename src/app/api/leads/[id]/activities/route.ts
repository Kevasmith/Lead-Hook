import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { and, eq, desc } from "drizzle-orm"
import { getSessionUserId } from "@/lib/session"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Verify ownership before returning activities
  const [lead] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.userId, userId)))
    .limit(1)
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.leadId, id))
    .orderBy(desc(activities.timestamp))
  return NextResponse.json(rows)
}
