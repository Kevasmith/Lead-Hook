import OpenAI from "openai"
import { getOpenAiKey } from "./settings"

type PromptContext = {
  leadName: string
  source: string
  status: string
  lastMessage?: string | null
  type: "sms" | "email"
  intent: "initial" | "follow_up" | "reply" | "close"
}

const INTENT_INSTRUCTIONS: Record<PromptContext["intent"], string> = {
  initial:
    "This is the very first message to a new lead. Be warm, curious, and brief. Ask when they're free to connect.",
  follow_up:
    "The lead hasn't responded yet. Write a gentle, non-pushy follow-up. Keep it short and friendly.",
  reply:
    "The lead just replied to you. Write a warm response that continues the conversation and moves toward scheduling a call.",
  close:
    "The agent wants to wrap up this conversation. Write a polite closing message leaving the door open for future contact.",
}

export async function generateMessage(ctx: PromptContext): Promise<string> {
  const apiKey = await getOpenAiKey()
  if (!apiKey) return ""

  const openai = new OpenAI({ apiKey })

  const isSms = ctx.type === "sms"
  const lengthNote = isSms
    ? "Keep it under 160 characters. No emojis."
    : "Write 2-3 short paragraphs. Professional but friendly tone."

  const prompt = `
You are a helpful real estate agent assistant.
Lead name: ${ctx.leadName}
Lead source: ${ctx.source}
Current status: ${ctx.status}
${ctx.lastMessage ? `Their last message: "${ctx.lastMessage}"` : ""}
Message type: ${ctx.type.toUpperCase()}
Intent: ${INTENT_INSTRUCTIONS[ctx.intent]}
${lengthNote}
Write only the message body — no subject line, no "Hi [Name]:" prefix, no quotes.
  `.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You write concise, human-sounding real estate follow-up messages." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  })

  return completion.choices[0].message.content?.trim() ?? ""
}

// Kept for backwards compatibility
export async function generateReply(leadName: string, context: string): Promise<string> {
  return generateMessage({
    leadName,
    source: context,
    status: "replied",
    type: "sms",
    intent: "reply",
  })
}
