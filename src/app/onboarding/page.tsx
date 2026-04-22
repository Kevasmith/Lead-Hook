import { connection } from "next/server"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getSettings } from "@/lib/settings"
import OnboardingWizard from "@/components/OnboardingWizard"

export default async function OnboardingPage() {
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/sign-in")
  const userId = session.user.id

  const row = await getSettings(userId)
  if (row?.onboardingCompleted) redirect("/")

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  const webhookUrl = userId ? `${baseUrl}/api/webhooks?userId=${userId}` : `${baseUrl}/api/webhooks`

  return <OnboardingWizard webhookUrl={webhookUrl} />
}
