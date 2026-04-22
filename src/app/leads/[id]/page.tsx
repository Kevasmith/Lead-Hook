import { connection } from "next/server"
import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import AppShell from "@/components/AppShell"
import LeadActions from "@/components/LeadActions"
import SendSmsForm from "@/components/SendSmsForm"
import SendEmailForm from "@/components/SendEmailForm"
import NotesEditor from "@/components/NotesEditor"
import ConversationThread from "@/components/ConversationThread"
import ScoreBadge from "@/components/ScoreBadge"
import { scoreLeadFull } from "@/lib/lead-scorer"

const STATUS_BADGE: Record<string, { label: string; icon: string; className: string }> = {
  replied:   { label: "Hot",    icon: "🔥", className: "bg-red-50 text-red-600" },
  new:       { label: "Warm",   icon: "☀️", className: "bg-orange-50 text-orange-500" },
  contacted: { label: "Cold",   icon: "❄️", className: "bg-blue-50 text-blue-500" },
  closed:    { label: "Closed", icon: "✓",  className: "bg-gray-100 text-gray-400" },
}

const STATUS_HINT: Record<string, string> = {
  new:       "New lead — send your first message",
  contacted: "Waiting for reply — send a follow-up",
  replied:   "Lead replied — respond now",
  closed:    "Conversation closed",
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })
  const { id } = await params

  const userId = session?.user?.id
  if (!userId) redirect("/sign-in")

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1)
  if (!lead) notFound()
  if (lead.userId && lead.userId !== userId) notFound()

  const activityLog = await db
    .select()
    .from(activities)
    .where(eq(activities.leadId, id))
    .orderBy(desc(activities.timestamp))

  const lastInbound = activityLog.find((a) => a.direction === "inbound")?.message ?? null
  const leadScore = scoreLeadFull(lead, lastInbound)
  const badge = STATUS_BADGE[lead.status]

  return (
    <AppShell email={session?.user.email} name={session?.user.name} imageUrl={session?.user.image} emailVerified={session?.user.emailVerified} userId={userId}>
      <div className="max-w-2xl mx-auto">
        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 shrink-0">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                    {badge.icon} {badge.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{lead.phone} · {lead.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lead.source} · Added {new Date(lead.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-2">
                  <ScoreBadge score={leadScore} showBreakdown />
                </div>
              </div>
            </div>
            <LeadActions lead={lead} />
          </div>
          <div className="mt-4">
            <NotesEditor leadId={lead.id} initialNotes={lead.notes ?? ""} />
          </div>
        </div>

        {/* Status hint */}
        {lead.status !== "closed" && (
          <div className="text-xs font-medium text-gray-500 bg-white border border-gray-100 rounded-xl px-4 py-2.5 mb-4 shadow-sm">
            {STATUS_HINT[lead.status]}
          </div>
        )}

        {/* Two-column: forms left, thread right on wider screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Send SMS</h2>
              <SendSmsForm leadId={lead.id} leadName={lead.name} leadSource={lead.source} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Send Email</h2>
              <SendEmailForm leadId={lead.id} leadName={lead.name} leadEmail={lead.email} leadSource={lead.source} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Conversation ({activityLog.length})
            </h2>
            <ConversationThread activities={activityLog} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
