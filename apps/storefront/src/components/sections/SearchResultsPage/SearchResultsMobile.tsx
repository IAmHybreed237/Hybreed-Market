"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import clsx from "clsx"

import { SearchResultCard } from "./SearchResultCard"

const PAGE_BG = "#F5F5F7"
const BRAND = "#2563EB"
const BRAND_TINT = "#DBEAFE"
const SALE = "#E11D48"
const MUTED = "#6B6B76"
const TEXT = "#1F1F23"
const HEADER_BG = "#1D4ED8"

type Filters = {
  sale: boolean
  min: number
  max: number
  cat: string
  attrs: Record<string, string[]>
}

const SORTS = [
  { id: "popular", label: "Popular" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "rating", label: "Highest rated" },
  { id: "newest", label: "Newest" },
  { id: "discount", label: "Biggest discount" },
]

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const SortGlyph = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 4v13" />
    <path d="M4 14l3 3 3-3" />
    <path d="M17 20V7" />
    <path d="M14 10l3-3 3 3" />
  </svg>
)

const FilterGlyph = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="4" y1="7" x2="20" y2="7" />
    <circle cx="9" cy="7" r="2" fill={HEADER_BG} />
    <line x1="4" y1="12" x2="20" y2="12" />
    <circle cx="15" cy="12" r="2" fill={HEADER_BG} />
    <line x1="4" y1="17" x2="20" y2="17" />
    <circle cx="7" cy="17" r="2" fill={HEADER_BG} />
  </svg>
)

const BackGlyph = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const SearchGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)

const ClearGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="3" strokeLinecap="round" aria-hidden>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
)

const PercentBadge = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden className="shrink-0">
    <path
      d="M12 2l1.8 3.6L18 4l-.7 3.4L21 9l-3.2 1.9.4 3.6-3-1.7L12 17l-3.2-3.2-3 1.7.4-3.6L3 9l3.7-1.6L6 4l4.2.6z"
      fill={SALE}
      transform="scale(0.92) translate(1,1)"
    />
    <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">
      %
    </text>
  </svg>
)

