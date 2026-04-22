import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { settings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { clearSettingsCache } from "@/lib/settings"
import { getSessionUserId } from "@/lib/session"

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const [existing] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1)

  const update: Partial<typeof settings.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  }

  if (body.workspaceType) update.workspaceType = body.workspaceType
  if (body.businessName !== undefined) update.businessName = body.businessName || null
  if (body.complete === true) update.onboardingCompleted = true

  const credFields = [
    "twilioAccountSid", "twilioAuthToken", "twilioFromNumber",
    "resendApiKey", "resendFromEmail", "openaiApiKey",
  ] as const
  for (const field of credFields) {
    if (body[field] && !String(body[field]).includes("•")) {
      update[field] = body[field]
    }
  }

  if (existing) {
    await db.update(settings).set(update).where(eq(settings.userId, userId))
  } else {
    await db.insert(settings).values({ ...update, userId })
  }

  clearSettingsCache(userId)
  return NextResponse.json({ ok: true })
}
