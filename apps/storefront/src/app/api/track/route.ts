import { NextResponse } from "next/server"
import { getAuthHeaders } from "@/lib/data/cookies"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.type) {
    return NextResponse.json({ error: "Missing type" }, { status: 400 })
  }
  try {
    await fetch(`${BACKEND_URL}/store/tracking/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })
  } catch {
    // tracking is best-effort
  }
  return NextResponse.json({ ok: true })
}
