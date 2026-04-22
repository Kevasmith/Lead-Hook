import { db } from "@/db"
import { leads, settings } from "@/db/schema"
import { inArray, eq, isNotNull } from "drizzle-orm"
import { getSettings } from "./settings"
import { sendSms } from "./twilio"
import { sendEmail } from "./resend"
import { SEQUENCE_DAYS } from "./follow-up-scheduler"
import type { Lead } from "@/db/schema"

const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

function hoursSince(d: Date | string): number {
  return (Date.now() - new Date(d).getTime()) / 3_600_000
}

function daysSince(d: Date | string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

function isNotContactedAlert(lead: Lead): boolean {
  if (lead.status !== "new") return false
  if (lead.lastContactedAt) return false
  const hrs = hoursSince(lead.createdAt)
  return hrs >= 1 && hrs < 2
}

function isMissedWindowAlert(lead: Lead): boolean {
  if (lead.status === "replied" || lead.status === "closed") return false
  const days = daysSince(lead.createdAt)
  if (!SEQUENCE_DAYS.includes(days) || days === 0) return false
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return !lead.lastContactedAt || new Date(lead.lastContactedAt) < todayStart
}

function isStalled(lead: Lead): boolean {
  if (lead.status === "replied" || lead.status === "closed") return false
  const ref = lead.lastContactedAt ?? lead.createdAt
  return hoursSince(ref) > 48
}

async function alertSms(phone: string, message: string, userId?: string) {
  await sendSms(phone, message, userId).catch(console.error)
}

async function alertEmail(email: string, subject: string, html: string, userId?: string) {
  await sendEmail(email, subject, html, userId).catch(console.error)
}

async function processUserAlerts(userId: string) {
  const s = await getSettings(userId)
  if (!s) return { notContacted: 0, missedWindows: 0 }
  if (!s.alertSmsEnabled && !s.alertEmailEnabled) return { notContacted: 0, missedWindows: 0 }

  const active = await db
    .select()
    .from(leads)
    .where(inArray(leads.status, ["new", "contacted"]))

  const userLeads = active.filter((l) => l.userId === userId)
  const notContacted = userLeads.filter(isNotContactedAlert)
  const missedWindows = userLeads.filter(isMissedWindowAlert)

  const promises: Promise<unknown>[] = []

  if (notContacted.length > 0) {
    const names = notContacted.map((l) => l.name).join(", ")
    const smsBody = `⚠️ ${notContacted.length} lead${notContacted.length > 1 ? "s" : ""} not contacted after 1h: ${names}. ${BASE_URL}`
    const emailHtml = `
      <p><strong>${notContacted.length} new lead${notContacted.length > 1 ? "s" : ""} still waiting after 1 hour:</strong></p>
      <ul>${notContacted.map((l) => `<li><a href="${BASE_URL}/leads/${l.id}">${l.name}</a> — from ${l.source}</li>`).join("")}</ul>
    `
    if (s.alertSmsEnabled && s.alertPhone) promises.push(alertSms(s.alertPhone, smsBody, userId))
    if (s.alertEmailEnabled && s.alertEmail) promises.push(alertEmail(s.alertEmail, "⚠️ Leads not contacted after 1 hour", emailHtml, userId))
  }

  if (missedWindows.length > 0) {
    const names = missedWindows.map((l) => l.name).join(", ")
    const smsBody = `📅 Missed follow-up window for ${missedWindows.length} lead${missedWindows.length > 1 ? "s" : ""}: ${names}. ${BASE_URL}`
    const emailHtml = `
      <p><strong>${missedWindows.length} lead${missedWindows.length > 1 ? "s" : ""} missed a follow-up window today:</strong></p>
      <ul>${missedWindows.map((l) => `<li><a href="${BASE_URL}/leads/${l.id}">${l.name}</a> — day ${daysSince(l.createdAt)} of sequence</li>`).join("")}</ul>
    `
    if (s.alertSmsEnabled && s.alertPhone) promises.push(alertSms(s.alertPhone, smsBody, userId))
    if (s.alertEmailEnabled && s.alertEmail) promises.push(alertEmail(s.alertEmail, "📅 Missed follow-up windows", emailHtml, userId))
  }

  await Promise.all(promises)
  return { notContacted: notContacted.length, missedWindows: missedWindows.length }
}

export async function runRealTimeAlerts() {
  const userRows = await db
    .select({ userId: settings.userId })
    .from(settings)
    .where(isNotNull(settings.userId))

  const results = await Promise.all(
    userRows.map((r) => processUserAlerts(r.userId!))
  )
  return results.reduce(
    (acc, r) => ({ notContacted: acc.notContacted + r.notContacted, missedWindows: acc.missedWindows + r.missedWindows }),
    { notContacted: 0, missedWindows: 0 }
  )
}

export async function runDailyDigest() {
  const userRows = await db
    .select({ userId: settings.userId, alertEmailEnabled: settings.alertEmailEnabled, alertEmail: settings.alertEmail })
    .from(settings)
    .where(isNotNull(settings.userId))

  let totalStalled = 0

  for (const row of userRows) {
    if (!row.userId || !row.alertEmailEnabled || !row.alertEmail) continue

    const active = await db
      .select()
      .from(leads)
      .where(inArray(leads.status, ["new", "contacted"]))

    const stalled = active.filter((l) => l.userId === row.userId && isStalled(l))
    if (stalled.length === 0) continue

    const html = `
      <p>Good morning. Here are <strong>${stalled.length} stalled lead${stalled.length > 1 ? "s" : ""}</strong> that need attention today:</p>
      <ul>${stalled
        .sort((a, b) => hoursSince(b.lastContactedAt ?? b.createdAt) - hoursSince(a.lastContactedAt ?? a.createdAt))
        .map((l) => {
          const hrs = Math.round(hoursSince(l.lastContactedAt ?? l.createdAt))
          const age = hrs >= 48 ? `${Math.floor(hrs / 24)}d` : `${hrs}h`
          return `<li><a href="${BASE_URL}/leads/${l.id}">${l.name}</a> — ${l.source} — last touch ${age} ago</li>`
        })
        .join("")}</ul>
      <p><a href="${BASE_URL}">Open Lead Hook →</a></p>
    `

    await alertEmail(row.alertEmail, `Daily digest: ${stalled.length} leads need attention`, html, row.userId)
    totalStalled += stalled.length
  }

  return { stalled: totalStalled }
}
