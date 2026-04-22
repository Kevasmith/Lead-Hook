import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads } from "@/db/schema"
import { or, eq, and } from "drizzle-orm"
import { rateLimit } from "@/lib/rate-limit"

type NormalizedLead = {
  name: string
  phone: string
  email: string
  source: string
}

function normalizePayload(body: Record<string, unknown>, crmSource?: string): NormalizedLead | null {
  let name = ""
  let phone = ""
  let email = ""
  let source = ""

  // Follow Up Boss: { name, email: [{value}], phones: [{value}], source }
  if (
    crmSource === "followupboss" ||
    (Array.isArray(body.email) && Array.isArray(body.phones))
  ) {
    name = String(body.name ?? "")
    const emails = body.email as Array<{ value: string }>
    const phones = body.phones as Array<{ value: string }>
    email = emails?.[0]?.value ?? ""
    phone = phones?.[0]?.value ?? ""
    source = String(body.source ?? "Follow Up Boss")
  }

  // kvCORE: { type, data: { contact: { full_name, email, mobile } } }
  else if (
    crmSource === "kvcore" ||
    (body.data && typeof body.data === "object" && "contact" in (body.data as object))
  ) {
    const contact = (body.data as Record<string, unknown>)?.contact as Record<string, unknown>
    name = String(contact?.full_name ?? "")
    email = String(contact?.email ?? "")
    phone = String(contact?.mobile ?? contact?.phone ?? "")
    source = "kvCORE"
  }

  // HubSpot: { properties: { firstname: {value}, lastname: {value}, email: {value}, phone: {value} } }
  else if (
    crmSource === "hubspot" ||
    (body.properties && typeof body.properties === "object")
  ) {
    const props = body.properties as Record<string, { value: string } | string>
    const get = (key: string) => {
      const v = props[key]
      return typeof v === "object" ? v?.value ?? "" : v ?? ""
    }
    const first = get("firstname")
    const last = get("lastname")
    name = `${first} ${last}`.trim() || get("full_name")
    email = get("email")
    phone = get("phone")
    source = "HubSpot"
  }

  // Salesforce: { Name or FirstName+LastName, Email, Phone, LeadSource }
  else if (
    crmSource === "salesforce" ||
    (body.Email && (body.Name || body.FirstName))
  ) {
    name = String(body.Name ?? `${body.FirstName ?? ""} ${body.LastName ?? ""}`.trim())
    email = String(body.Email ?? "")
    phone = String(body.Phone ?? body.MobilePhone ?? "")
    source = String(body.LeadSource ?? "Salesforce")
  }

  // BoomTown: { lead_name, lead_email, lead_phone, lead_source }
  else if (
    crmSource === "boomtown" ||
    body.lead_name !== undefined
  ) {
    name = String(body.lead_name ?? "")
    email = String(body.lead_email ?? "")
    phone = String(body.lead_phone ?? "")
    source = String(body.lead_source ?? "BoomTown")
  }

  // Sierra Interactive: { first_name, last_name, email, phone }
  else if (
    crmSource === "sierra" ||
    (body.first_name !== undefined && body.last_name !== undefined)
  ) {
    name = `${body.first_name ?? ""} ${body.last_name ?? ""}`.trim()
    email = String(body.email ?? "")
    phone = String(body.phone ?? "")
    source = "Sierra Interactive"
  }

  // Facebook Ads / Generic: { name or first_name+last_name, phone or phone_number, email, source or ad_name }
  else {
    name =
      String(body.name ?? `${body.first_name ?? ""} ${body.last_name ?? ""}`.trim())
    phone = String(body.phone ?? body.phone_number ?? "")
    email = String(body.email ?? "")
    source = String(body.source ?? body.ad_name ?? "webhook")
  }

  if (!name || !phone || !email) return null
  return { name, phone, email, source }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  const { allowed, retryAfter } = rateLimit(`webhook:${ip}`, 30)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Allow CRM to self-identify via header
  const crmSource = req.headers.get("x-crm-source")?.toLowerCase() ?? undefined

  const lead = normalizePayload(body, crmSource)
  if (!lead) {
    return NextResponse.json({ error: "Missing required fields: name, phone, email" }, { status: 400 })
  }

  // userId must be provided as a query param in the webhook URL: /api/webhooks?userId=xxx
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId — configure your webhook URL to include ?userId=<your-user-id>" },
      { status: 400 }
    )
  }

  // Duplicate check — same phone or email already exists for this user
  const [existing] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        eq(leads.userId, userId),
        or(eq(leads.phone, lead.phone), eq(leads.email, lead.email))
      )
    )
    .limit(1)

  if (existing) {
    return NextResponse.json({ error: "Duplicate lead", leadId: existing.id }, { status: 409 })
  }

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...lead, userId }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
