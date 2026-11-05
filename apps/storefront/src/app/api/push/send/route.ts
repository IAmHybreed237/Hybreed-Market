import { NextResponse } from "next/server"
import webpush from "web-push"
import { readSubs } from "@/lib/push-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PUB = "BEdlQWNO6hVHifBml8fWFF3DCK1xXKnhp_oIqt5nFUlBGgnCopWy3ZyvtVOaiS8MUP2JUPyYcioPNHuO5qhayTY"
const PRIV = "9rnqVUHpdzDgyv-YQVZDROAgcpIhwruCf0YidRPpqiE"

webpush.setVapidDetails("mailto:hello@hybreed.dev", PUB, PRIV)

export async function POST(req: Request) {
  const { title, body, url } = await req.json().catch(() => ({}))
  const subs = readSubs()
  if (!subs.length)
    return NextResponse.json({ error: "No subscriptions" }, { status: 404 })
  const payload = JSON.stringify({
    title: title || "Hybreed",
    body: body || "Test notification",
    url: url || "/dk",
  })
  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification(s, payload))
  )
  return NextResponse.json({
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  })
}
