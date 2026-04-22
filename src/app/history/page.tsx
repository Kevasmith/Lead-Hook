import { connection } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { desc, eq, and, inArray } from "drizzle-orm"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import AppShell from "@/components/AppShell"

const BADGE: Record<string, { label: string; icon: string; className: string }> = {
  replied:   { label: "Hot",    icon: "🔥", className: "bg-red-50 text-red-600" },
  new:       { label: "Warm",   icon: "☀️", className: "bg-orange-50 text-orange-500" },
  contacted: { label: "Cold",   icon: "❄️", className: "bg-blue-50 text-blue-500" },
  closed:    { label: "Closed", icon: "✓",  className: "bg-gray-100 text-gray-400" },
}

const SECTIONS = [
  { key: "closed",    heading: "Closed",           headingClass: "text-gray-400" },
  { key: "contacted", heading: "Cold — Contacted",  headingClass: "text-blue-400" },
  { key: "new",       heading: "Warm — New",        headingClass: "text-orange-500" },
  { key: "replied",   heading: "Hot — Replied",     headingClass: "text-red-500" },
] as const

export default async function HistoryPage() {
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id

  const allLeads = userId ? await db
    .select()
    .from(leads)
    .where(and(eq(leads.userId, userId), inArray(leads.status, ["contacted", "replied", "closed", "new"])))
    .orderBy(desc(leads.lastContactedAt)) : []

  const leadIds = allLeads.map((l) => l.id)

  const allActivities = leadIds.length > 0
    ? await db.select().from(activities).where(inArray(activities.leadId, leadIds)).orderBy(desc(activities.timestamp))
    : []

  const latestByLead = new Map<string, typeof allActivities[number]>()
  for (const a of allActivities) {
    if (!latestByLead.has(a.leadId)) latestByLead.set(a.leadId, a)
  }

  const countByLead = new Map<string, number>()
  for (const a of allActivities) {
    countByLead.set(a.leadId, (countByLead.get(a.leadId) ?? 0) + 1)
  }

  const grouped = Object.fromEntries(
    SECTIONS.map(({ key }) => [key, allLeads.filter((l) => l.status === key)])
  )

  return (
    <AppShell email={session?.user.email} name={session?.user.name} imageUrl={session?.user.image} emailVerified={session?.user.emailVerified} userId={session?.user?.id}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <span className="text-sm text-gray-400">{allLeads.length} total</span>
        </div>

        {allLeads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm mt-1">Leads will appear here once you contact them.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {SECTIONS.map(({ key, heading, headingClass }) => {
              const sectionLeads = grouped[key]
              if (!sectionLeads || sectionLeads.length === 0) return null
              const badge = BADGE[key]
              return (
                <section key={key}>
                  <h2 className={`text-xs font-semibold uppercase tracking-widest mb-3 ${headingClass}`}>
                    {badge.icon} {heading} ({sectionLeads.length})
                  </h2>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                    {sectionLeads.map((lead) => {
                      const latest = latestByLead.get(lead.id)
                      const msgCount = countByLead.get(lead.id) ?? 0
                      return (
                        <Link
                          key={lead.id}
                          href={`/leads/${lead.id}`}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>
                                {badge.icon} {badge.label}
                              </span>
                            </div>
                            {latest?.message ? (
                              <p className="text-sm text-gray-500 truncate">
                                {latest.direction === "inbound" ? "← " : "→ "}{latest.message}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No messages recorded</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">{lead.phone} · {lead.source}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            {latest && (
                              <p className="text-xs text-gray-400 mb-1">
                                {new Date(latest.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </p>
                            )}
                            {msgCount > 0 && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                {msgCount} {msgCount === 1 ? "msg" : "msgs"}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
