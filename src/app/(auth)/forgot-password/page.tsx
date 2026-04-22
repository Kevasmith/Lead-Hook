"use client"

import { useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      })
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Lead Hook</h1>
        <p className="text-sm text-gray-500 mb-8">Reset your password</p>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4">
              <p className="text-sm text-green-800 font-medium">Check your inbox</p>
              <p className="text-sm text-green-700 mt-1">
                If <span className="font-medium">{email}</span> has an account, we sent a reset link. It expires in 1 hour.
              </p>
            </div>
            <p className="text-center text-sm text-gray-500">
              <Link href="/sign-in" className="font-medium text-gray-900 hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link href="/sign-in" className="font-medium text-gray-900 hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
