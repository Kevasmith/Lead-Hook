"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import type { Lead } from "@/db/schema"
import ScoreBadge from "@/components/ScoreBadge"
import type { LeadScore } from "@/lib/lead-scorer"

const STATUS_BADGE: Record<Lead["status"], { label: string; className: string }> = {
  replied:   { label: "Hot",     className: "bg-red-50 text-red-600" },
  new:       { label: "Warm",    className: "bg-orange-50 text-orange-500" },
  contacted: { label: "Cold",    className: "bg-blue-50 text-blue-500" },
  closed:    { label: "Closed",  className: "bg-gray-100 text-gray-400" },
}

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

async function updateStatus(id: string, status: Lead["status"]) {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error()
}

export default function LeadsTable({
  leads: initial,
  scores,
}: {
  leads: Lead[]
  scores?: Record<string, LeadScore>
}) {
  const router = useRouter()
  const [leads, setLeads] = useState(initial)

  async function handleStatus(lead: Lead, status: Lead["status"]) {
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status } : l))
    try {
      await updateStatus(lead.id, status)
      toast.success(`${lead.name} marked as ${status}`)
      router.refresh()
    } catch {
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status: lead.status } : l))
      toast.error("Failed to update status")
    }
  }

  if (leads.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No leads yet. Add your first one.</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          {["Name", "Source", "Last Contacted", "Score", "Status", ""].map((h) => (
            <th key={h} className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 last:pr-0">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {leads.map((lead) => {
          const badge = STATUS_BADGE[lead.status]
          return (
            <tr key={lead.id} className="group hover:bg-gray-50/50 transition-colors">
              <td className="py-3 pr-4">
                <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                  {lead.name}
                </Link>
              </td>
              <td className="py-3 pr-4 text-gray-500">{lead.source}</td>
              <td className="py-3 pr-4 text-gray-400">
                {lead.lastContactedAt ? timeAgo(lead.lastContactedAt) : "Never"}
              </td>
              <td className="py-3 pr-4">
                {scores?.[lead.id] && <ScoreBadge score={scores[lead.id]} />}
              </td>
              <td className="py-3 pr-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </td>
              <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {lead.status !== "closed" && lead.status !== "contacted" && (
                    <button
                      onClick={() => handleStatus(lead, "contacted")}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      Contacted
                    </button>
                  )}
                  {lead.status !== "closed" && (
                    <button
                      onClick={() => handleStatus(lead, "closed")}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100"
                    >
                      Close
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
