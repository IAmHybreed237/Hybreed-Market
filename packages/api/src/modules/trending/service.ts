import { MedusaService } from "@medusajs/framework/utils"
import TrendingEvent from "./models/event"

export const TRENDING_MODULE = "trending"

const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000
const WINDOW_FALLBACK_TAKE = 5000

const bump = (map: Map<string, number>, key?: string | null) => {
  if (!key) return
  map.set(key, (map.get(key) || 0) + 1)
}

const top = (map: Map<string, number>, n: number) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }))

export default class TrendingService extends MedusaService({
  TrendingEvent,
}) {
  async recordEvent(input: {
    type: "search" | "view"
    term?: string | null
    productId?: string | null
    categoryIds?: string[] | null
    customerId?: string | null
  }) {
    await this.createTrendingEvents({
      type: input.type,
      term: input.term?.trim().toLowerCase() || null,
      product_id: input.productId || null,
      category_ids: input.categoryIds?.length
        ? input.categoryIds.join(",")
        : null,
      customer_id: input.customerId || null,
    })

    // occasional cheap prune so the table stays small
    if (Math.random() < 0.02) {
      try {
        const cutoff = new Date(Date.now() - PRUNE_AFTER_MS)
        const old = await this.listTrendingEvents(
          { created_at: { $lt: cutoff } },
          { take: 500 }
        )
        if (old?.length) {
          await this.deleteTrendingEvents(old.map((e: any) => e.id))
        }
      } catch {
        // pruning is best-effort
      }
    }
  }

  /** Aggregated search/view activity within the last `windowMinutes`. */
  async getTrends(windowMinutes = 30) {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000)
    let events: any[] = []
    try {
      events =
        (await this.listTrendingEvents(
          { created_at: { $gte: since } },
          { take: WINDOW_FALLBACK_TAKE, order: { created_at: "DESC" } }
        )) || []
    } catch {
      events =
        (await this.listTrendingEvents(
          {},
          { take: WINDOW_FALLBACK_TAKE, order: { created_at: "DESC" } }
        )) || []
      events = events.filter((e) => new Date(e.created_at) >= since)
    }

    const terms = new Map<string, number>()
    const products = new Map<string, number>()
    const categories = new Map<string, number>()

    for (const e of events) {
      if (e.type === "search") {
        bump(terms, e.term)
      } else if (e.type === "view") {
        bump(products, e.product_id)
        for (const c of String(e.category_ids || "").split(",")) {
          bump(categories, c.trim())
        }
      }
    }

    return {
      window_minutes: windowMinutes,
      terms: top(terms, 20),
      product_ids: top(products, 20),
      category_ids: top(categories, 20),
    }
  }
}
