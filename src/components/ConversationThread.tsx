"use client"

import type { Activity } from "@/db/schema"

const OUTCOME_STYLES: Record<Activity["outcome"], string> = {
  sent: "text-gray-400",
  replied: "text-green-600",
  failed: "text-red-500",
}

const OUTCOME_LABEL: Record<Activity["outcome"], string> = {
  sent: "Sent",
  replied: "Delivered",
  failed: "Failed",
}

export default function ConversationThread({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-400">No messages yet.</p>
  }

  return (
    <ul className="space-y-3">
      {[...activities].reverse().map((a) => {
        const isInbound = a.direction === "inbound"
        return (
          <li key={a.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-xs ${isInbound ? "items-start" : "items-end"} flex flex-col gap-1`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isInbound
                    ? "bg-gray-100 text-gray-900 rounded-tl-sm"
                    : "bg-gray-900 text-white rounded-tr-sm"
                }`}
              >
                {a.message ?? <span className="italic opacity-60">(no message recorded)</span>}
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${isInbound ? "" : "flex-row-reverse"}`}>
                <span className="text-gray-400">
                  {new Date(a.timestamp).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {!isInbound && (
                  <span className={OUTCOME_STYLES[a.outcome]}>
                    {OUTCOME_LABEL[a.outcome]}
                  </span>
                )}
                {isInbound && (
                  <span className="text-green-600 font-medium">Lead replied</span>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
