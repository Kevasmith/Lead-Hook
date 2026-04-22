import { getSettings } from "./settings"
import { sendSms } from "./twilio"
import { sendEmail } from "./resend"
import type { Lead } from "@/db/schema"

export async function sendReplyAlert(lead: Lead, replyMessage: string) {
  const userId = lead.userId ?? undefined
  const s = await getSettings(userId)
  if (!s) return

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  const leadUrl = `${baseUrl}/leads/${lead.id}`
  const preview = replyMessage.length > 80 ? replyMessage.slice(0, 80) + "…" : replyMessage

  const promises: Promise<unknown>[] = []

  if (s.alertSmsEnabled && s.alertPhone) {
    const smsBody = `🔥 ${lead.name} just replied: "${preview}" — ${leadUrl}`
    promises.push(sendSms(s.alertPhone, smsBody, userId).catch(console.error))
  }

  if (s.alertEmailEnabled && s.alertEmail) {
    const html = `
      <p><strong>${lead.name}</strong> just replied to your Lead Hook message.</p>
      <p><strong>Their message:</strong><br/>${replyMessage.replace(/\n/g, "<br/>")}</p>
      <p><strong>Source:</strong> ${lead.source}</p>
      <p><a href="${leadUrl}">View lead →</a></p>
    `
    promises.push(
      sendEmail(s.alertEmail, `Lead replied: ${lead.name}`, html, userId).catch(console.error)
    )
  }

  await Promise.all(promises)
}
