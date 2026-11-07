import type { Metadata, Viewport } from "next"

import { searchProducts } from "@/lib/data/products"
import { getSearchFacets, type SearchFacets } from "@/lib/data/products"
import { listCategories } from "@/lib/data/categories"
import type { SortOptions } from "@/types/product"
import { SearchResultsMobile } from "@/components/sections/SearchResultsPage/SearchResultsMobile"
import { SearchRedirectDesktop } from "@/components/sections/SearchResultsPage/SearchRedirectDesktop"

export const dynamic = "force-dynamic"

export const viewport: Viewport = {
  themeColor: "#1D4ED8",
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const sp = await searchParams
  const q = typeof sp.q === "string" ? sp.q : ""
  return {
    title: q ? `"${q}" - Search` : "Search",
    robots: { index: false, follow: false },
  }
}

const RESERVED = new Set([
  "q",
  "sort",
  "cat",
  "sale",
  "min_price",
  "max_price",
  "page",
])

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const sp = await searchParams

  const q = typeof sp.q === "string" ? sp.q : ""
  const sort = typeof sp.sort === "string" ? sp.sort : "popular"
  const cat = typeof sp.cat === "string" ? sp.cat : undefined
  const sale = sp.sale === "1" || sp.sale === "true"
  const minPrice = +(typeof sp.min_price === "string" ? sp.min_price : 0) || undefined
  const maxPrice = +(typeof sp.max_price === "string" ? sp.max_price : 0) || undefined

  const attributes: Record<string, string[]> = {}
  for (const [key, raw] of Object.entries(sp)) {
    if (RESERVED.has(key) || !raw) continue
    const vals = (Array.isArray(raw) ? raw : [raw])
      .flatMap((v) => String(v).split(","))
      .filter(Boolean)
    if (vals.length) attributes[key] = vals
  }

  const sortBy =
    sort === "price_asc" || sort === "price_desc"
      ? (sort as SortOptions)
      : sort === "newest"
        ? ("created_at" as SortOptions)
        : undefined

  const [{ products, count }, facets, categories] = await Promise.all([
    q
      ? searchProducts({
          query: q,
          countryCode: locale,
          category_id: cat,
          attributes: Object.keys(attributes).length ? attributes : undefined,
          page: 1,
          limit: 24,
          sortBy,
        }).catch(() => ({ products: [], count: 0, nextPage: null }))
      : Promise.resolve({ products: [], count: 0, nextPage: null }),
    getSearchFacets().catch(() => ({ attributes: {} }) as SearchFacets),
    listCategories().catch(() => ({ categories: [] }) as any),
  ])

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

  return (
    <>
      <SearchResultsMobile
        locale={locale}
        initialQuery={q}
        initialSort={sort}
        initialCat={cat || ""}
        initialSale={sale}
        initialMin={minPrice ?? 0}
        initialMax={maxPrice ?? 0}
        initialAttrs={attributes}
        initialProducts={list}
        initialCount={count}
        facets={facets}
        categories={(categories as any)?.categories || []}
      />
      <SearchRedirectDesktop q={q} />
    </>
  )
}
