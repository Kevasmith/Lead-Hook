import { db } from "@/db"
import { settings } from "@/db/schema"

let cache: typeof settings.$inferSelect | null = null

export async function getSettings() {
  if (cache) return cache
  const [row] = await db.select().from(settings).limit(1)
  cache = row ?? null
  return cache
}

export function clearSettingsCache() {
  cache = null
}

export async function getTwilioConfig() {
  const s = await getSettings()
  return {
    accountSid: s?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || "",
    authToken: s?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || "",
    fromNumber: s?.twilioFromNumber || process.env.TWILIO_FROM_NUMBER || "",
  }
}

export async function getResendKey() {
  const s = await getSettings()
  return s?.resendApiKey || process.env.RESEND_API_KEY || ""
}

export async function getResendFromEmail() {
  const s = await getSettings()
  return s?.resendFromEmail || process.env.RESEND_FROM_EMAIL || ""
}

export async function getOpenAiKey() {
  const s = await getSettings()
  return s?.openaiApiKey || process.env.OPENAI_API_KEY || ""
}
