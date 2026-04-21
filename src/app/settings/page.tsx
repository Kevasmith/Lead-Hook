import { connection } from "next/server"
import Link from "next/link"
import SettingsForm from "@/components/SettingsForm"
import { db } from "@/db"
import { settings } from "@/db/schema"

async function getConnected() {
  const [row] = await db.select().from(settings).limit(1)
  return {
    twilio: !!(row?.twilioAccountSid && row?.twilioAuthToken && row?.twilioFromNumber),
    resend: !!(row?.resendApiKey && row?.resendFromEmail),
    openai: !!row?.openaiApiKey,
  }
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`}
    />
  )
}

export default async function SettingsPage() {
  await connection()
  const connected = await getConnected()

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 w-full bg-white min-h-screen">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
        ← Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Configure your integrations</p>

      {/* Status overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Twilio (SMS)", key: "twilio" as const },
          { label: "Resend (Email)", key: "resend" as const },
          { label: "OpenAI", key: "openai" as const },
        ].map(({ label, key }) => (
          <div key={key} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <StatusDot connected={connected[key]} />
              <span className="text-xs font-semibold text-gray-600">{label}</span>
            </div>
            <p className="text-xs text-gray-400">
              {connected[key] ? "Connected" : "Not configured"}
            </p>
          </div>
        ))}
      </div>

      <SettingsForm />
    </main>
  )
}
