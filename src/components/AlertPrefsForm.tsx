"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function AlertPrefsForm() {
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setPhone(d.alertPhone ?? "")
        setEmail(d.alertEmail ?? "")
        setSmsEnabled(d.alertSmsEnabled ?? false)
        setEmailEnabled(d.alertEmailEnabled ?? false)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertPhone: phone,
          alertEmail: email,
          alertSmsEnabled: smsEnabled,
          alertEmailEnabled: emailEnabled,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Alert preferences saved")
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-40 rounded-2xl bg-gray-50 animate-pulse" />
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Alert Preferences</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Get notified the moment a lead replies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* SMS alert row */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setSmsEnabled((v) => !v)}
            className={`relative mt-0.5 w-9 h-5 rounded-full transition-colors shrink-0 ${smsEnabled ? "bg-indigo-600" : "bg-gray-200"}`}
            aria-pressed={smsEnabled}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${smsEnabled ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-1">SMS alerts</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!smsEnabled}
              placeholder="+1 555 000 0000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your mobile number in E.164 format — e.g. +15550001234
            </p>
          </div>
        </div>

        {/* Email alert row */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setEmailEnabled((v) => !v)}
            className={`relative mt-0.5 w-9 h-5 rounded-full transition-colors shrink-0 ${emailEnabled ? "bg-indigo-600" : "bg-gray-200"}`}
            aria-pressed={emailEnabled}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${emailEnabled ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-1">Email alerts</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!emailEnabled}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </div>
  )
}
