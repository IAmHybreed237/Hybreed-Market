"use client"

const KEY = "hb_behavior"
const MAX_VIEWS = 24
const MAX_SEARCHES = 20

/** Fire-and-forget server-side tracking for trend aggregation. */
function beacon(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}

export type ViewInfo = { title: string; handle: string; image?: string; price?: number | null }
type View = { id: string; cats: string[]; at: number; info?: ViewInfo }
type Behavior = { views: View[]; searches: string[]; cats: Record<string, number> }

const empty: Behavior = { views: [], searches: [], cats: {} }

function read(): Behavior {
  if (typeof window === "undefined") return empty
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

function write(b: Behavior) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b))
  } catch {}
}

/** Record a product view - bumps its categories in the profile. */
export function trackView(
  productId: string,
  categoryIds: string[] = [],
  info?: ViewInfo
) {
  const b = read()
  b.views = [
    { id: productId, cats: categoryIds, at: Date.now(), info },
    ...b.views.filter((v) => v.id !== productId),
  ].slice(0, MAX_VIEWS)
  for (const c of categoryIds) b.cats[c] = (b.cats[c] || 0) + 1
  write(b)
  beacon({
    type: "view",
    product_id: productId,
    category_ids: categoryIds.slice(0, 10),
  })
}

export function trackSearch(term: string) {
  if (!term.trim()) return
  const b = read()
  b.searches = [term, ...b.searches.filter((s) => s !== term)].slice(0, MAX_SEARCHES)
  write(b)
  beacon({ type: "search", term: term.trim() })
}

export function getSearches(n = 10): string[] {
  return read().searches.slice(0, n)
}

export function removeSearch(term: string) {
  const b = read()
  b.searches = b.searches.filter((s) => s !== term)
  write(b)
}

/** Most-viewed category ids, weighted. */
export function getTopCategories(n = 3): string[] {
  return Object.entries(read().cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id)
}

export function getRecent(n = 12): string[] {
  return read().views.slice(0, n).map((v) => v.id)
}

export function getRecentProducts(n = 10): ViewInfo[] {
  return read()
    .views.slice(0, n)
    .map((v) => v.info)
    .filter((i): i is ViewInfo => Boolean(i?.handle))
}

export function hasProfile(): boolean {
  return read().views.length > 0
}
