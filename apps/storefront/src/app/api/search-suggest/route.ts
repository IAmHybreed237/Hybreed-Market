import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/store/products?q=${encodeURIComponent(
        q
      )}&limit=8&fields=title,handle,thumbnail,images.url,*variants.calculated_price`,
      {
        headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
        next: { revalidate: 30 },
      }
    )
    if (!res.ok) return NextResponse.json({ products: [] })
    const data = await res.json()
    const products = (data.products || []).map((p: any) => ({
      title: p.title,
      handle: p.handle,
      image: p.thumbnail || p.images?.[0]?.url || null,
      price:
        p.variants?.[0]?.calculated_price?.calculated_amount ??
        p.variants?.[0]?.prices?.find(
          (pr: any) => String(pr.currency_code || "").toLowerCase() === "xaf"
        )?.amount ??
        null,
    }))
    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ products: [] })
  }
}
