import { connection } from "next/server"
import WebhookSection from "@/components/WebhookSection"
import CopyButton from "@/components/CopyButton"
import LogoForm from "@/components/LogoForm"
import AlertPrefsForm from "@/components/AlertPrefsForm"
import BookingLinkForm from "@/components/BookingLinkForm"
import AppShell from "@/components/AppShell"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function getConnected() {
  return {
    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
    resend:  !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    openai:  !!process.env.OPENAI_API_KEY,
  }
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`} />
  )
}

function TwilioWebhookCard({ url }: { url: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-800 mb-0.5">Twilio SMS Webhook</h2>
        <p className="text-xs text-gray-400">
          Paste this into your Twilio phone number settings so inbound replies are captured.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <code className="flex-1 text-sm text-gray-800 break-all">{url}</code>
        <CopyButton text={url} />
      </div>
      <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600">
        <li>Go to <span className="font-medium">Twilio Console → Phone Numbers → Active Numbers</span></li>
        <li>Click your Lead Hook number</li>
        <li>Under <span className="font-medium">Messaging Configuration</span>, set <span className="font-medium">A message comes in</span> → Webhook → <code className="text-xs bg-gray-100 px-1 rounded">HTTP POST</code></li>
        <li>Paste the URL above and save</li>
      </ol>
    </div>
  )
}

export default async function SettingsPage() {
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  const connected = await getConnected()
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  const webhookUrl = userId ? `${baseUrl}/api/webhooks?userId=${userId}` : `${baseUrl}/api/webhooks`
  const twilioWebhookUrl = `${baseUrl}/api/webhooks/sms`

  return (
    <AppShell email={session?.user.email} name={session?.user.name} imageUrl={session?.user.image} emailVerified={session?.user.emailVerified} userId={userId}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {[
              { label: "SMS",   key: "twilio" as const },
              { label: "Email", key: "resend"  as const },
              { label: "AI",    key: "openai"  as const },
            ].map(({ label, key }) => (
              <span key={key} className="flex items-center gap-1.5">
                <StatusDot connected={connected[key]} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <LogoForm />
          <BookingLinkForm />
          <AlertPrefsForm />
          <TwilioWebhookCard url={twilioWebhookUrl} />
          <WebhookSection webhookUrl={webhookUrl} />
        </div>
      </div>
    </AppShell>
  )
}
