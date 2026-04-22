"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { PrioritizedLead, ActionLabel } from "@/lib/priority-scorer"
import ScoreBadge from "@/components/ScoreBadge"
import { scoreLeadBasic } from "@/lib/lead-scorer"

const ACTION_STYLE: Record<ActionLabel, { bg: string; text: string; dot: string }> = {
  "CALL NOW":   { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500"    },
  "REACH OUT":  { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-400" },
  "FOLLOW UP":  { bg: "bg-blue-50",   text: "text-blue-600",   dot: "bg-blue-400"   },
  "CLOSE OUT":  { bg: "bg-gray-50",   text: "text-gray-500",   dot: "bg-gray-400"   },
}

export default function PriorityQueue() {
  const [leads, setLeads] = useState<PrioritizedLead[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await fetch("/api/leads/priorities")
      const data = await res.json()
      setLeads(data.slice(0, 8))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Today&apos;s Priorities</h2>
          <p className="text-xs text-gray-400 mt-0.5">Who needs your attention right now</p>
        </div>
        {leads.length > 0 && (
          <span className="text-xs font-medium text-gray-400">{leads.length} active</span>
        )}
      </div>

      {loading ? (
        <ul className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <li key={i} className="h-14 rounded-xl bg-gray-50 animate-pulse" />
          ))}
        </ul>
      ) : leads.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-2xl mb-1">✓</p>
          <p className="text-sm text-gray-400">All caught up — no active leads to action.</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {leads.map((lead, i) => {
            const style = ACTION_STYLE[lead.action]
            return (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${style.bg} hover:brightness-95 transition-all`}
                >
                  {/* Rank */}
                  <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.reason}</p>
                  </div>

                  {/* Score badge */}
                  <ScoreBadge score={scoreLeadBasic(lead)} />

                  {/* Action badge */}
                  <span className={`flex items-center gap-1.5 text-xs font-bold shrink-0 ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {lead.action}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
