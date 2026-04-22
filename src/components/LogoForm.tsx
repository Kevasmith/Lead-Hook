"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function LogoForm() {
  const router = useRouter()
  const [url, setUrl]         = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setUrl(d.logoUrl ?? ""))
      .finally(() => setFetching(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: url }),
      })
      if (!res.ok) throw new Error()
      toast.success("Logo updated")
      router.refresh()
    } catch {
      toast.error("Failed to save logo")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
      <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
      <div className="h-3 w-48 bg-gray-100 rounded mb-4" />
      <div className="h-10 bg-gray-100 rounded-lg" />
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-800 mb-0.5">Brand Logo</h2>
      <p className="text-xs text-gray-400 mb-4">
        Paste a public image URL to replace the default icon in the sidebar.
      </p>
      <form onSubmit={handleSave} className="flex gap-2">
        <div className="flex items-center gap-3 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          {url ? (
            <img src={url} alt="Logo preview" className="w-7 h-7 rounded-lg object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
              </svg>
            </div>
          )}
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourdomain.com/logo.png"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        {url && (
          <button
            type="button"
            onClick={async () => {
              setUrl("")
              await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logoUrl: "" }),
              })
              router.refresh()
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-400 hover:bg-gray-50 shrink-0"
          >
            Reset
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-gray-900 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 shrink-0"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  )
}
