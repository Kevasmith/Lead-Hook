import { Filter } from "bad-words"

export const SPAM_THRESHOLD = 30

const profanityFilter = new Filter()

const SPAM_KEYWORDS = [
  "casino", "lottery", "prize", "winner", "jackpot",
  "click here", "free money", "make money fast", "work from home",
  "mlm", "crypto", "bitcoin", "investment opportunity", "guaranteed income",
  "earn from home", "passive income", "act now", "limited time offer",
  "no experience needed", "be your own boss",
]

const REAL_ESTATE_INTENT = [
  "buy", "sell", "home", "house", "property", "condo", "apartment",
  "looking", "interested", "help", "info", "price", "listing",
  "agent", "realtor", "mortgage", "rent", "invest", "move", "relocate",
  "bedrooms", "bathrooms", "garage", "yard", "neighborhood",
]

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10 && digits.length <= 15
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function containsAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase()
  return terms.some((t) => lower.includes(t))
}

export type LeadPayload = {
  name: string
  phone: string
  email: string
  source: string
  message?: string
}

export function scoreLeadQuality(lead: LeadPayload): number {
  let score = 50
  const allText = [lead.name, lead.email, lead.source, lead.message ?? ""].join(" ")

  // Positive signals
  if (isValidPhone(lead.phone)) score += 15
  if (isValidEmail(lead.email)) score += 10
  if ((lead.message?.length ?? 0) > 20) score += 10
  if (containsAny(allText, REAL_ESTATE_INTENT)) score += 15

  // Negative signals
  if (containsAny(allText, SPAM_KEYWORDS)) score -= 50
  if (profanityFilter.isProfane(allText)) score -= 40
  if (lead.message && lead.message.trim().length < 5) score -= 15
  if (lead.phone.replace(/\D/g, "").length < 10) score -= 20

  // Suspicious formatting
  if (/(.)\1{4,}/.test(lead.phone)) score -= 20       // repeated digits: 1111111111
  if (/^[a-z]{1,3}@/.test(lead.email.toLowerCase())) score -= 10  // throwaway email prefix

  return Math.max(0, Math.min(100, score))
}
