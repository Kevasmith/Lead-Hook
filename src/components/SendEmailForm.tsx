"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import TemplatePicker from "./TemplatePicker"
import { useBookingLink } from "@/hooks/useBookingLink"

type Intent = "initial" | "follow_up" | "reply" | "close"

const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: "follow_up", label: "Follow up" },
  { value: "reply", label: "Reply to lead" },
  { value: "initial", label: "First contact" },
  { value: "close", label: "Wrap up" },
]

export default function SendEmailForm({
  leadId,
  leadName,
  leadEmail,
  leadSource = "",
}: {
  leadId: string
  leadName: string
  leadEmail: string
  leadSource?: string
}) {
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [intent, setIntent] = useState<Intent>("follow_up")
  const [loading, setLoading] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const bookingLink = useBookingLink()

  async function handleSuggest() {
    setSuggesting(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", intent }),
      })
      const data = await res.json()
      if (data.message) {
        // Split first line as subject if not set
        const lines = data.message.split("\n").filter(Boolean)
        if (!subject && lines.length > 1) {
          setSubject(lines[0].replace(/^Subject:\s*/i, ""))
          setMessage(lines.slice(1).join("\n").trim())
        } else {
          setMessage(data.message)
        }
      } else {
        toast.error("No suggestion returned — check your OpenAI key in Settings")
      }
    } catch {
      toast.error("Failed to generate suggestion")
    } finally {
      setSuggesting(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (data.outcome === "sent") {
        toast.success(`Email sent to ${leadEmail}`)
        setSubject("")
        setMessage("")
        router.refresh()
      } else {
        toast.error("Email failed to send")
      }
    } catch {
      toast.error("Email failed to send")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={intent}
          onChange={(e) => setIntent(e.target.value as Intent)}
          className="text-sm rounded-lg border border-gray-200 px-2.5 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {INTENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSuggest}
          disabled={suggesting}
          className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
        >
          {suggesting ? "Generating…" : "✦ Suggest"}
        </button>
        <TemplatePicker
          channel="email"
          leadName={leadName}
          leadSource={leadSource}
          onSelect={(body, subject) => {
            if (subject) setSubject(subject)
            setMessage(body)
          }}
        />
        {bookingLink && (
          <button
            type="button"
            onClick={() => setMessage((m) => m ? `${m}\n\nBook a time here: ${bookingLink}` : `Book a time here: ${bookingLink}`)}
            className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 whitespace-nowrap"
            title={bookingLink}
          >
            📅 Book
          </button>
        )}
      </div>

      <form onSubmit={handleSend} className="space-y-2.5">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Email body to ${leadName}…`}
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Sending to {leadEmail}</p>
          <button
            type="submit"
            disabled={loading || !subject.trim() || !message.trim()}
            className="px-5 py-2 rounded-lg bg-gray-900 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "Sending…" : "Send Email"}
          </button>
        </div>
      </form>
    </div>
  )
}
