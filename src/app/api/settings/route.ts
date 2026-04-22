import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { settings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { clearSettingsCache } from "@/lib/settings"
import { getSessionUserId } from "@/lib/session"

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [row] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1)
  if (!row) return NextResponse.json({})

  return NextResponse.json({
    logoUrl: row.logoUrl ?? "",
    twilioFromNumber: row.twilioFromNumber ?? "",
    resendFromEmail: row.resendFromEmail ?? "",
    configured: {
      twilioAccountSid: !!row.twilioAccountSid,
      twilioAuthToken:  !!row.twilioAuthToken,
      resendApiKey:     !!row.resendApiKey,
      openaiApiKey:     !!row.openaiApiKey,
    },
    onboardingCompleted: row.onboardingCompleted ?? false,
    workspaceType: row.workspaceType ?? null,
    businessName: row.businessName ?? null,
    alertPhone: row.alertPhone ?? "",
    alertEmail: row.alertEmail ?? "",
    alertSmsEnabled: row.alertSmsEnabled ?? false,
    alertEmailEnabled: row.alertEmailEnabled ?? false,
    bookingLink: row.bookingLink ?? "",
  })
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const [existing] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1)

  const values = {
    userId,
    logoUrl: "logoUrl" in body ? (body.logoUrl || null) : undefined,
    twilioAccountSid: body.twilioAccountSid || null,
    twilioAuthToken: body.twilioAuthToken || null,
    twilioFromNumber: body.twilioFromNumber || null,
    resendApiKey: body.resendApiKey || null,
    resendFromEmail: body.resendFromEmail || null,
    openaiApiKey: body.openaiApiKey || null,
    alertPhone: "alertPhone" in body ? (body.alertPhone || null) : undefined,
    alertEmail: "alertEmail" in body ? (body.alertEmail || null) : undefined,
    alertSmsEnabled: "alertSmsEnabled" in body ? !!body.alertSmsEnabled : undefined,
    alertEmailEnabled: "alertEmailEnabled" in body ? !!body.alertEmailEnabled : undefined,
    bookingLink: "bookingLink" in body ? (body.bookingLink || null) : undefined,
    updatedAt: new Date(),
  }

  if (existing) {
    const update: Record<string, unknown> = { updatedAt: new Date() }
    for (const [key, val] of Object.entries(values)) {
      if (key === "updatedAt" || key === "userId") continue
      if (val !== undefined) update[key] = val ?? null
    }
    await db.update(settings).set(update).where(eq(settings.userId, userId))
  } else {
    await db.insert(settings).values(values)
  }

  clearSettingsCache(userId)
  return NextResponse.json({ ok: true })
}
