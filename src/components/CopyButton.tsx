"use client"

import { useState } from "react"

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 px-3 py-1 text-xs rounded bg-gray-900 text-white hover:bg-gray-700"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}
