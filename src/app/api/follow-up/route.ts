import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendSms } from "@/lib/twilio"
import { shouldSendFollowUp } from "@/lib/follow-up-scheduler"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { leadId, action } = body // action: "trigger" | "cancel"

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId))
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  if (action === "cancel") {
    await db
      .update(leads)
      .set({ status: "contacted" })
      .where(eq(leads.id, leadId))
    return NextResponse.json({ message: "Sequence cancelled" })
  }

  if (
    lead.status === "replied" ||
    lead.status === "closed" ||
    lead.status === "contacted"
  ) {
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
    .where(eq(leads.id, leadId))

  return NextResponse.json({ message: "Follow-up sent" })
}
