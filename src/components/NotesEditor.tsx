"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"

export default function NotesEditor({
  leadId,
  initialNotes,
}: {
  leadId: string
  initialNotes: string
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    setNotes(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(value), 1000)
  }

  async function save(value: string) {
    setSaving(true)
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
      })
    } catch {
      toast.error("Failed to save notes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Notes
        </label>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add notes about this lead…"
        rows={3}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
      />
    </div>
  )
}
