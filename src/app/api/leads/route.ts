import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { sendSms } from "@/lib/twilio"
import { generateMessage } from "@/lib/openai"
import { asc, sql } from "drizzle-orm"

const STATUS_PRIORITY = sql`CASE status
  WHEN 'replied' THEN 1
  WHEN 'new' THEN 2
  WHEN 'contacted' THEN 3
  WHEN 'closed' THEN 4
  ELSE 5
END`

export async function GET() {
  const rows = await db.select().from(leads).orderBy(asc(STATUS_PRIORITY))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, email, source } = body

  if (!name || !phone || !email || !source) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const [lead] = await db.insert(leads).values({ name, phone, email, source }).returning()

  const message = await generateMessage({
    leadName: name,
    source,
    status: "new",
    type: "sms",
    intent: "initial",
  }).catch(() => `Hey ${name}, saw your inquiry — when's a good time to connect?`)

  let smsOutcome: "sent" | "failed" = "sent"
  try {
    await sendSms(phone, message)
  } catch (err) {
    console.error("SMS send failed for lead", lead.id, err)
    smsOutcome = "failed"
  }

  await db.insert(activities).values({
    leadId: lead.id,
    type: "sms",
    direction: "outbound",
    message,
    outcome: smsOutcome,
  })

  return NextResponse.json({ ...lead, smsSent: smsOutcome === "sent" }, { status: 201 })
}
