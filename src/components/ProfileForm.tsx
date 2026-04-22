"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

interface ProfileData {
  name: string
  email: string
  imageUrl: string | null
  jobTitle: string | null
  phone: string | null
}

export default function ProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter()

  const [name, setName] = useState(profile.name)
  const [jobTitle, setJobTitle] = useState(profile.jobTitle ?? "")
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [imageUrl, setImageUrl] = useState(profile.imageUrl ?? "")
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoMsg, setInfoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const initials = name
    ? name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : profile.email.charAt(0).toUpperCase()

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    setSavingInfo(true)
    setInfoMsg(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          jobTitle: jobTitle.trim() || null,
          phone: phone.trim() || null,
          imageUrl: imageUrl.trim() || null,
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      setInfoMsg({ type: "success", text: "Profile saved." })
      router.refresh()
    } catch {
      setInfoMsg({ type: "error", text: "Something went wrong. Try again." })
    } finally {
      setSavingInfo(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords don't match." })
      return
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "error", text: "Password must be at least 8 characters." })
      return
    }
    setSavingPw(true)
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      })
      if (result.error) throw new Error(result.error.message)
      setPwMsg({ type: "success", text: "Password changed." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong."
      setPwMsg({ type: "error", text: msg })
    } finally {
      setSavingPw(false)
    }
  }

  const previewUrl = imageUrl.trim() || null

  return (
    <div className="space-y-6">
      {/* Avatar preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white overflow-hidden shrink-0">
            {previewUrl ? (
              <img src={previewUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{name || "Your Name"}</p>
            <p className="text-sm text-gray-400">{jobTitle || "Real Estate Agent"}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <form onSubmit={handleSaveInfo} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Profile Info</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Real Estate Agent"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Profile Photo URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/your-photo.jpg"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">Paste a direct image URL. Upload support coming soon.</p>
        </div>

        {infoMsg && (
          <p className={`text-sm ${infoMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>
            {infoMsg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={savingInfo}
          className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {savingInfo ? "Saving…" : "Save Profile"}
        </button>
      </form>

      {/* Password change */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {pwMsg && (
          <p className={`text-sm ${pwMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>
            {pwMsg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={savingPw}
          className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {savingPw ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  )
}
