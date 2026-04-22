"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const SOURCES = ["Facebook Ads", "Website Form", "Referral", "Zillow", "Realtor.com", "Other"]

export default function AddLeadButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "Facebook Ads" })

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to create lead")
      const data = await res.json()
      toast.success(
        data.smsSent
          ? `${form.name} added — intro SMS sent`
          : `${form.name} added — SMS failed, check Twilio settings`
      )
      setOpen(false)
      setForm({ name: "", phone: "", email: "", source: "Facebook Ads" })
      router.refresh()
    } catch {
      toast.error("Failed to add lead")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 font-medium"
      >
        + Add Lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add Lead</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(["name", "phone", "email"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {field}
                  </label>
                  <input
                    type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                    required
                    value={form[field]}
                    onChange={(e) => setField(field, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setField("source", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? "Adding…" : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
