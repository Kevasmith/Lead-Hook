import type { Lead } from "@/db/schema"

export interface ScoreBand {
  label: string
  color: string      // Tailwind text colour
  bg: string         // Tailwind bg colour
}

export interface LeadScore {
  total: number
  breakdown: {
    engagement: number   // 0–35
    source: number       // 0–25
    speed: number        // 0–25
    sentiment: number    // 0–15  (0 when no message provided)
  }
  band: ScoreBand
}

const BANDS: Array<{ min: number } & ScoreBand> = [
  { min: 80, label: "Hot",    color: "text-red-600",    bg: "bg-red-50"    },
  { min: 60, label: "Warm",   color: "text-orange-500", bg: "bg-orange-50" },
  { min: 40, label: "Active", color: "text-yellow-600", bg: "bg-yellow-50" },
  { min: 20, label: "Cool",   color: "text-blue-500",   bg: "bg-blue-50"   },
  { min:  0, label: "Cold",   color: "text-gray-400",   bg: "bg-gray-100"  },
]

function getBand(score: number): ScoreBand {
  return BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]
}

// ─── Engagement (0–35) ────────────────────────────────────────────────────

function scoreEngagement(lead: Lead): number {
  return { replied: 35, contacted: 20, new: 10, closed: 0 }[lead.status] ?? 0
}

// ─── Source quality (0–25) ────────────────────────────────────────────────

const SOURCE_TIERS: Array<{ keywords: string[]; pts: number }> = [
  { keywords: ["zillow", "realtor", "trulia", "mls", "redfin"],              pts: 25 },
  { keywords: ["website", "web", "form", "organic", "landing"],              pts: 20 },
  { keywords: ["referral", "referred", "word"],                              pts: 18 },
  { keywords: ["facebook", "fb", "instagram", "meta", "google", "ads", "ad"], pts: 12 },
]

function scoreSource(lead: Lead): number {
  const src = lead.source.toLowerCase()
  return SOURCE_TIERS.find((t) => t.keywords.some((k) => src.includes(k)))?.pts ?? 8
}

// ─── Response speed (0–25) ────────────────────────────────────────────────

function scoreSpeed(lead: Lead): number {
  const hoursSinceCreation = (Date.now() - new Date(lead.createdAt).getTime()) / 3_600_000

  if (lead.status === "replied" && lead.lastContactedAt) {
    const replyHrs = (new Date(lead.lastContactedAt).getTime() - new Date(lead.createdAt).getTime()) / 3_600_000
    if (replyHrs <= 2)  return 25
    if (replyHrs <= 12) return 20
    if (replyHrs <= 24) return 15
    if (replyHrs <= 48) return 10
    return 5
  }

  // Not yet replied — score freshness
  if (hoursSinceCreation <= 12)  return 20
  if (hoursSinceCreation <= 24)  return 15
  if (hoursSinceCreation <= 48)  return 10
  if (hoursSinceCreation <= 120) return 5
  return 2
}

// ─── Sentiment (0–15) ─────────────────────────────────────────────────────

const POSITIVE_STRONG = ["yes", "interested", "let's", "let me", "absolutely", "definitely", "when are you", "book", "schedule", "available", "love to", "sign me up"]
const POSITIVE_MILD   = ["sure", "ok", "okay", "sounds good", "maybe", "possibly", "perhaps", "could work", "tell me more"]
const NEGATIVE        = ["not interested", "stop", "remove", "unsubscribe", "wrong number", "don't contact", "do not contact", "leave me alone", "no thanks"]

function scoreSentiment(message: string | null | undefined): number {
  if (!message) return 0
  const m = message.toLowerCase()
  if (NEGATIVE.some((w) => m.includes(w)))        return 0
  if (POSITIVE_STRONG.some((w) => m.includes(w))) return 15
  if (POSITIVE_MILD.some((w) => m.includes(w)))   return 10
  return 7 // neutral — they replied, which is itself positive
}

// ─── Public API ───────────────────────────────────────────────────────────

/** Fast score — no sentiment. Max 85. Used in list views. */
export function scoreLeadBasic(lead: Lead): LeadScore {
  const engagement = scoreEngagement(lead)
  const source     = scoreSource(lead)
  const speed      = scoreSpeed(lead)
  const total      = engagement + source + speed
  return { total, breakdown: { engagement, source, speed, sentiment: 0 }, band: getBand(total) }
}

/** Full score — includes sentiment from last inbound message. Max 100. Used on detail page. */
export function scoreLeadFull(lead: Lead, lastInboundMessage: string | null | undefined): LeadScore {
  const engagement = scoreEngagement(lead)
  const source     = scoreSource(lead)
  const speed      = scoreSpeed(lead)
  const sentiment  = scoreSentiment(lastInboundMessage)
  const total      = engagement + source + speed + sentiment
  return { total, breakdown: { engagement, source, speed, sentiment }, band: getBand(total) }
}
