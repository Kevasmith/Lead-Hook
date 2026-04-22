import type { Lead } from "@/db/schema"
import { SEQUENCE_DAYS } from "./follow-up-scheduler"

export type ActionLabel = "CALL NOW" | "REACH OUT" | "FOLLOW UP" | "CLOSE OUT"

export interface PrioritizedLead extends Lead {
  action: ActionLabel
  reason: string
  score: number
}

function hoursSince(date: Date | string | null): number {
  if (!date) return Infinity
  return (Date.now() - new Date(date).getTime()) / 3_600_000
}

function daysSince(date: Date | string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000)
}

function sequenceStepDue(lead: Lead): boolean {
  if (lead.status === "replied" || lead.status === "closed") return false
  const days = daysSince(lead.createdAt)
  const followUpDay = SEQUENCE_DAYS.includes(days)
  if (!followUpDay) return false
  const notYetSent =
    !lead.lastContactedAt ||
    new Date(lead.lastContactedAt) < new Date(new Date().setHours(0, 0, 0, 0))
  return notYetSent
}

function isFinalStep(lead: Lead): boolean {
  return daysSince(lead.createdAt) >= SEQUENCE_DAYS[SEQUENCE_DAYS.length - 1]
}

export function scoreLeads(leads: Lead[]): PrioritizedLead[] {
  const active = leads.filter((l) => l.status !== "closed")

  const scored = active.map((lead): PrioritizedLead => {
    // Tier 1 — replied leads always first, ranked by recency of last contact
    if (lead.status === "replied") {
      const hrs = hoursSince(lead.lastContactedAt ?? lead.createdAt)
      return {
        ...lead,
        action: "CALL NOW",
        reason: hrs < 1
          ? `Replied ${Math.round(hrs * 60)}m ago`
          : hrs < 24
          ? `Replied ${Math.round(hrs)}h ago`
          : `Replied ${Math.floor(hrs / 24)}d ago`,
        score: 10_000 - hrs,
      }
    }

    // Tier 2 — new lead, never contacted, sitting >1h
    if (lead.status === "new" && !lead.lastContactedAt) {
      const hrs = hoursSince(lead.createdAt)
      if (hrs >= 1) {
        return {
          ...lead,
          action: "REACH OUT",
          reason: `New lead, no contact for ${Math.round(hrs)}h`,
          score: 5_000 - hrs,
        }
      }
    }

    // Tier 3 — final sequence step due (day 5+)
    if (isFinalStep(lead) && sequenceStepDue(lead)) {
      return {
        ...lead,
        action: "CLOSE OUT",
        reason: `Final follow-up — day ${daysSince(lead.createdAt)}`,
        score: 3_000 - hoursSince(lead.lastContactedAt ?? lead.createdAt),
      }
    }

    // Tier 4 — sequence step due today (day 1 or 3)
    if (sequenceStepDue(lead)) {
      return {
        ...lead,
        action: "FOLLOW UP",
        reason: `Follow-up due — day ${daysSince(lead.createdAt)}`,
        score: 2_000 - hoursSince(lead.lastContactedAt ?? lead.createdAt),
      }
    }

    // Tier 5 — contacted but no reply, going stale
    const hrs = hoursSince(lead.lastContactedAt ?? lead.createdAt)
    return {
      ...lead,
      action: "FOLLOW UP",
      reason: hrs >= 48
        ? `No response in ${Math.floor(hrs / 24)}d`
        : `Last touched ${Math.round(hrs)}h ago`,
      score: 1_000 - hrs,
    }
  })

  return scored.sort((a, b) => b.score - a.score)
}
