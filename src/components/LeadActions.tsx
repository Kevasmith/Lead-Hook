"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Lead } from "@/db/schema"

const STATUS_BADGE: Record<Lead["status"], { label: string; className: string }> = {
  replied: { label: "Hot", className: "bg-red-100 text-red-700" },
  new: { label: "New", className: "bg-yellow-100 text-yellow-700" },
  contacted: { label: "Contacted", className: "bg-blue-100 text-blue-700" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-400" },
}

export default function LeadActions({ lead }: { lead: Lead }) {
  const router = useRouter()
  const badge = STATUS_BADGE[lead.status]

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

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.className}`}>
        {badge.label}
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
    </div>
  )
}
