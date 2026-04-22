export const SEQUENCE_DAYS = [0, 1, 3, 5]

export function getFollowUpDates(startDate: Date): Date[] {
  return SEQUENCE_DAYS.map((day) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)
    return date
  })
}

export function getSequenceStepIndex(createdAt: Date, now = new Date()): number {
  const daysSince = Math.floor(
    (now.setHours(0, 0, 0, 0) - new Date(createdAt).setHours(0, 0, 0, 0)) / 86_400_000
  )
  const idx = SEQUENCE_DAYS.indexOf(daysSince)
  return idx !== -1 ? idx : SEQUENCE_DAYS.length - 1
}

export function shouldSendFollowUp(
  startDate: Date,
  lastContactedAt: Date | null,
  status: string,
  now = new Date()
): boolean {
  if (status === "replied" || status === "closed") return false

  const dates = getFollowUpDates(startDate)
  return dates.some((date) => {
    const dayMatch = date.toDateString() === now.toDateString()
    const notYetSent = !lastContactedAt || lastContactedAt < date
    return dayMatch && notYetSent
  })
}
