import { NextResponse } from "next/server"
import { getAuthHeaders } from "@/lib/data/cookies"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

// only these backend namespaces may be reached through the proxy
const ALLOWED = ["product-reviews", "review-actions", "review-authors"]

const forward = async (req: Request, path: string[], method: "GET" | "POST") => {
  if (!ALLOWED.includes(path[0]) || path.some((p) => !/^[\w-]+$/.test(p))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  const search = new URL(req.url).search
  const device = req.headers.get("x-hb-device")
  try {
    const res = await fetch(`${BACKEND_URL}/store/${path.join("/")}${search}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
        ...(device ? { "x-hb-device": device } : {}),
        ...(await getAuthHeaders()),
      },
      body: method === "POST" ? await req.text() : undefined,
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path, "GET")
}

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path, "POST")
}
