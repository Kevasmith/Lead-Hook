"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Lead } from "@/db/schema"

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  replied:   { label: "Hot",    className: "bg-red-50 text-red-600" },
  new:       { label: "Warm",   className: "bg-orange-50 text-orange-500" },
  contacted: { label: "Cold",   className: "bg-blue-50 text-blue-500" },
  closed:    { label: "Closed", className: "bg-gray-100 text-gray-400" },
}

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery]       = useState("")
  const [leads, setLeads]       = useState<Lead[]>([])
  const [results, setResults]   = useState<Lead[]>([])
  const [open, setOpen]         = useState(false)
  const [active, setActive]     = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load all leads once on mount
  useEffect(() => {
    fetch("/api/leads").then(r => r.json()).then(setLeads).catch(() => {})
  }, [])

  // Filter as user types
  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const q = query.toLowerCase()
    setResults(
      leads.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.source.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      ).slice(0, 6)
    )
    setOpen(true)
    setActive(-1)
  }, [query, leads])

  function navigate(lead: Lead) {
    router.push(`/leads/${lead.id}`)
    setQuery("")
    setOpen(false)
    inputRef.current?.blur()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === "Enter" && active >= 0) navigate(results[active])
    if (e.key === "Escape")    { setOpen(false); setQuery("") }
  }

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={containerRef} className="relative w-56">
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-400 focus-within:border-indigo-400 focus-within:bg-white transition">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => query && setOpen(true)}
          placeholder="Search leads…"
          className="bg-transparent flex-1 outline-none text-gray-700 placeholder:text-gray-400 text-sm"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false) }} className="text-gray-300 hover:text-gray-500">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden z-50">
          {results.map((lead, i) => {
            const badge = STATUS_BADGE[lead.status]
            return (
              <button
                key={lead.id}
                onMouseDown={() => navigate(lead)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${active === i ? "bg-indigo-50" : ""}`}
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                  <p className="text-xs text-gray-400 truncate">{lead.phone} · {lead.source}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>
                  {badge.label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {open && query && results.length === 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl border border-gray-100 shadow-lg px-4 py-3 z-50">
          <p className="text-sm text-gray-400">No leads found for "{query}"</p>
        </div>
      )}
    </div>
  )
}
