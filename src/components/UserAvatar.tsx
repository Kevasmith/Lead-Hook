"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "@/lib/auth-client"

interface UserAvatarProps {
  name?: string | null
  email?: string | null
  imageUrl?: string | null
}

export default function UserAvatar({ name, email, imageUrl }: UserAvatarProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const initials = name
    ? name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : email
    ? email.charAt(0).toUpperCase()
    : "?"

  const displayName = name || email?.split("@")[0] || "Account"

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push("/sign-in")
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white hover:bg-indigo-700 transition-colors overflow-hidden shrink-0"
        aria-label="Open user menu"
      >
        {imageUrl ? (
          <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
          <div className="px-3 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
            {email && <p className="text-xs text-gray-400 truncate mt-0.5">{email}</p>}
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            My Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
