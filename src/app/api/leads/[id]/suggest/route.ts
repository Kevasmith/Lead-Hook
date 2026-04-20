import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { generateMessage } from "@/lib/openai"
import type { Activity } from "@/db/schema"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { type, intent } = await req.json()

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1)
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  // Get the most recent inbound message for context
  const recentActivity = await db
    .select()
    .from(activities)
    .where(eq(activities.leadId, id))
    .orderBy(desc(activities.timestamp))
    .limit(5)

  const lastInbound = recentActivity.find((a: Activity) => a.direction === "inbound")

  const message = await generateMessage({
    leadName: lead.name,
    source: lead.source,
    status: lead.status,
    lastMessage: lastInbound?.message ?? null,
    type: type ?? "sms",
    intent: intent ?? (lead.status === "replied" ? "reply" : "follow_up"),
  })

  return NextResponse.json({ message })
}
