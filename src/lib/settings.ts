import { db } from "@/db"
import { settings, leads } from "@/db/schema"
import { eq, isNull } from "drizzle-orm"

const cache = new Map<string, typeof settings.$inferSelect | null>()

export async function getSettings(userId?: string | null) {
  if (!userId) return null
  if (cache.has(userId)) return cache.get(userId)!

  // Look for a row already owned by this user
  const [row] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1)
  if (row) {
    cache.set(userId, row)
    return row
  }

  // Adopt any legacy rows that have no userId (pre-migration data)
  const [legacy] = await db.select().from(settings).where(isNull(settings.userId)).limit(1)
  if (legacy) {
    await Promise.all([
      db.update(settings).set({ userId }).where(eq(settings.id, legacy.id)),
      db.update(leads).set({ userId }).where(isNull(leads.userId)),
    ])
    const adopted = { ...legacy, userId }
    cache.set(userId, adopted)
    return adopted
  }

  cache.set(userId, null)
  return null
}

export function clearSettingsCache(userId?: string | null) {
  if (userId) cache.delete(userId)
  else cache.clear()
}

export async function getTwilioConfig(userId?: string | null) {
  const s = await getSettings(userId)
  return {
    accountSid: s?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || "",
    authToken:  s?.twilioAuthToken  || process.env.TWILIO_AUTH_TOKEN  || "",
    fromNumber: s?.twilioFromNumber || process.env.TWILIO_FROM_NUMBER || "",
  }
}

export async function getResendKey(userId?: string | null) {
  const s = await getSettings(userId)
  return s?.resendApiKey || process.env.RESEND_API_KEY || ""
}

export async function getResendFromEmail(userId?: string | null) {
  const s = await getSettings(userId)
  return s?.resendFromEmail || process.env.RESEND_FROM_EMAIL || ""
}

export async function getOpenAiKey(userId?: string | null) {
  const s = await getSettings(userId)
  return s?.openaiApiKey || process.env.OPENAI_API_KEY || ""
}
