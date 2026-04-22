const store = new Map<string, number[]>()

// Purge stale keys every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const cutoff = Date.now() - 60_000
  for (const [key, timestamps] of store) {
    const fresh = timestamps.filter((t) => t > cutoff)
    if (fresh.length === 0) store.delete(key)
    else store.set(key, fresh)
  }
}, 300_000)

export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const cutoff = now - windowMs
  const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff)

  if (timestamps.length >= limit) {
    const oldest = timestamps[0]
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }

  timestamps.push(now)
  store.set(key, timestamps)
  return { allowed: true, retryAfter: 0 }
}
