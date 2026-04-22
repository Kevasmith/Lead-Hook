"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Already verified — send them home
  if (session?.user.emailVerified) {
    router.replace("/")
    return null
  }

  async function handleResend() {
    if (!session?.user.email) return
    setLoading(true)
    try {
      await authClient.sendVerificationEmail({
        email: session.user.email,
        callbackURL: "/",
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-indigo-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
        <p className="text-sm text-gray-500 mb-6">
          We sent a verification link to{" "}
          <span className="font-medium text-gray-700">{session?.user.email ?? "your email"}</span>.
          Click the link to activate your account.
        </p>

        {sent ? (
          <p className="text-sm text-green-600 font-medium">Email resent — check your inbox.</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
          >
            {loading ? "Sending…" : "Didn't get it? Resend"}
          </button>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            You can still{" "}
            <a href="/" className="text-gray-600 hover:underline">
              continue to the dashboard
            </a>
            {" "}— some features may be limited until you verify.
          </p>
        </div>
      </div>
    </div>
  )
}
