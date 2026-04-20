export const dynamic = "force-dynamic"

import Link from "next/link"
import { db } from "@/db"
import { leads } from "@/db/schema"
import { asc, sql } from "drizzle-orm"
import LeadList from "@/components/LeadList"
import AddLeadButton from "@/components/AddLeadButton"
import AutoRefresh from "@/components/AutoRefresh"
import SignOutButton from "@/components/SignOutButton"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const STATUS_PRIORITY = sql`CASE status
  WHEN 'replied' THEN 1
  WHEN 'new' THEN 2
  WHEN 'contacted' THEN 3
  WHEN 'closed' THEN 4
  ELSE 5
END`

async function getLeads() {
  return db.select().from(leads).orderBy(asc(STATUS_PRIORITY))
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const allLeads = await getLeads()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const hot = allLeads.filter((l) => l.status === "replied")
  const newToday = allLeads.filter(
    (l) => l.status === "new" && new Date(l.createdAt) >= today
  )
  const active = allLeads.filter(
    (l) =>
      l.status === "contacted" ||
      (l.status === "new" && new Date(l.createdAt) < today)
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 w-full bg-white min-h-screen">
      <AutoRefresh />
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Lead Hook</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{session?.user.email}</span>
          <Link href="/history" className="text-sm text-gray-500 hover:text-gray-900">History</Link>
          <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-900">Settings</Link>
          <SignOutButton />
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-8">Who should you contact today?</p>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4 text-sm text-gray-500">
          {hot.length > 0 && (
            <span className="text-red-600 font-medium">{hot.length} hot</span>
          )}
          {newToday.length > 0 && (
            <span className="text-yellow-600 font-medium">{newToday.length} new today</span>
          )}
          {active.length > 0 && (
            <span>{active.length} active</span>
          )}
        </div>
        <AddLeadButton />
      </div>

      {hot.length === 0 && newToday.length === 0 && active.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No active leads</p>
          <p className="text-sm mt-1">Add your first lead to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {hot.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-3">
                Hot — replied ({hot.length})
              </h2>
              <LeadList leads={hot} />
            </section>
          )}
          {newToday.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-yellow-600 mb-3">
                New Today ({newToday.length})
              </h2>
              <LeadList leads={newToday} />
            </section>
          )}
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Active ({active.length})
              </h2>
              <LeadList leads={active} />
            </section>
          )}
        </div>
      )}
    </main>
  )
}
