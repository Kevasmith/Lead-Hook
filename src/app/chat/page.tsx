import { connection } from "next/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { eq, desc, inArray, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import AppShell from "@/components/AppShell"

const BADGE: Record<string, { label: string; icon: string; className: string }> = {
  replied:   { label: "Hot",    icon: "🔥", className: "bg-red-50 text-red-600" },
  new:       { label: "Warm",   icon: "☀️", className: "bg-orange-50 text-orange-500" },
  contacted: { label: "Cold",   icon: "❄️", className: "bg-blue-50 text-blue-500" },
  closed:    { label: "Closed", icon: "✓",  className: "bg-gray-100 text-gray-400" },
}

async function getConversations(userId: string) {
  const userLeads = await db.select({ id: leads.id }).from(leads).where(eq(leads.userId, userId))
  if (userLeads.length === 0) return []

  const userLeadIds = userLeads.map((l) => l.id)

  const smsActivities = await db
    .select()
    .from(activities)
    .where(and(eq(activities.type, "sms"), inArray(activities.leadId, userLeadIds)))
    .orderBy(desc(activities.timestamp))

  if (smsActivities.length === 0) return []

  const leadIds = [...new Set(smsActivities.map((a) => a.leadId))]
  const leadRows = await db.select().from(leads).where(inArray(leads.id, leadIds))

  return leadIds
    .map((id) => {
      const lead = leadRows.find((l) => l.id === id)
      if (!lead) return null
      const msgs = smsActivities.filter((a) => a.leadId === id)
      const latest = msgs[0]
      const hasUnread = msgs.some((a) => a.direction === "inbound")
      return { lead, latest, hasUnread, messageCount: msgs.length }
    })
    .filter(Boolean) as {
      lead: typeof leads.$inferSelect
      latest: typeof activities.$inferSelect
      hasUnread: boolean
      messageCount: number
    }[]
}

export default async function ChatPage() {
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) redirect("/sign-in")
  const conversations = await getConversations(userId)

  return (
    <AppShell email={session?.user.email} name={session?.user.name} imageUrl={session?.user.image} emailVerified={session?.user.emailVerified} userId={userId}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <span className="text-sm text-gray-400">{conversations.length} conversations</span>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm mt-1">SMS threads appear here once leads are contacted.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {conversations.map(({ lead, latest, hasUnread, messageCount }) => {
              const badge = BADGE[lead.status]
              const isInbound = latest.direction === "inbound"
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
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium text-gray-900 truncate ${hasUnread ? "font-semibold" : ""}`}>
                        {lead.name}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(latest.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-sm truncate ${hasUnread ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                        {isInbound ? "" : "You: "}{latest.message ?? "(no message)"}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasUnread && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.icon} {badge.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5">{messageCount} messages · {lead.phone}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
