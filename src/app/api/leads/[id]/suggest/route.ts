import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { and, eq, desc } from "drizzle-orm"
import { generateMessage } from "@/lib/openai"
import { getSessionUserId } from "@/lib/session"
import type { Activity } from "@/db/schema"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { type, intent } = await req.json()

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.userId, userId)))
    .limit(1)
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  const recentActivity = await db
    .select()
    .from(activities)
    .where(eq(activities.leadId, id))
    .orderBy(desc(activities.timestamp))
    .limit(5)

  const lastInbound = recentActivity.find((a: Activity) => a.direction === "inbound")

  try {
    const message = await generateMessage({
      leadName: lead.name,
      source: lead.source,
      status: lead.status,
      lastMessage: lastInbound?.message ?? null,
      type: type ?? "sms",
      intent: intent ?? (lead.status === "replied" ? "reply" : "follow_up"),
    }, userId)
    return NextResponse.json({ message })
  } catch (err) {
    console.error("AI suggest failed:", err)
    return NextResponse.json({ error: "Failed to generate message" }, { status: 500 })
  }
}
