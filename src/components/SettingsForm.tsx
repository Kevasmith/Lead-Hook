"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function SettingsForm() {
  const [form, setForm]       = useState({ twilioFromNumber: "", resendFromEmail: "" })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setForm({
        twilioFromNumber: data.twilioFromNumber ?? "",
        resendFromEmail:  data.resendFromEmail  ?? "",
      }))
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

  if (fetching) return <div className="text-sm text-gray-400 py-4">Loading…</div>

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMS From Number</label>
          <input
            type="text"
            value={form.twilioFromNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, twilioFromNumber: e.target.value }))}
            placeholder="+1xxxxxxxxxx"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1">The Twilio number your texts are sent from.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email From Address</label>
          <input
            type="email"
            value={form.resendFromEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, resendFromEmail: e.target.value }))}
            placeholder="you@yourdomain.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1">The address your follow-up emails are sent from.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  )
}
