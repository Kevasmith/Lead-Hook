import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { user } from "@/db/auth-schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)

  return NextResponse.json({
    name: session.user.name,
    email: session.user.email,
    imageUrl: session.user.image ?? null,
    jobTitle: profile?.jobTitle ?? null,
    phone: profile?.phone ?? null,
  })
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const body = await req.json()
  const { name, jobTitle, phone, imageUrl } = body

  if (name !== undefined || imageUrl !== undefined) {
    await db
      .update(user)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(imageUrl !== undefined ? { image: imageUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
  }

  if (jobTitle !== undefined || phone !== undefined) {
    await db
      .insert(profiles)
      .values({ userId, jobTitle: jobTitle ?? null, phone: phone ?? null })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          ...(jobTitle !== undefined ? { jobTitle } : {}),
          ...(phone !== undefined ? { phone } : {}),
          updatedAt: new Date(),
        },
      })
  }

  return NextResponse.json({ success: true })
}
