"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function BookingLinkForm() {
  const [link, setLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setLink(d.bookingLink ?? ""))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingLink: link }),
      })
      if (!res.ok) throw new Error()
      toast.success("Booking link saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="h-28 rounded-2xl bg-gray-50 animate-pulse" />

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Booking Link</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Paste your Cal.com, Calendly, or any scheduling URL. It will be automatically
          appended to your SMS auto-reply when a lead responds.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://cal.com/yourname/30min"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {link && (
          <p className="text-xs text-gray-400">
            Auto-reply will read:{" "}
            <span className="italic text-gray-500">
              &quot;Got it! An agent will be in touch shortly. Book a time here: {link}&quot;
            </span>
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  )
}
