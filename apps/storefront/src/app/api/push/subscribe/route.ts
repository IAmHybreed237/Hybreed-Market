import { NextResponse } from "next/server"
import { addSub } from "@/lib/push-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const sub = await req.json().catch(() => null)
  if (!sub?.endpoint)
    return NextResponse.json({ error: "Bad subscription" }, { status: 400 })
  addSub(sub)
  return NextResponse.json({ ok: true })
}
