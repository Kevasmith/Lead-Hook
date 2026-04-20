"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import type { Lead } from "@/db/schema"

const STATUS_BADGE: Record<Lead["status"], { label: string; className: string }> = {
  replied: { label: "Hot", className: "bg-red-100 text-red-700" },
  new: { label: "New", className: "bg-yellow-100 text-yellow-700" },
  contacted: { label: "Contacted", className: "bg-blue-100 text-blue-700" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-400" },
}

const SUGGESTED_ACTION: Record<Lead["status"], string> = {
  replied: "Call now",
  new: "Follow up",
  contacted: "Follow up",
  closed: "—",
}

async function updateLeadStatus(id: string, status: Lead["status"]) {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error("Failed to update lead")
  return res.json()
}

export default function LeadList({ leads: initialLeads }: { leads: Lead[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)

  if (leads.length === 0) {
    return <p className="text-gray-400 text-sm py-4">No leads in this section.</p>
  }

  async function handleStatus(lead: Lead, newStatus: Lead["status"]) {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
    )
    try {
      await updateLeadStatus(lead.id, newStatus)
      toast.success(`${lead.name} marked as ${newStatus}`)
      router.refresh()
    } catch {
      // Revert
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l))
      )
      toast.error("Failed to update lead status")
    }
  }

  return (
    <ul className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 shadow-sm">
      {leads.map((lead) => {
        const badge = STATUS_BADGE[lead.status]
        return (
          <li key={lead.id} className="flex items-center justify-between px-4 py-4 gap-4">
            <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1 hover:opacity-75">
              <p className="font-medium text-gray-900 truncate">{lead.name}</p>
              <p className="text-sm text-gray-500 truncate">
                {lead.phone} · {lead.source}
              </p>
              {lead.lastContactedAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Last contact: {new Date(lead.lastContactedAt).toLocaleDateString()}
                </p>
              )}
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                {SUGGESTED_ACTION[lead.status]}
              </span>

              {lead.status !== "closed" && lead.status !== "contacted" && (
                <button
                  onClick={() => handleStatus(lead, "contacted")}
                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Contacted
                </button>
              )}
              {lead.status !== "closed" && (
                <button
                  onClick={() => handleStatus(lead, "closed")}
                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
                >
                  Close
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
