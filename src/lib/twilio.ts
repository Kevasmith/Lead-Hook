import twilio from "twilio"
import { getTwilioConfig } from "./settings"

export async function sendSms(to: string, body: string) {
  const { accountSid, authToken, fromNumber } = await getTwilioConfig()
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials not configured. Add them in Settings.")
  }
  const client = twilio(accountSid, authToken)
  return client.messages.create({ from: fromNumber, to, body })
}
