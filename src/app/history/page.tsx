import { connection } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { desc, inArray, eq } from "drizzle-orm"
import Link from "next/link"

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  replied:   { label: "Replied",   className: "bg-red-100 text-red-700" },
  contacted: { label: "Contacted", className: "bg-blue-100 text-blue-700" },
  closed:    { label: "Closed",    className: "bg-gray-100 text-gray-500" },
  new:       { label: "New",       className: "bg-yellow-100 text-yellow-700" },
}

export default async function HistoryPage() {
  await connection()
  const activeLeads = await db
    .select()
    .from(leads)
    .where(inArray(leads.status, ["contacted", "replied", "closed"]))
    .orderBy(desc(leads.lastContactedAt))

  // For each lead, get their latest message
  const leadIds = activeLeads.map((l) => l.id)

  const allActivities =
    leadIds.length > 0
      ? await db
          .select()
          .from(activities)
          .where(inArray(activities.leadId, leadIds))
          .orderBy(desc(activities.timestamp))
      : []

  // Group latest activity per lead
  const latestByLead = new Map<string, typeof allActivities[number]>()
  for (const a of allActivities) {
    if (!latestByLead.has(a.leadId)) latestByLead.set(a.leadId, a)
  }

  // Count messages per lead
  const countByLead = new Map<string, number>()
  for (const a of allActivities) {
    countByLead.set(a.leadId, (countByLead.get(a.leadId) ?? 0) + 1)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 w-full bg-white min-h-screen">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
        ← Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Conversation History</h1>
      <p className="text-sm text-gray-500 mb-8">
        Leads you&apos;ve spoken to or are actively speaking with
      </p>

      {activeLeads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No conversations yet</p>
          <p className="text-sm mt-1">Leads will appear here once you contact them.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 shadow-sm">
          {activeLeads.map((lead) => {
            const latest = latestByLead.get(lead.id)
            const msgCount = countByLead.get(lead.id) ?? 0
            const badge = STATUS_BADGE[lead.status]

            return (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar initial */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    {latest?.message ? (
                      <p className="text-sm text-gray-500 truncate">
                        {latest.direction === "inbound" ? "← " : "→ "}
                        {latest.message}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No messages recorded</p>
                    )}

                    <p className="text-xs text-gray-400 mt-0.5">{lead.phone} · {lead.source}</p>
                  </div>

                  {/* Right side */}
                  <div className="shrink-0 text-right">
                    {latest && (
                      <p className="text-xs text-gray-400 mb-1">
                        {new Date(latest.timestamp).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                    {msgCount > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {msgCount} {msgCount === 1 ? "msg" : "msgs"}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
