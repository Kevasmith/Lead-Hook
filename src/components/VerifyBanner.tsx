"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"

export default function VerifyBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem("verify-banner-dismissed") === "1") setDismissed(true)
  }, [])

  if (dismissed) return null

  function dismiss() {
    localStorage.setItem("verify-banner-dismissed", "1")
    setDismissed(true)
  }

  async function handleResend() {
    setLoading(true)
    try {
      await authClient.sendVerificationEmail({ email, callbackURL: "/" })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4">
      <p className="text-sm text-amber-800">
        <span className="font-medium">Verify your email</span> — check your inbox at{" "}
        <span className="font-medium">{email}</span> to confirm your account.
      </p>
      <div className="flex items-center gap-3 shrink-0">
        {sent ? (
          <span className="text-xs text-amber-700 font-medium">Email sent ✓</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-xs text-amber-700 font-medium hover:underline disabled:opacity-50"
          >
            {loading ? "Sending…" : "Resend"}
          </button>
        )}
        <button
          onClick={dismiss}
          className="text-amber-500 hover:text-amber-700"
          aria-label="Dismiss"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