const fmtPrice = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} XAF`

const buildParams = (
  f: Filters,
  sort: string,
  q: string,
  page: number
) => {
  const sp = new URLSearchParams()
  if (q) sp.set("q", q)
  sp.set("country", "cm")
  sp.set("page", String(page))
  if (sort !== "popular") sp.set("sort", sort)
  if (f.cat) sp.set("cat", f.cat)
  if (f.sale) sp.set("sale", "1")
  if (f.min) sp.set("min_price", String(f.min))
  if (f.max) sp.set("max_price", String(f.max))
  for (const [k, vals] of Object.entries(f.attrs)) {
    if (vals.length) sp.set(k, vals.join(","))
  }
  return sp.toString()
}

const activeFilterCount = (f: Filters, facetKeys: string[]) => {
  let n = 0
  if (f.sale) n++
  if (f.min || f.max) n++
  if (f.cat) n++
  n += facetKeys.filter((k) => (f.attrs[k] || []).length > 0).length
  return n
}

export const SearchResultsMobile = ({
  locale,
  initialQuery,
  initialSort,
  initialCat,
  initialSale,
  initialMin,
  initialMax,
  initialAttrs,
  initialProducts,
  initialCount,
  facets,
  categories,
}: {
  locale: string
  initialQuery: string
  initialSort: string
  initialCat: string
  initialSale: boolean
  initialMin: number
  initialMax: number
  initialAttrs: Record<string, string[]>
  initialProducts: any[]
  initialCount: number
  facets: { attributes: Record<string, { value: string; count: number }[]> }
  categories: any[]
}) => {
  const router = useRouter()
  const { locale: loc } = useParams() as { locale?: string }
  const l = loc || locale || "cm"

  const [q, setQ] = useState(initialQuery)
  const [sort, setSort] = useState(initialSort)
  const [filters, setFilters] = useState<Filters>({
    sale: initialSale,
    min: initialMin,
    max: initialMax,
    cat: initialCat,
    attrs: initialAttrs,
  })
  const [products, setProducts] = useState<any[]>(initialProducts)
  const [count, setCount] = useState(initialCount)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [related, setRelated] = useState<string[]>([])
  const [sortSheet, setSortSheet] = useState(false)
  const [filterSheet, setFilterSheet] = useState(false)
  const [sheetClosing, setSheetClosing] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ q, sort, filters })
  stateRef.current = { q, sort, filters }

  const facetEntries = useMemo(
    () => Object.entries(facets?.attributes || {}),
    [facets]
  )
  const facetKeys = useMemo(() => facetEntries.map(([k]) => k), [facetEntries])
  const filterCount = activeFilterCount(filters, facetKeys)

  // flat list of selectable categories
  const categoryOptions = useMemo(() => {
    const out: { id: string; name: string }[] = []
    const walk = (cats: any[]) => {
      for (const c of cats || []) {
        if (c?.id && c?.name) out.push({ id: c.id, name: c.name })
        walk(c.category_children || c.children || [])
      }
    }
    walk(categories as any[])
    return out
  }, [categories])

  const fetchPage = useCallback(
    async (p: number, append: boolean) => {
      const { q: qq, sort: ss, filters: ff } = stateRef.current
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(
          `/api/search-products?${buildParams(ff, ss, qq, p)}`
        )
        const data = await res.json()
        const list = data.products || []
        setProducts((prev) => (append ? [...prev, ...list] : list))
        setCount(data.count ?? 0)
        setPage(p)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // refetch from page 1 whenever query/sort/filters change
  const filtersKey = JSON.stringify({ sort, filters })
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    setProducts([])
    fetchPage(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, q])

  // related searches from the suggest API
  useEffect(() => {
    if (!q.trim()) return
    const t = setTimeout(() => {
      fetch(`/api/search-suggest?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json())
        .then((d) =>
          setRelated(
            (d.products || [])
              .map((p: any) => p.title)
              .filter(Boolean)
              .slice(0, 10)
          )
        )
        .catch(() => setRelated([]))
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          const totalPages = Math.ceil(count / 24) || 1
          if (page < totalPages) fetchPage(page + 1, true)
        }
      },
      { rootMargin: "400px 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loading, page, count, fetchPage])

  // scroll restoration per URL
  useEffect(() => {
    const key = `search_scroll:${l}:${q}:${filtersKey}`
    const saved = sessionStorage.getItem(key)
    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo(0, +(saved || 0))
        sessionStorage.removeItem(key)
      })
    }
    const onScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY))
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l, q, filtersKey])

  // keep the URL shareable
  const syncUrl = useCallback(
    (next: { q?: string; sort?: string; filters?: Filters }) => {
      const qq = next.q ?? q
      const ss = next.sort ?? sort
      const ff = next.filters ?? filters
      const params = buildParams(ff, ss, qq, 1)
      router.replace(`/${l}/search?${params}`, { scroll: false })
    },
    [q, sort, filters, l, router]
  )

  const setQuery = (v: string) => {
    setQ(v)
    syncUrl({ q: v })
  }

  const applySort = (id: string) => {
    setSort(id)
    setSortSheet(false)
    syncUrl({ sort: id })
  }

  const applyFilters = (next: Filters) => {
    setFilters(next)
    setFilterSheet(false)
    syncUrl({ filters: next })
  }

  const relatedChip = (term: string) => {
    setQuery(term)
    setFilters({
      sale: false,
      min: 0,
      max: 0,
      cat: "",
      attrs: {},
    })
    syncUrl({
      q: term,
      filters: { sale: false, min: 0, max: 0, cat: "", attrs: {} },
    })
  }

  const closeSheet = (which: "sort" | "filter") => {
    setSheetClosing(true)
    setTimeout(() => {
      setSortSheet(false)
      setFilterSheet(false)
      setSheetClosing(false)
    }, 200)
  }

  const openSearchInput = () => {
    router.push(`/${l}/?focus=search`)
  }

  const skeletons = (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] rounded-[24px] bg-[#E4E4EA]" />
          <div className="px-3 pt-2 space-y-2">
            <div className="h-5 w-2/3 rounded bg-[#E4E4EA]" />
            <div className="h-4 w-1/2 rounded bg-[#E4E4EA]" />
            <div className="h-4 w-3/4 rounded bg-[#E4E4EA]" />
            <div className="h-4 w-1/3 rounded bg-[#E4E4EA]" />
            <div className="mx-2 mt-3 h-11 rounded-full bg-[#E4E4EA]" />
          </div>
        </div>
      ))}
    </>
  )

  return (
    <div
      className="min-h-screen"
      style={{
        background: PAGE_BG,
        animation: "searchPageIn .3s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <style>{`
        @keyframes searchPageIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes sheetDown{from{transform:translateY(0)}to{transform:translateY(100%)}}
        @media (prefers-reduced-motion: reduce){
          [style*="searchPageIn"],[style*="sheetUp"],[style*="sheetDown"]{animation:none!important}
        }
      `}</style>

      {/* A. blue header block */}
      <div
        className="w-full"
        style={{
          background: HEADER_BG,
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: 15,
        }}
      >
        {/* header row */}
        <div className="h-11 flex items-center relative px-2">
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.back()}
            className="w-11 h-11 flex items-center justify-center shrink-0"
          >
            <BackGlyph />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-white text-[20px] font-semibold">
            Search
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Sort"
              onClick={() => setSortSheet(true)}
              className="relative w-11 h-11 flex items-center justify-center"
            >
              <SortGlyph />
              {sort !== "popular" && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444]" />
              )}
            </button>
            <button
              type="button"
              aria-label="Filters"
              onClick={() => setFilterSheet(true)}
              className="relative w-11 h-11 flex items-center justify-center"
            >
              <FilterGlyph />
              {filterCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-white text-[#2563EB] text-[11px] font-semibold flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* search field */}
        <button
          type="button"
          onClick={openSearchInput}
          className="mx-4 mt-px h-[51px] rounded-[20px] flex items-center gap-2 px-3 w-[calc(100%-32px)] text-left"
          style={{ background: "rgba(0,0,0,0.28)" }}
        >
          <SearchGlyph />
          <span className="flex-1 min-w-0 text-white text-[20px] truncate">
            {q || "Search"}
          </span>
          {q && (
            <span
              role="button"
              aria-label="Clear search"
              onClick={(e) => {
                e.stopPropagation()
                openSearchInput()
              }}
              className="w-11 h-11 -mr-2 flex items-center justify-center"
            >
              <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center">
                <ClearGlyph />
              </span>
            </span>
          )}
        </button>
      </div>

      {/* B. related searches */}
      {related.length > 0 && (
        <div className="mt-5 flex gap-[7px] overflow-x-auto scrollbar-hide px-4 snap-x snap-proximity">
          {related.map((r) => (
            <button
              key={r}
              onClick={() => relatedChip(r)}
              className="h-[38px] px-3 rounded-[14px] bg-white border border-[#E4E4EA] text-[17px] text-[#1F1F23] whitespace-nowrap shrink-0 snap-start"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* C. filter chips - sticky */}
      <div
        className="sticky top-0 z-30 mt-4 pb-2 flex gap-[7px] overflow-x-auto scrollbar-hide px-4 snap-x snap-proximity"
        style={{
          background: PAGE_BG,
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {/* Sale */}
        <button
          onClick={() =>
            applyFilters({ ...filters, sale: !filters.sale })
          }
          className={clsx(
            "h-[38px] px-3.5 rounded-[14px] flex items-center gap-2 text-[17px] whitespace-nowrap shrink-0 snap-start border",
            filters.sale
              ? "bg-[#DBEAFE] border-[1.5px] border-[#2563EB] text-[#2563EB] font-medium"
              : "bg-white border-[#E4E4EA] text-[#1F1F23]"
          )}
        >
          <PercentBadge />
          Sale
        </button>

        {/* Price */}
        <FilterChip
          active={Boolean(filters.min || filters.max)}
          label={
            filters.min || filters.max
              ? `Price: ${filters.min ? fmtPrice(filters.min) : "0"} - ${
                  filters.max ? fmtPrice(filters.max) : "∞"
                }`
              : "Price"
          }
          onClick={() => setFilterSheet(true)}
          onClear={() =>
            applyFilters({ ...filters, min: 0, max: 0 })
          }
        />

        {/* Category */}
        <FilterChip
          active={Boolean(filters.cat)}
          label={
            filters.cat
              ? `Category: ${
                  categoryOptions.find((c) => c.id === filters.cat)?.name ||
                  "Selected"
                }`
              : "Category"
          }
          onClick={() => setFilterSheet(true)}
          onClear={() => applyFilters({ ...filters, cat: "" })}
        />

        {/* attribute facets */}
        {facetEntries.map(([key, buckets]) => {
          const vals = filters.attrs[key] || []
          const active = vals.length > 0
          return (
            <FilterChip
              key={key}
              active={active}
              label={
                active
                  ? `${key}: ${vals.join(", ")}`
                  : key.charAt(0).toUpperCase() + key.slice(1)
              }
              onClick={() => setFilterSheet(true)}
              onClear={() =>
                applyFilters({
                  ...filters,
                  attrs: { ...filters.attrs, [key]: [] },
                })
              }
            />
          )
        })}
      </div>

      {/* D. product grid */}
      <div className="mt-4 grid grid-cols-2 gap-[2px] px-0">
        {error && products.length === 0 && (
          <div className="col-span-2 flex flex-col items-center py-10 gap-3">
            <p className="text-[15px] text-[#6B6B76]">
              Couldn&apos;t load results
            </p>
            <button
              onClick={() => fetchPage(1, false)}
              className="h-11 px-6 rounded-full bg-[#2563EB] text-white text-[15px] font-semibold"
            >
              Try again
            </button>
          </div>
        )}

        {!error && loading && products.length === 0 && skeletons}

        {!loading && !error && products.length === 0 && q && (
          <div className="col-span-2 flex flex-col items-center pt-14 pb-8 px-6 text-center">
            <svg
              width="72"
              height="72"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C7C7D1"
              strokeWidth="1.4"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            <p className="mt-4 text-[20px] font-semibold text-[#1F1F23]">
              Nothing found for &quot;{q}&quot;
            </p>
            <p className="mt-1.5 text-[16px] text-[#6B6B76]">
              Check the spelling or try a more general word
            </p>
            {filterCount > 0 && (
              <button
                onClick={() =>
                  applyFilters({
                    sale: false,
                    min: 0,
                    max: 0,
                    cat: "",
                    attrs: {},
                  })
                }
                className="mt-5 h-11 px-6 rounded-full bg-[#2563EB] text-white text-[15px] font-semibold"
              >
                Reset filters
              </button>
            )}
            {related.length > 0 && (
              <div className="mt-6 w-full">
                <p className="text-[13px] font-semibold text-[#6B6B76] uppercase tracking-wide mb-2.5 text-left">
                  Popular searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {related.slice(0, 8).map((r) => (
                    <button
                      key={r}
                      onClick={() => relatedChip(r)}
                      className="h-[34px] px-3 rounded-full bg-white border border-[#E4E4EA] text-[14px] text-[#1F1F23]"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {products.map((p) => (
          <SearchResultCard key={p.id} p={p} />
        ))}

        {loading && products.length > 0 && skeletons}

        <div ref={sentinelRef} className="col-span-2 h-2" />
      </div>

      {/* sort bottom sheet */}
      {sortSheet && (
        <Sheet onClose={() => closeSheet("sort")} closing={sheetClosing}>
          <p className="text-[17px] font-semibold text-[#1F1F23] mb-3 px-1">
            Sort by
          </p>
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => applySort(s.id)}
              className="w-full flex items-center gap-3 py-3 px-1 text-left"
            >
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  sort === s.id ? "border-[#2563EB]" : "border-[#C7C7D1]"
                }`}
              >
                {sort === s.id && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                )}
              </span>
              <span
                className={`text-[16px] ${
                  sort === s.id
                    ? "font-semibold text-[#2563EB]"
                    : "text-[#1F1F23]"
                }`}
              >
                {s.label}
              </span>
            </button>
          ))}
        </Sheet>
      )}

      {/* filter bottom sheet */}
      {filterSheet && (
        <Sheet onClose={() => closeSheet("filter")} closing={sheetClosing} tall>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[17px] font-semibold text-[#1F1F23]">Filters</p>
            <button
              onClick={() =>
                setFilters({ sale: false, min: 0, max: 0, cat: "", attrs: {} })
              }
              className="text-[15px] font-medium text-[#2563EB]"
            >
              Reset
            </button>
          </div>

          <FilterGroup title="On sale">
            <Toggle
              on={filters.sale}
              onChange={(v) => setFilters({ ...filters, sale: v })}
            />
          </FilterGroup>

          <FilterGroup title="Price (XAF)">
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Min"
                value={filters.min || ""}
                onChange={(e) =>
                  setFilters({ ...filters, min: +e.target.value || 0 })
                }
                className="flex-1 h-11 rounded-xl bg-[#F0F0F3] px-3 text-[15px] outline-none"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Max"
                value={filters.max || ""}
                onChange={(e) =>
                  setFilters({ ...filters, max: +e.target.value || 0 })
                }
                className="flex-1 h-11 rounded-xl bg-[#F0F0F3] px-3 text-[15px] outline-none"
              />
            </div>
          </FilterGroup>

          {categoryOptions.length > 0 && (
            <FilterGroup title="Category">
              <div className="flex flex-wrap gap-2">
                {categoryOptions.slice(0, 24).map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        cat: filters.cat === c.id ? "" : c.id,
                      })
                    }
                    className={clsx(
                      "h-9 px-3 rounded-full text-[14px] border",
                      filters.cat === c.id
                        ? "bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] font-medium"
                        : "bg-white border-[#E4E4EA] text-[#1F1F23]"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </FilterGroup>
          )}

          {facetEntries.map(([key, buckets]) => (
            <FilterGroup key={key} title={key}>
              <div className="flex flex-wrap gap-2">
                {(buckets || []).map((b) => {
                  const sel = (filters.attrs[key] || []).includes(b.value)
                  return (
                    <button
                      key={b.value}
                      onClick={() => {
                        const cur = filters.attrs[key] || []
                        const next = sel
                          ? cur.filter((v) => v !== b.value)
                          : [...cur, b.value]
                        setFilters({
                          ...filters,
                          attrs: { ...filters.attrs, [key]: next },
                        })
                      }}
                      className={clsx(
                        "h-9 px-3 rounded-full text-[14px] border",
                        sel
                          ? "bg-[#DBEAFE] border-[#2563EB] text-[#2563EB] font-medium"
                          : "bg-white border-[#E4E4EA] text-[#1F1F23]"
                      )}
                    >
                      {b.value}
                    </button>
                  )
                })}
              </div>
            </FilterGroup>
          ))}

          <button
            onClick={() => applyFilters(filters)}
            className="sticky bottom-0 w-full h-12 rounded-full bg-[#2563EB] text-white text-[16px] font-semibold mt-4"
          >
            Show {count} items
          </button>
        </Sheet>
      )}
    </div>
  )
}

