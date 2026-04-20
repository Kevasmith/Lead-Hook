import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Normalize Facebook Ads / generic form payloads
  const name =
    body.name ??
    `${body.first_name ?? ""} ${body.last_name ?? ""}`.trim()
  const phone = body.phone ?? body.phone_number
  const email = body.email
  const source = body.source ?? body.ad_name ?? "webhook"

  if (!name || !phone || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, email, source }),
  })

  const lead = await res.json()
  return NextResponse.json(lead, { status: res.status })
}
