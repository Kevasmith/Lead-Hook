"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

type Field = {
  key: string
  label: string
  placeholder: string
  hint?: string
}

const FIELDS: Field[] = [
  {
    key: "twilioAccountSid",
    label: "Twilio Account SID",
    placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    hint: "Starts with AC — found on your Twilio Console dashboard",
  },
  {
    key: "twilioAuthToken",
    label: "Twilio Auth Token",
    placeholder: "Your Twilio auth token",
    hint: "Found next to your Account SID on the Twilio Console",
  },
  {
    key: "twilioFromNumber",
    label: "Twilio From Number",
    placeholder: "+1xxxxxxxxxx",
    hint: "Your Twilio phone number in E.164 format",
  },
  {
    key: "resendApiKey",
    label: "Resend API Key",
    placeholder: "re_xxxxxxxxxxxxxxxxxxxx",
    hint: "Found in your Resend dashboard under API Keys",
  },
  {
    key: "resendFromEmail",
    label: "Resend From Address",
    placeholder: "you@yourdomain.com",
    hint: "Must be from a domain verified in Resend (e.g. hello@youragency.com)",
  },
  {
    key: "openaiApiKey",
    label: "OpenAI API Key",
    placeholder: "sk-xxxxxxxxxxxxxxxxxxxx",
    hint: "Found at platform.openai.com under API Keys",
  },
]

export default function SettingsForm() {
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          twilioAccountSid: data.twilioAccountSid ?? "",
          twilioAuthToken: data.twilioAuthToken ?? "",
          twilioFromNumber: data.twilioFromNumber ?? "",
          resendApiKey: data.resendApiKey ?? "",
          resendFromEmail: data.resendFromEmail ?? "",
          openaiApiKey: data.openaiApiKey ?? "",
        })
      })
      .finally(() => setFetching(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="text-sm text-gray-400">Loading settings…</div>
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Integrations</h2>

        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              value={form[field.key] ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {field.hint && (
              <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save Settings"}
      </button>
    </form>
  )
}
