"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { Template } from "@/db/schema"

type Channel = "sms" | "email"

const CHANNEL_TABS: { value: Channel; label: string }[] = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
]

function TemplateForm({
  channel,
  initial,
  onSave,
  onCancel,
}: {
  channel: Channel
  initial?: Template
  onSave: (t: Template) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [subject, setSubject] = useState(initial?.subject ?? "")
  const [body, setBody] = useState(initial?.body ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !body.trim()) return
    setSaving(true)
    try {
      const url = initial ? `/api/templates/${initial.id}` : "/api/templates"
      const method = initial ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, channel, subject: subject || null, body }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      onSave(saved)
      toast.success(initial ? "Template updated" : "Template created")
    } catch {
      toast.error("Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Template name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Quick intro"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      {channel === "email" && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Body <span className="text-gray-400 font-normal">— use [Name] and [Source] as variables</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={channel === "sms" ? 2 : 4}
          maxLength={channel === "sms" ? 160 : undefined}
          placeholder={channel === "sms" ? "Hey [Name], …" : "Hi [Name],\n\n…"}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
        />
        {channel === "sms" && (
          <p className="text-xs text-gray-400 mt-0.5">{body.length}/160 characters</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim() || !body.trim()}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add template"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function TemplatesManager() {
  const [channel, setChannel] = useState<Channel>("sms")
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  async function load(ch: Channel) {
    setLoading(true)
    try {
      const res = await fetch(`/api/templates?channel=${ch}`)
      const data = await res.json()
      setTemplates(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(channel) }, [channel])

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success("Template deleted")
    } else {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="space-y-4">
      {/* Channel tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {CHANNEL_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setChannel(tab.value); setShowAdd(false); setEditing(null) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              channel === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd ? (
        <TemplateForm
          channel={channel}
          onSave={(t) => { setTemplates((prev) => [...prev, t]); setShowAdd(false) }}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline"
        >
          <span className="text-lg leading-none">+</span> New {channel.toUpperCase()} template
        </button>
      )}

      {/* Template list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No {channel.toUpperCase()} templates yet.</p>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id}>
              {editing === t.id ? (
                <TemplateForm
                  channel={channel}
                  initial={t}
                  onSave={(updated) => {
                    setTemplates((prev) => prev.map((x) => x.id === updated.id ? updated : x))
                    setEditing(null)
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    {t.subject && (
                      <p className="text-xs text-gray-500 mt-0.5">Subject: {t.subject}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{t.body}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditing(t.id)}
                      className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
