import { NextRequest, NextResponse } from "next/server"
import { runRealTimeAlerts, runDailyDigest } from "@/lib/alert-engine"

export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [realTime, digest] = await Promise.all([
    runRealTimeAlerts(),
    // Daily digest fires only between 8–9am server time
    new Date().getHours() === 8 ? runDailyDigest() : Promise.resolve(null),
  ])

  return NextResponse.json({
    realTime,
    digest: digest ?? "skipped",
    timestamp: new Date().toISOString(),
  })
}
