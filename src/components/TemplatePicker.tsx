"use client"

import { useEffect, useRef, useState } from "react"
import type { Template } from "@/db/schema"

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\[(\w+)\]/g, (_, key) => vars[key] ?? `[${key}]`)
}

export default function TemplatePicker({
  channel,
  leadName,
  leadSource,
  onSelect,
}: {
  channel: "sms" | "email"
  leadName: string
  leadSource: string
  onSelect: (body: string, subject?: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    if (loaded) return
    const res = await fetch(`/api/templates?channel=${channel}`)
    const data = await res.json()
    setTemplates(Array.isArray(data) ? data : [])
    setLoaded(true)
  }

  function handleToggle() {
    if (!open) load()
    setOpen((v) => !v)
  }

  function handleSelect(t: Template) {
    const vars = { Name: leadName, Source: leadSource }
    const body = interpolate(t.body, vars)
    const subject = t.subject ? interpolate(t.subject, vars) : undefined
    onSelect(body, subject)
    setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
        </svg>
        Templates
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-20 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {!loaded ? (
            <p className="text-xs text-gray-400 px-4 py-3">Loading…</p>
          ) : templates.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No templates yet.</p>
          ) : (
            <ul>
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(t)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <p className="text-sm font-medium text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{t.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-gray-100 px-4 py-2">
            <a href="/templates" className="text-xs text-indigo-600 hover:underline">
              Manage templates →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
