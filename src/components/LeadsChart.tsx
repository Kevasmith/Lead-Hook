"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { Lead } from "@/db/schema"

type Props = { leads: Lead[] }

const STATUS_COLOR: Record<string, string> = {
  replied: "#ef4444",
  new: "#ca8a04",
  contacted: "#6b7280",
  closed: "#d1d5db",
}

function buildDays(leads: Lead[]) {
  const days: { label: string; date: string; new: number; contacted: number; replied: number; closed: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    days.push({
      label: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toISOString().slice(0, 10),
      new: 0, contacted: 0, replied: 0, closed: 0,
    })
  }

  for (const lead of leads) {
    const key = new Date(lead.createdAt).toISOString().slice(0, 10)
    const day = days.find((d) => d.date === key)
    if (day) {
      const s = lead.status as keyof typeof day
      if (s in day) (day[s] as number)++
    }
  }

  return days
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + p.value, 0)
  if (total === 0) return null
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) =>
        p.value > 0 ? (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name}: {p.value}
          </p>
        ) : null
      )}
      <p className="text-gray-400 mt-1 border-t border-gray-100 pt-1">Total: {total}</p>
    </div>
  )
}

export default function LeadsChart({ leads: initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads)

  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/leads")
        if (res.ok) setLeads(await res.json())
      } catch { /* ignore */ }
    }, 15_000)
    return () => clearInterval(interval)
  }, [])

  const data = buildDays(leads)
  const total = leads.length
  const replied = leads.filter((l) => l.status === "replied").length
  const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Leads — Last 7 Days
        </h2>
        <div className="flex gap-4 text-xs text-gray-500">
          <span><span className="font-semibold text-gray-900">{total}</span> total</span>
          <span><span className="font-semibold text-red-500">{replyRate}%</span> replied</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={18} barGap={2} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
          {(["new", "contacted", "replied", "closed"] as const).map((status) => (
            <Bar key={status} dataKey={status} stackId="a" name={status} fill={STATUS_COLOR[status]} radius={status === "closed" ? [3, 3, 0, 0] : [0, 0, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={STATUS_COLOR[status]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-2">
        {[
          { key: "replied",   label: "🔥 Hot",    color: STATUS_COLOR.replied },
          { key: "new",       label: "☀️ Warm",   color: STATUS_COLOR.new },
          { key: "contacted", label: "❄️ Cold",   color: STATUS_COLOR.contacted },
          { key: "closed",    label: "✓ Closed",  color: STATUS_COLOR.closed },
        ].map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: color }} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
