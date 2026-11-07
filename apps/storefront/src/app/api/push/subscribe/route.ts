import { NextResponse } from "next/server"
import { getAuthHeaders } from "@/lib/data/cookies"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

const backendHeaders = async () => ({
  "Content-Type": "application/json",
  "x-publishable-api-key": PUBLISHABLE_KEY,
  ...(await getAuthHeaders()),
})

export async function POST(req: Request) {
  const sub = await req.json().catch(() => null)
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Bad subscription" }, { status: 400 })
  }
  const res = await fetch(`${BACKEND_URL}/store/push/subscribe`, {
    method: "POST",
    headers: await backendHeaders(),
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    }),
  })
  if (!res.ok) {
    return NextResponse.json(
      { error: "Backend rejected subscription" },
      { status: res.status }
    )
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { endpoint } = (await req.json().catch(() => ({}))) as {
    endpoint?: string
  }
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
  }
  const res = await fetch(
    `${BACKEND_URL}/store/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`,
    { method: "DELETE", headers: await backendHeaders() }
  )
  return NextResponse.json({ ok: res.ok })
}
