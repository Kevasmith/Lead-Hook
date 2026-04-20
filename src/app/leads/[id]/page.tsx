import { db } from "@/db"
import { leads, activities } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import LeadActions from "@/components/LeadActions"
import SendSmsForm from "@/components/SendSmsForm"
import SendEmailForm from "@/components/SendEmailForm"
import NotesEditor from "@/components/NotesEditor"
import ConversationThread from "@/components/ConversationThread"

const STATUS_LABEL: Record<string, string> = {
  new: "New lead — send your first message",
  contacted: "Waiting for reply — send a follow-up",
  replied: "Lead replied — respond now",
  closed: "Conversation closed",
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1)
  if (!lead) notFound()

  const activityLog = await db
    .select()
    .from(activities)
    .where(eq(activities.leadId, id))
    .orderBy(desc(activities.timestamp))

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 w-full bg-white min-h-screen">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
        ← Back to dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{lead.phone} · {lead.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Source: {lead.source} · Added {new Date(lead.createdAt).toLocaleDateString()}
            </p>
          </div>
          <LeadActions lead={lead} />
        </div>
        <NotesEditor leadId={lead.id} initialNotes={lead.notes ?? ""} />
      </div>

      {/* Status hint */}
      {lead.status !== "closed" && (
        <div className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 mb-6">
          {STATUS_LABEL[lead.status]}
        </div>
      )}

      {/* Send SMS */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Send SMS</h2>
        <SendSmsForm leadId={lead.id} leadName={lead.name} />
      </div>

      {/* Send Email */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Send Email</h2>
        <SendEmailForm leadId={lead.id} leadName={lead.name} leadEmail={lead.email} />
      </div>

      {/* Conversation Thread */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Conversation ({activityLog.length})
        </h2>
        <ConversationThread activities={activityLog} />
      </div>
    </main>
  )
}
