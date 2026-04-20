"use client"

import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/sign-in")
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-500 hover:text-gray-900"
    >
      Sign out
    </button>
  )
}
