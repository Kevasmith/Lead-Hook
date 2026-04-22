"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Lead } from "@/db/schema"

const STATUS_BADGE: Record<Lead["status"], { label: string; icon: string; className: string }> = {
  replied:   { label: "Hot",    icon: "🔥", className: "bg-red-50 text-red-600" },
  new:       { label: "Warm",   icon: "☀️", className: "bg-orange-50 text-orange-500" },
  contacted: { label: "Cold",   icon: "❄️", className: "bg-blue-50 text-blue-500" },
  closed:    { label: "Closed", icon: "✓",  className: "bg-gray-100 text-gray-400" },
}

export default function LeadActions({ lead }: { lead: Lead }) {
  const router = useRouter()
  const badge = STATUS_BADGE[lead.status]
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function update(status: Lead["status"]) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error("Update failed"); return }
    toast.success(`Marked as ${status}`)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("Delete failed")
      setDeleting(false)
      setConfirming(false)
      return
    }
    toast.success(`${lead.name} deleted`)
    router.push("/")
  }

  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
        {badge.icon} {badge.label}
      </span>
      {lead.status !== "contacted" && lead.status !== "closed" && (
        <button
          onClick={() => update("contacted")}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Mark Contacted
        </button>
      )}
      {lead.status !== "closed" && (
        <button
          onClick={() => update("closed")}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
        >
          Close
        </button>
      )}

      {confirming ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Confirm delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50"
        >
          Delete
        </button>
      )}
    </div>
  )
}
