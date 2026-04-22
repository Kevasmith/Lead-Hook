import type { LeadScore } from "@/lib/lead-scorer"

export default function ScoreBadge({
  score,
  showBreakdown = false,
}: {
  score: LeadScore
  showBreakdown?: boolean
}) {
  const { total, band, breakdown } = score

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${band.bg} ${band.color}`}>
        {total}
        <span className="font-normal opacity-70">{band.label}</span>
      </span>

      {showBreakdown && (
        <div className="text-xs text-gray-400 space-y-0.5 pl-0.5">
          <BreakdownRow label="Engagement" value={breakdown.engagement} max={35} />
          <BreakdownRow label="Source"     value={breakdown.source}     max={25} />
          <BreakdownRow label="Speed"      value={breakdown.speed}      max={25} />
          {breakdown.sentiment > 0 && (
            <BreakdownRow label="Sentiment" value={breakdown.sentiment} max={15} />
          )}
        </div>
      )}
    </div>
  )
}

function BreakdownRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-gray-400">{label}</span>
      <div className="w-20 h-1 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-500">{value}/{max}</span>
    </div>
  )
}
