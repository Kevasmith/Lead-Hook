"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

const POLL_INTERVAL = 30_000 // 30 seconds

export default function AutoRefresh() {
  const router = useRouter()
  const lastRepliedIds = useRef<Set<string>>(new Set())
  const initialized = useRef(false)

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const checkForReplies = useCallback(async () => {
    try {
      const res = await fetch("/api/leads")
      const leads: { id: string; name: string; status: string }[] = await res.json()

      const repliedLeads = leads.filter((l) => l.status === "replied")

      if (!initialized.current) {
        // Seed known replied IDs on first load — don't notify for existing ones
        repliedLeads.forEach((l) => lastRepliedIds.current.add(l.id))
        initialized.current = true
        return
      }

      // Find newly replied leads since last check
      const newReplies = repliedLeads.filter((l) => !lastRepliedIds.current.has(l.id))

      if (newReplies.length > 0) {
        newReplies.forEach((l) => lastRepliedIds.current.add(l.id))
        refresh()

        // Fire browser notifications
        if (Notification.permission === "granted") {
          newReplies.forEach((lead) => {
            const n = new Notification("Lead replied!", {
              body: `${lead.name} just replied to your message.`,
              icon: "/favicon.ico",
              tag: lead.id,
            })
            n.onclick = () => {
              window.focus()
              window.location.href = `/leads/${lead.id}`
            }
          })
        }
      } else {
        refresh()
      }
    } catch {
      // silently ignore fetch errors during polling
    }
  }, [refresh])

  useEffect(() => {
    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    // Initial seed
    checkForReplies()

    // Poll every 30s
    const interval = setInterval(checkForReplies, POLL_INTERVAL)

    // Refresh when tab becomes visible again
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkForReplies()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [checkForReplies])

  return null
}
