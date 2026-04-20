import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { activities } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.leadId, id))
    .orderBy(desc(activities.timestamp))
  return NextResponse.json(rows)
}
