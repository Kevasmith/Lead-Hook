import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/resend"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { subject, message } = await req.json()

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
  }

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1)
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  let outcome: "sent" | "failed" = "sent"
  try {
    await sendEmail(
      lead.email,
      subject,
      `<p>${message.replace(/\n/g, "<br/>")}</p>`
    )
  } catch (err) {
    console.error("Email send failed:", err)
    outcome = "failed"
  }

  await db.insert(activities).values({
    leadId: id,
    type: "email",
    direction: "outbound",
    message: `[${subject}] ${message}`,
    outcome,
  })

  await db.update(leads).set({ lastContactedAt: new Date() }).where(eq(leads.id, id))
  return NextResponse.json({ outcome })
}
