import { Resend } from "resend"
import { getResendKey, getResendFromEmail } from "./settings"

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = await getResendKey()
  if (!apiKey) throw new Error("Resend API key not configured. Add it in Settings.")
  const fromEmail = await getResendFromEmail()
  if (!fromEmail) throw new Error("Resend from-address not configured. Add it in Settings.")
  const resend = new Resend(apiKey)
  return resend.emails.send({
    from: `Lead Hook <${fromEmail}>`,
    to,
    subject,
    html,
  })
}
