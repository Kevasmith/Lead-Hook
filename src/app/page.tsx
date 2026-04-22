import { connection } from "next/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { asc, desc, eq, sql } from "drizzle-orm"
import LeadsChart from "@/components/LeadsChart"
import LeadsTable from "@/components/LeadsTable"
import AddLeadButton from "@/components/AddLeadButton"
import AutoRefresh from "@/components/AutoRefresh"
import Sidebar from "@/components/Sidebar"
import UserAvatar from "@/components/UserAvatar"
import SearchBar from "@/components/SearchBar"
import PriorityQueue from "@/components/PriorityQueue"
import VerifyBanner from "@/components/VerifyBanner"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { shouldSendFollowUp } from "@/lib/follow-up-scheduler"
import { scoreLeadBasic } from "@/lib/lead-scorer"
import { getSettings } from "@/lib/settings"

const STATUS_PRIORITY = sql`CASE status
  WHEN 'replied' THEN 1
  WHEN 'new' THEN 2
  WHEN 'contacted' THEN 3
  WHEN 'closed' THEN 4
  ELSE 5
END`

const STATUS_CARD_STYLE: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  replied:   { bg: "bg-red-50",    text: "text-red-600",    label: "Hot",    icon: "🔥" },
  new:       { bg: "bg-orange-50", text: "text-orange-500", label: "Warm",   icon: "☀️" },
  contacted: { bg: "bg-blue-50",   text: "text-blue-500",   label: "Cold",   icon: "❄️" },
  closed:    { bg: "bg-gray-100",  text: "text-gray-400",   label: "Closed", icon: "✓"  },
}

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default async function DashboardPage() {
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/sign-in")
  const settingsRow = await getSettings(session.user.id)
  if (!settingsRow?.onboardingCompleted) redirect("/onboarding")
  const logoUrl = settingsRow?.logoUrl ?? null

  const userId = session?.user?.id
  const allLeads = userId
    ? await db.select().from(leads).where(eq(leads.userId, userId)).orderBy(asc(STATUS_PRIORITY))
    : []

  const leadIds = allLeads.map((l) => l.id)

  const recentActivities = leadIds.length > 0
    ? await db
        .select({
          id: activities.id,
          type: activities.type,
          direction: activities.direction,
          message: activities.message,
          timestamp: activities.timestamp,
          leadName: leads.name,
          leadId: leads.id,
        })
        .from(activities)
        .innerJoin(leads, eq(activities.leadId, leads.id))
        .orderBy(desc(activities.timestamp))
        .limit(8)
    : []

  const recentLeads = [...allLeads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const hot       = allLeads.filter((l) => l.status === "replied")
  const dueToday  = allLeads.filter((l) => l.status !== "replied" && shouldSendFollowUp(l.createdAt, l.lastContactedAt, l.status))
  const newToday  = allLeads.filter((l) => l.status === "new" && new Date(l.createdAt) >= today)

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const firstName = session?.user.name?.split(" ")[0] || session?.user.email?.split("@")[0] || "there"

  const subtext =
    hot.length > 0       ? `${hot.length} hot lead${hot.length > 1 ? "s" : ""} need your attention` :
    dueToday.length > 0  ? `${dueToday.length} follow-up${dueToday.length > 1 ? "s" : ""} due today` :
    newToday.length > 0  ? `${newToday.length} new lead${newToday.length > 1 ? "s" : ""} to reach out to` :
                           "You're all caught up"

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AutoRefresh />
      <Sidebar logoUrl={logoUrl} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        {session?.user.emailVerified === false && session.user.email && (
          <VerifyBanner email={session.user.email} />
        )}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
          <SearchBar />
          <div className="ml-auto flex items-center gap-3">
            <UserAvatar name={session?.user.name} email={session?.user.email} imageUrl={session?.user.image} />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Greeting row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}!</h1>
              <p className="text-sm text-gray-500 mt-0.5">{subtext}</p>
            </div>
            <AddLeadButton />
          </div>

          {/* Today's Priorities */}
          <div className="mb-5">
            <PriorityQueue />
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* ── Left column (2/3) ── */}
            <div className="xl:col-span-2 space-y-5">

              {/* Recent Leads cards */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Recent Leads</h2>
                  <Link href="/history" className="text-xs text-gray-400 hover:text-gray-600">View all →</Link>
                </div>

                {recentLeads.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No leads yet — add your first one.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {recentLeads.map((lead) => {
                      const style = STATUS_CARD_STYLE[lead.status]
                      return (
                        <Link
                          key={lead.id}
                          href={`/leads/${lead.id}`}
                          className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className={`${style.bg} h-20 flex items-center justify-center`}>
                            <span className="text-2xl font-bold text-gray-400">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs font-semibold text-gray-900 truncate">{lead.name}</p>
                            <p className="text-xs text-gray-400 truncate">{lead.source}</p>
                            <span className={`inline-flex items-center gap-0.5 text-xs font-medium mt-1 ${style.text}`}>
                              {style.icon} {style.label}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* All Leads table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">All Leads</h2>
                  <span className="text-xs text-gray-400">{allLeads.length} total</span>
                </div>
                <LeadsTable leads={allLeads} scores={Object.fromEntries(allLeads.map((l) => [l.id, scoreLeadBasic(l)]))} />
              </div>
            </div>

            {/* ── Right column (1/3) ── */}
            <div className="xl:col-span-1 space-y-5">

              {/* Activity Feed */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
                </div>

                {recentActivities.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No activity yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {recentActivities.map((a) => {
                      const isInbound = a.direction === "inbound"
                      const desc = isInbound
                        ? `${a.leadName} replied via ${a.type.toUpperCase()}`
                        : `${a.type.toUpperCase()} sent to ${a.leadName}`
                      return (
                        <li key={a.id} className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isInbound ? "bg-red-50" : "bg-gray-100"}`}>
                            {a.type === "sms" ? (
                              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-3.5 h-3.5 ${isInbound ? "text-red-500" : "text-gray-500"}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                              </svg>
                            ) : (
                              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-3.5 h-3.5 ${isInbound ? "text-red-500" : "text-gray-500"}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-700 font-medium leading-tight">{desc}</p>
                            {a.message && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">{a.message}</p>
                            )}
                            <p className="text-xs text-gray-300 mt-0.5">{timeAgo(a.timestamp)}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Chart */}
              <LeadsChart leads={allLeads} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
