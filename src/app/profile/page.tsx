import { connection } from "next/server"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import AppShell from "@/components/AppShell"
import ProfileForm from "@/components/ProfileForm"

export default async function ProfilePage() {
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/sign-in")

  const userId = session.user.id
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)

  return (
    <AppShell
      email={session.user.email}
      name={session.user.name}
      imageUrl={session.user.image}
      emailVerified={session.user.emailVerified}
      userId={userId}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal info and account settings.</p>
        </div>
        <ProfileForm
          profile={{
            name: session.user.name ?? "",
            email: session.user.email,
            imageUrl: session.user.image ?? null,
            jobTitle: profile?.jobTitle ?? null,
            phone: profile?.phone ?? null,
          }}
        />
      </div>
    </AppShell>
  )
}
