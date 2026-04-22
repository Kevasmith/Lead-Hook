import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { leads } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { getSessionUserId } from "@/lib/session"

async function ownedLead(id: string, userId: string) {
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.userId, userId)))
    .limit(1)
  return lead ?? null
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await ownedLead(id, userId)
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  await db.delete(leads).where(and(eq(leads.id, id), eq(leads.userId, userId)))
  return NextResponse.json({ success: true })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const lead = await ownedLead(id, userId)
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await ownedLead(id, userId)
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  const body = await req.json()
  const { status, notes } = body

  const validStatuses = ["new", "contacted", "replied", "closed"]
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (status) {
    updateData.status = status
    if (status === "contacted") updateData.lastContactedAt = new Date()
  }
  if (notes !== undefined) updateData.notes = notes

  const [updated] = await db
    .update(leads)
    .set(updateData)
    .where(and(eq(leads.id, id), eq(leads.userId, userId)))
    .returning()

  return NextResponse.json(updated)
}
