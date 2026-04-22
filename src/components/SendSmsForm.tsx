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

export default function SendSmsForm({
  leadId,
  leadName,
  leadSource = "",
}: {
  leadId: string
  leadName: string
  leadSource?: string
}) {
  const router = useRouter()
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
        body: JSON.stringify({ type: "sms", intent }),
      })
      const data = await res.json()
      if (data.message) setMessage(data.message)
      else toast.error("No suggestion returned — check your OpenAI key in Settings")
    } catch {
      toast.error("Failed to generate suggestion")
    } finally {
      setSuggesting(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (data.outcome === "sent") {
        toast.success(`SMS sent to ${leadName}`)
        setMessage("")
        router.refresh()
      } else {
        toast.error("SMS failed to send")
      }
    } catch {
      toast.error("SMS failed to send")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Intent selector + AI button */}
      <div className="flex items-center gap-2">
        <select
          value={intent}
          onChange={(e) => setIntent(e.target.value as Intent)}
          className="text-sm rounded-lg border border-gray-200 px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {INTENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSuggest}
          disabled={suggesting}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
        >
          {suggesting ? "Generating…" : "✦ Suggest"}
        </button>
        <TemplatePicker
          channel="sms"
          leadName={leadName}
          leadSource={leadSource}
          onSelect={(body) => setMessage(body)}
        />
        {bookingLink && (
          <button
            type="button"
            onClick={() => setMessage((m) => m ? `${m}\n${bookingLink}` : bookingLink)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
            title={bookingLink}
          >
            📅 Book
          </button>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Message to ${leadName}…`}
          maxLength={160}
          rows={2}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="self-end px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "…" : "Send"}
        </button>
      </form>
      <p className="text-xs text-gray-400">{message.length}/160 characters</p>
    </div>
  )
}
