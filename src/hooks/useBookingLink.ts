"use client"

import { useEffect, useState } from "react"

export function useBookingLink() {
  const [bookingLink, setBookingLink] = useState<string>("")

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setBookingLink(d.bookingLink ?? ""))
      .catch(() => {})
  }, [])

  return bookingLink
}
