import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  REACTION_TYPES,
  REVIEW_EXTRAS_MODULE,
} from "../../../../modules/review-extras/service"
import { actorKey, authorLevel, authorName } from "../../../../lib/review-extras"

const SORTS = new Set(["newest", "oldest", "rating_desc", "rating_asc", "helpful", "with_media"])

/**
 * Public, published reviews for one product with summary, media strip,
 * author tiers and the viewer's reaction/follow state.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id as string
  const variantId = (req.query.variant_id as string) || null
  const sort = SORTS.has(String(req.query.sort)) ? String(req.query.sort) : "newest"
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const extras = req.scope.resolve(REVIEW_EXTRAS_MODULE) as any

  const { data: [product] } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "reviews.id",
      "reviews.rating",
      "reviews.customer_note",
      "reviews.seller_note",
      "reviews.status",
      "reviews.created_at",
      "reviews.updated_at",
      "reviews.customer.id",
      "reviews.customer.first_name",
      "reviews.customer.last_name",
      "reviews.customer.metadata",
    ],
    filters: { id: productId },
  })

  const published = ((product as any)?.reviews ?? []).filter(
    (r: any) => r && r.status === "published"
  )
  const ids = published.map((r: any) => r.id)

  const [details, media] = ids.length
    ? await Promise.all([
        extras.listReviewDetails({ review_id: ids }),
        extras.listReviewAssets({ review_id: ids }, { order: { rank: "ASC" } }),
      ])
    : [[], []]

  const detailBy = new Map<string, any>(details.map((d: any) => [d.review_id, d]))
  const mediaBy = new Map<string, any[]>()
  for (const m of media) {
    const list = mediaBy.get(m.review_id) ?? []
    list.push({ id: m.id, type: m.type, url: m.url, thumbnail_url: m.thumbnail_url, review_id: m.review_id })
    mediaBy.set(m.review_id, list)
  }

  // summary always covers all reviews; the list + media strip follow the tab
  const distribution: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }
  let sum = 0
  for (const r of published) {
    sum += Number(r.rating) || 0
    const k = String(Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0))))
    distribution[k] = (distribution[k] || 0) + 1
  }
  const average = published.length ? Math.round((sum / published.length) * 10) / 10 : null

  let scoped = variantId
    ? published.filter((r: any) => detailBy.get(r.id)?.variant_id === variantId)
    : published

  const reactionRows = ids.length ? await extras.listReviewReactions({ review_id: ids }) : []
  const counts = new Map<string, Record<string, number>>()
  for (const row of reactionRows) {
    const c = counts.get(row.review_id) ?? { like: 0, heart: 0, clap: 0 }
    c[row.type] = (c[row.type] || 0) + 1
    counts.set(row.review_id, c)
  }

  const ts = (r: any) => new Date(r.created_at).getTime()
  const helpful = (r: any) => {
    const c = counts.get(r.id)
    return c ? c.like + c.heart + c.clap : 0
  }
  if (sort === "with_media") scoped = scoped.filter((r: any) => mediaBy.has(r.id))
  scoped = [...scoped].sort((a: any, b: any) => {
    switch (sort) {
      case "oldest": return ts(a) - ts(b)
      case "rating_desc": return b.rating - a.rating || ts(b) - ts(a)
      case "rating_asc": return a.rating - b.rating || ts(b) - ts(a)
      case "helpful": return helpful(b) - helpful(a) || ts(b) - ts(a)
      default: return ts(b) - ts(a)
    }
  })

  const page = scoped.slice(offset, offset + limit)

  // author tiers: published review count per author across the platform
  const mediaReviewIds = new Set(media.map((m: any) => m.review_id))
  const authorIds = [
    ...new Set(
      [...page, ...published.filter((r: any) => mediaReviewIds.has(r.id))].map(
        (r: any) => r.customer?.id
      ).filter(Boolean)
    ),
  ] as string[]
  const tierBy = new Map<string, { label: string; top: boolean }>()
  if (authorIds.length) {
    const { data: authors } = await query.graph({
      entity: "customer",
      fields: ["id", "metadata", "reviews.id", "reviews.status"],
      filters: { id: authorIds },
    })
    for (const a of authors as any[]) {
      const n = (a.reviews ?? []).filter((r: any) => r?.status === "published").length
      tierBy.set(a.id, authorLevel(n, a.metadata))
    }
  }

  // viewer state
  const actor = actorKey(req)
  const viewerId = (req as any).auth_context?.actor_id as string | undefined
  const mine = new Map<string, Set<string>>()
  if (actor) {
    for (const row of reactionRows) {
      if (row.actor_key !== actor) continue
      const s = mine.get(row.review_id) ?? new Set<string>()
      s.add(row.type)
      mine.set(row.review_id, s)
    }
  }
  const following = new Set<string>()
  if (viewerId && authorIds.length) {
    const rows = await extras.listAuthorFollows({ follower_id: viewerId, author_id: authorIds })
    for (const f of rows) following.add(f.author_id)
  }

  const scopedIds = new Set(scoped.map((r: any) => r.id))
  const byId = new Map<string, any>(published.map((r: any) => [r.id, r]))
  const mediaStrip = media
    .filter((m: any) => scopedIds.has(m.review_id))
    .slice(0, 60)
    .map((m: any) => {
      const r = byId.get(m.review_id)
      const authorId = r?.customer?.id ?? null
      const c = counts.get(m.review_id) ?? { like: 0, heart: 0, clap: 0 }
      const liked = mine.get(m.review_id)?.has("like") ?? false
      return {
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnail_url: m.thumbnail_url,
        review_id: m.review_id,
        review: r
          ? {
              rating: r.rating,
              text: r.customer_note ?? "",
              author: {
                id: authorId,
                name: authorName(r.customer?.first_name, r.customer?.last_name),
                initial: (r.customer?.first_name || r.customer?.last_name || "H").trim()[0]?.toUpperCase() ?? "H",
                ...(tierBy.get(authorId) ?? { label: "Reviewer", top: false }),
              },
              reactions: { like: c.like + c.heart + c.clap, liked },
              following: authorId ? following.has(authorId) : false,
              is_own: !!viewerId && viewerId === authorId,
            }
          : null,
      }
    })

  res.json({
    summary: { average, count: published.length, distribution },
    media: mediaStrip,
    media_count: media.filter((m: any) => scopedIds.has(m.review_id)).length,
    count: scoped.length,
    offset,
    limit,
    reviews: page.map((r: any) => {
      const d = detailBy.get(r.id)
      const c = counts.get(r.id) ?? { like: 0, heart: 0, clap: 0 }
      const authorId = r.customer?.id ?? null
      const edited =
        !!d?.edited_at ||
        (r.updated_at && new Date(r.updated_at).getTime() - ts(r) > 60 * 60 * 1000)
      return {
        id: r.id,
        rating: r.rating,
        text: r.customer_note ?? "",
        seller_note: r.seller_note ?? null,
        created_at: r.created_at,
        edited_at: edited ? d?.edited_at ?? r.updated_at : null,
        language: d?.language ?? null,
        variant_id: d?.variant_id ?? null,
        variant_label: d?.variant_label ?? null,
        media: mediaBy.get(r.id) ?? [],
        author: {
          id: authorId,
          name: authorName(r.customer?.first_name, r.customer?.last_name),
          initial: (r.customer?.first_name || r.customer?.last_name || "H").trim()[0]?.toUpperCase() ?? "H",
          ...(tierBy.get(authorId) ?? { label: "Reviewer", top: false }),
        },
        reactions: Object.fromEntries(REACTION_TYPES.map((t) => [t, c[t] || 0])),
        mine: REACTION_TYPES.filter((t) => mine.get(r.id)?.has(t)),
        following: authorId ? following.has(authorId) : false,
        is_own: !!viewerId && viewerId === authorId,
      }
    }),
  })
}
