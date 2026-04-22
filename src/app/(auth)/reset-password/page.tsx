"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token. Request a new link.")
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    try {
      const { error: err } = await authClient.resetPassword({ newPassword: password, token })
      if (err) {
        setError(err.message ?? "Reset failed — the link may have expired.")
      } else {
        setDone(true)
        setTimeout(() => router.push("/sign-in"), 2500)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-5 text-center space-y-2">
        <p className="text-sm font-medium text-green-800">Password updated!</p>
        <p className="text-sm text-green-700">Redirecting you to sign in…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Lead Hook</h1>
        <p className="text-sm text-gray-500 mb-8">Choose a new password</p>

        <Suspense fallback={<div className="h-40 rounded-xl bg-gray-50 animate-pulse" />}>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/sign-in" className="font-medium text-gray-900 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
