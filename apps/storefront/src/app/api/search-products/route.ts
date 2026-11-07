import { NextResponse } from "next/server"

import { searchProducts } from "@/lib/data/products"
import type { SortOptions } from "@/types/product"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PAGE_SIZE = 24

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() || undefined
  const countryCode = url.searchParams.get("country") || "cm"
  const page = Math.max(1, +(url.searchParams.get("page") || 1))
  const sort = url.searchParams.get("sort") || undefined
  const cat = url.searchParams.get("cat") || undefined
  const sale = url.searchParams.get("sale") === "1"
  const minPrice = +(url.searchParams.get("min_price") || 0) || undefined
  const maxPrice = +(url.searchParams.get("max_price") || 0) || undefined

  // any non-reserved param becomes a product-attribute filter, same
  // convention as the categories listing page
  const RESERVED = new Set([
    "q",
    "country",
    "page",
    "sort",
    "cat",
    "sale",
    "min_price",
    "max_price",
  ])
  const attributes: Record<string, string[]> = {}
  url.searchParams.forEach((raw, key) => {
    if (RESERVED.has(key) || !raw) return
    attributes[key] = raw.split(",").filter(Boolean)
  })

  const sortBy =
    sort === "price_asc" || sort === "price_desc"
      ? (sort as SortOptions)
      : sort === "newest"
        ? "created_at"
        : undefined

  const { products, count } = await searchProducts({
    query: q,
    countryCode,
    category_id: cat,
    attributes: Object.keys(attributes).length ? attributes : undefined,
    page,
    limit: PAGE_SIZE,
    sortBy,
  }).catch(() => ({ products: [], count: 0, nextPage: null }))

  // client-filterable refinements applied per fetched page
  const priceOf = (p: any) =>
    p.variants?.[0]?.calculated_price?.calculated_amount ??
    p.variants?.[0]?.prices?.find(
      (pr: any) => String(pr.currency_code || "").toLowerCase() === "xaf"
    )?.amount
  const isDiscounted = (p: any) =>
    (p.variants || []).some(
      (v: any) =>
        v?.calculated_price?.original_amount >
        (v?.calculated_price?.calculated_amount ?? Infinity)
    )

  let list = products as any[]
  if (sale) list = list.filter(isDiscounted)
  if (minPrice || maxPrice) {
    list = list.filter((p) => {
      const pr = priceOf(p)
      if (pr == null) return false
      if (minPrice && pr < minPrice) return false
      if (maxPrice && pr > maxPrice) return false
      return true
    })
  }
  if (sort === "rating") {
    list = [...list].sort(
      (a, b) => (b.metadata?.rating ?? 0) - (a.metadata?.rating ?? 0)
    )
  } else if (sort === "discount") {
    list = [...list].sort(
      (a, b) =>
        (b.variants?.[0]?.calculated_price?.original_amount ?? 0) -
        (a.variants?.[0]?.calculated_price?.original_amount ?? 0)
    )
  }

  return NextResponse.json({ products: list, count })
}
