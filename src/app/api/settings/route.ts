import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { settings } from "@/db/schema"
import { clearSettingsCache } from "@/lib/settings"

export async function GET() {
  const [row] = await db.select().from(settings).limit(1)
  if (!row) return NextResponse.json({})

  // Mask sensitive values — only reveal if set
  return NextResponse.json({
    twilioAccountSid: row.twilioAccountSid ? mask(row.twilioAccountSid) : "",
    twilioAuthToken: row.twilioAuthToken ? "••••••••••••••••" : "",
    twilioFromNumber: row.twilioFromNumber ?? "",
    resendApiKey: row.resendApiKey ? "••••••••••••••••" : "",
    resendFromEmail: row.resendFromEmail ?? "",
    openaiApiKey: row.openaiApiKey ? "••••••••••••••••" : "",
    connected: {
      twilio: !!(row.twilioAccountSid && row.twilioAuthToken && row.twilioFromNumber),
      resend: !!(row.resendApiKey && row.resendFromEmail),
      openai: !!row.openaiApiKey,
    },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const [existing] = await db.select().from(settings).limit(1)

  const values = {
    twilioAccountSid: body.twilioAccountSid || null,
    twilioAuthToken: body.twilioAuthToken || null,
    twilioFromNumber: body.twilioFromNumber || null,
    resendApiKey: body.resendApiKey || null,
    resendFromEmail: body.resendFromEmail || null,
    openaiApiKey: body.openaiApiKey || null,
    updatedAt: new Date(),
  }

  if (existing) {
    // Only overwrite a field if a real value (not masked) was submitted
    const update: Record<string, unknown> = { updatedAt: new Date() }
    for (const [key, val] of Object.entries(values)) {
      if (key === "updatedAt") continue
      if (val && !String(val).includes("•")) update[key] = val
    }
    await db.update(settings).set(update)
  } else {
    await db.insert(settings).values(values)
  }

  clearSettingsCache()
  return NextResponse.json({ ok: true })
}

function mask(value: string) {
  return value.slice(0, 4) + "••••••••••••" + value.slice(-4)
}
