import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { sendSms } from "@/lib/twilio"
import { shouldSendFollowUp } from "@/lib/follow-up-scheduler"
import { getSessionUserId } from "@/lib/session"

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { leadId, action } = body

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.userId, userId)))
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  if (action === "cancel") {
    await db
      .update(leads)
      .set({ status: "contacted" })
      .where(and(eq(leads.id, leadId), eq(leads.userId, userId)))
    return NextResponse.json({ message: "Sequence cancelled" })
  }

  if (lead.status === "replied" || lead.status === "closed" || lead.status === "contacted") {
    return NextResponse.json({ message: "Sequence skipped — lead already engaged" })
  }

  const shouldSend = shouldSendFollowUp(lead.createdAt, lead.lastContactedAt, lead.status)
  if (!shouldSend) {
    return NextResponse.json({ message: "No follow-up due today" })
  }

  await sendSms(lead.phone, `Hey ${lead.name}, just following up — any questions?`)

  await db.insert(activities).values({
    leadId: lead.id,
    type: "sms",
    direction: "outbound",
    outcome: "sent",
  })

  await db
    .update(leads)
    .set({ lastContactedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.userId, userId)))

  return NextResponse.json({ message: "Follow-up sent" })
}
