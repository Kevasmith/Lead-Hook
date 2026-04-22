import { connection } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import AppShell from "@/components/AppShell"
import { getSettings } from "@/lib/settings"
import TemplatesManager from "@/components/TemplatesManager"

export default async function TemplatesPage() {
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })

  const userId = session?.user?.id
  const settingsRow = await getSettings(userId)
  if (!settingsRow?.onboardingCompleted) redirect("/onboarding")

  return (
    <AppShell email={session?.user.email} name={session?.user.name} imageUrl={session?.user.image} emailVerified={session?.user.emailVerified} userId={userId}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Reusable messages for SMS and email. Use <code className="bg-gray-100 px-1 rounded text-xs">[Name]</code> and <code className="bg-gray-100 px-1 rounded text-xs">[Source]</code> as variables.
          </p>
        </div>
        <TemplatesManager />
      </div>
    </AppShell>
  )
}
