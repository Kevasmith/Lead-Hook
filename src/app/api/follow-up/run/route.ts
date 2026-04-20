import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { eq, inArray, and } from "drizzle-orm"
import { sendSms } from "@/lib/twilio"
import { sendEmail } from "@/lib/resend"
import { generateMessage } from "@/lib/openai"
import { shouldSendFollowUp } from "@/lib/follow-up-scheduler"

// Day 0 → SMS, Day 1 → SMS, Day 3 → Email, Day 5 → SMS (final nudge)
const SEQUENCE: Array<{ channel: "sms" | "email"; intent: "initial" | "follow_up" | "close" }> = [
  { channel: "sms",   intent: "initial" },
  { channel: "sms",   intent: "follow_up" },
  { channel: "email", intent: "follow_up" },
  { channel: "sms",   intent: "close" },
]

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const activeLeads = await db
    .select()
    .from(leads)
    .where(inArray(leads.status, ["new", "contacted"]))

  const results = { sent: 0, skipped: 0, failed: 0 }

  for (const lead of activeLeads) {
    const shouldSend = shouldSendFollowUp(lead.createdAt, lead.lastContactedAt, lead.status)
    if (!shouldSend) { results.skipped++; continue }

    // Only count outbound messages to determine sequence position
    const outboundActivities = await db
      .select()
      .from(activities)
      .where(and(eq(activities.leadId, lead.id), eq(activities.direction, "outbound")))

    const step = SEQUENCE[Math.min(outboundActivities.length, SEQUENCE.length - 1)]

    // Generate AI message for this step
    const message = await generateMessage({
      leadName: lead.name,
      source: lead.source,
      status: lead.status,
      type: step.channel,
      intent: step.intent,
    }).catch(() => null)

    if (!message) { results.skipped++; continue }

    let outcome: "sent" | "failed" = "sent"
    try {
      if (step.channel === "sms") {
        await sendSms(lead.phone, message)
      } else {
        const subject = step.intent === "follow_up"
          ? `Following up on your inquiry, ${lead.name}`
          : `Checking in, ${lead.name}`
        await sendEmail(
          lead.email,
          subject,
          `<p>${message.replace(/\n/g, "<br/>")}</p>`
        )
      }
      results.sent++
    } catch (err) {
      console.error(`Follow-up ${step.channel} failed for lead ${lead.id}:`, err)
      outcome = "failed"
      results.failed++
    }

    await db.insert(activities).values({
      leadId: lead.id,
      type: step.channel,
      direction: "outbound",
      message,
      outcome,
    })

    await db
      .update(leads)
      .set({ status: "contacted", lastContactedAt: new Date() })
      .where(eq(leads.id, lead.id))
  }

  return NextResponse.json({
    processed: activeLeads.length,
    ...results,
    timestamp: new Date().toISOString(),
  })
}