const FilterChip = ({
  active,
  label,
  onClick,
  onClear,
}: {
  active: boolean
  label: string
  onClick: () => void
  onClear: () => void
}) => (
  <span
    className={clsx(
      "h-[38px] px-3.5 rounded-[14px] flex items-center gap-2 text-[17px] whitespace-nowrap shrink-0 snap-start border",
      active
        ? "bg-[#DBEAFE] border-[1.5px] border-[#2563EB] text-[#2563EB] font-medium"
        : "bg-white border-[#E4E4EA] text-[#1F1F23]"
    )}
  >
    <button onClick={onClick} className="flex items-center gap-2 min-w-0">
      <span className="truncate max-w-[160px]">{label}</span>
      {!active && <ChevronDown />}
    </button>
    {active && (
      <button
        aria-label="Clear filter"
        onClick={(e) => {
          e.stopPropagation()
          onClear()
        }}
        className="w-4 h-4 flex items-center justify-center shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>
    )}
  </span>
)

const FilterGroup = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="mb-4">
    <p className="text-[14px] font-semibold text-[#6B6B76] uppercase tracking-wide mb-2">
      {title}
    </p>
    {children}
  </div>
)

const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
  <button
    role="switch"
    aria-checked={on}
    onClick={() => onChange(!on)}
    className={clsx(
      "w-12 h-7 rounded-full relative transition-colors",
      on ? "bg-[#2563EB]" : "bg-[#D9D9E0]"
    )}
  >
    <span
      className={clsx(
        "absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all",
        on ? "left-[22px]" : "left-0.5"
      )}
    />
  </button>
)

const Sheet = ({
  children,
  onClose,
  closing,
  tall,
}: {
  children: React.ReactNode
  onClose: () => void
  closing: boolean
  tall?: boolean
}) => (
  <div className="fixed inset-0 z-[70]">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div
      className={clsx(
        "absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] px-4 pt-3",
        tall ? "max-h-[75vh]" : ""
      )}
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
        animation: closing ? "sheetDown .2s ease-in both" : "sheetUp .28s cubic-bezier(.32,.72,0,1) both",
        maxHeight: tall ? "75vh" : undefined,
        overflowY: "auto",
      }}
    >
      <div className="w-10 h-1 rounded-full bg-[#E4E4EA] mx-auto mb-3" />
      {children}
    </div>
  </div>
)
