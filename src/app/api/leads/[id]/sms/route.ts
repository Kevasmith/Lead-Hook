import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendSms } from "@/lib/twilio"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { message } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1)
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  let outcome: "sent" | "failed" = "sent"
  try {
    await sendSms(lead.phone, message)
  } catch (err) {
    console.error("Manual SMS failed:", err)
    outcome = "failed"
  }

  await db.insert(activities).values({
    leadId: id,
    type: "sms",
    direction: "outbound",
    message,
    outcome,
  })

  await db.update(leads).set({ lastContactedAt: new Date() }).where(eq(leads.id, id))
  return NextResponse.json({ outcome })
}
