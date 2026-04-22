import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { templates } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { getSessionUserId } from "@/lib/session"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, subject, body: templateBody } = body

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (subject !== undefined) updateData.subject = subject
  if (templateBody !== undefined) updateData.body = templateBody

  const [updated] = await db
    .update(templates)
    .set(updateData)
    .where(and(eq(templates.id, id), eq(templates.userId, userId)))
    .returning()

  if (!updated) return NextResponse.json({ error: "Template not found" }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [deleted] = await db
    .delete(templates)
    .where(and(eq(templates.id, id), eq(templates.userId, userId)))
    .returning()

  if (!deleted) return NextResponse.json({ error: "Template not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
