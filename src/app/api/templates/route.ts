import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { templates } from "@/db/schema"
import { and, asc, eq } from "drizzle-orm"
import { getSessionUserId } from "@/lib/session"

const DEFAULTS: Array<Omit<typeof templates.$inferInsert, "id" | "userId" | "createdAt">> = [
  {
    name: "Quick intro",
    channel: "sms",
    subject: null,
    body: "Hey [Name], saw your inquiry — when's a good time to connect?",
  },
  {
    name: "Checking in",
    channel: "sms",
    subject: null,
    body: "Hey [Name], just wanted to follow up. Still looking?",
  },
  {
    name: "Final follow-up",
    channel: "sms",
    subject: null,
    body: "Hey [Name], last time reaching out. Let me know if you're still interested.",
  },
  {
    name: "Following up",
    channel: "email",
    subject: "Following up on your inquiry",
    body: "Hi [Name],\n\nI wanted to check in and see if you're still interested. Happy to answer any questions.\n\nLooking forward to connecting!",
  },
  {
    name: "Closing out",
    channel: "email",
    subject: "Checking in one last time",
    body: "Hi [Name],\n\nI haven't heard back and don't want to keep bothering you. If you're still looking, I'm here to help — just reply anytime.\n\nWishing you the best!",
  },
]

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const channel = req.nextUrl.searchParams.get("channel") ?? undefined

  let rows = await db
    .select()
    .from(templates)
    .where(
      channel
        ? and(eq(templates.userId, userId), eq(templates.channel, channel as "sms" | "email"))
        : eq(templates.userId, userId)
    )
    .orderBy(asc(templates.createdAt))

  // Seed defaults on first use
  if (rows.length === 0) {
    const seeded = await db
      .insert(templates)
      .values(DEFAULTS.map((d) => ({ ...d, userId })))
      .returning()
    rows = channel ? seeded.filter((t) => t.channel === channel) : seeded
  }

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, channel, subject, body: templateBody } = body

  if (!name?.trim() || !channel || !templateBody?.trim()) {
    return NextResponse.json({ error: "name, channel, and body are required" }, { status: 400 })
  }
  if (!["sms", "email"].includes(channel)) {
    return NextResponse.json({ error: "channel must be sms or email" }, { status: 400 })
  }

  const [template] = await db
    .insert(templates)
    .values({ userId, name, channel, subject: subject ?? null, body: templateBody })
    .returning()

  return NextResponse.json(template, { status: 201 })
}
