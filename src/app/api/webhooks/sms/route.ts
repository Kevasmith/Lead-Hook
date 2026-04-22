import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { eq } from "drizzle-orm"
import twilio from "twilio"
import { sendReplyAlert } from "@/lib/alerts"
import { getSettings } from "@/lib/settings"

function twimlResponse(message?: string) {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
  return new NextResponse(body, { headers: { "Content-Type": "text/xml" } })
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-twilio-signature") ?? ""
  const url = `${process.env.BETTER_AUTH_URL}/api/webhooks/sms`
  const body = await req.text()
  const params = Object.fromEntries(new URLSearchParams(body))

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  )

  if (!isValid && process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const fromNumber = params.From
  const messageBody = params.Body?.trim()

  if (!fromNumber) return twimlResponse()

  const [lead] = await db.select().from(leads).where(eq(leads.phone, fromNumber)).limit(1)
  if (!lead) return twimlResponse()

  // Always log the inbound message
  await db.insert(activities).values({
    leadId: lead.id,
    type: "sms",
    direction: "inbound",
    message: messageBody,
    outcome: "replied",
  })

  // Flip status to replied if not already closed
  if (lead.status !== "replied" && lead.status !== "closed") {
    await db
      .update(leads)
      .set({ status: "replied", lastContactedAt: new Date() })
      .where(eq(leads.id, lead.id))

    sendReplyAlert(lead, messageBody ?? "")
  }

  const s = await getSettings(lead.userId)
  const ack = s?.bookingLink
    ? `Got it! An agent will be in touch shortly. Book a time here: ${s.bookingLink}`
    : "Got it! An agent will be in touch with you shortly."

  return twimlResponse(ack)
}
