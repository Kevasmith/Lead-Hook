const SEQUENCE_DAYS = [0, 1, 3, 5]

export function getFollowUpDates(startDate: Date): Date[] {
  return SEQUENCE_DAYS.map((day) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)
    return date
  })
}

export function shouldSendFollowUp(
  startDate: Date,
  lastContactedAt: Date | null,
  status: string,
  now = new Date()
): boolean {
  // Never send automated follow-ups to leads who replied or are closed
  if (status === "replied" || status === "closed") return false

  const dates = getFollowUpDates(startDate)
  return dates.some((date) => {
    const dayMatch = date.toDateString() === now.toDateString()
    const notYetSent = !lastContactedAt || lastContactedAt < date
    return dayMatch && notYetSent
  })
}
