import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Seeds demo product reviews (FR + EN, photos, a video, reactions) on two
 * products. Idempotent: removes previous demo reviews first.
 *
 * Uses raw knex for review/link/extras rows because custom module services
 * don't get a DB manager under `medusa exec`.
 *
 * Run:   bunx medusa exec ./src/scripts/seed-demo-reviews.ts
 * Clean: REVIEWS_CLEAN_ONLY=1 bunx medusa exec ./src/scripts/seed-demo-reviews.ts
 */

const VIDEO = "https://res.cloudinary.com/mykk0ao4/video/upload/19398949472971.mp4"
const VIDEO_THUMB = "https://res.cloudinary.com/mykk0ao4/video/upload/so_1/19398949472971.jpg"

const AUTHORS = [
  { first: "Aïcha", last: "Mballa", top: true },
  { first: "Brice", last: "Ngono" },
  { first: "Carine", last: "Fotso" },
  { first: "Daniel", last: "Etoa", top: true },
  { first: "Esther", last: "Nkeng" },
  { first: "Franck", last: "Tchoupo" },
  { first: "Grâce", last: "Abena" },
  { first: "Hervé", last: "Kamga" },
]

type Media = { type: "image" | "video"; url: string; thumb?: string }
type Seed = { author: number; rating: number; lang: "fr" | "en"; text: string; days: number; media?: Media[]; variant?: number; edited?: boolean }

const img = (url: string): Media => ({ type: "image", url })
const vid: Media = { type: "video", url: VIDEO, thumb: VIDEO_THUMB }

const PRODUCTS: { handle: string; reviews: Seed[] }[] = [
  {
    handle: "gaya-spiked-suede-sneakers",
    reviews: [
      { author: 0, rating: 5, lang: "fr", days: 2, edited: true, variant: 2, text: "Les chaussures sont vraiment belles, la semelle rouge attire tous les regards. Taille normale, j'ai pris ma pointure habituelle. Livraison rapide à Buea.", media: [img("/images/gaya/gaya-1.jpg"), img("/images/gaya/gaya-2.jpg"), img("/images/gaya/gaya-3.jpg")] },
      { author: 1, rating: 5, lang: "en", days: 4, variant: 1, text: "Quality is solid, the suede feels premium and the spikes are well fixed. Packaging was neat, each shoe wrapped separately and the box was not damaged.", media: [img("/images/gaya/gaya-3.jpg"), img("/images/gaya/gaya-4.jpg")] },
      { author: 2, rating: 4, lang: "fr", days: 6, variant: 0, text: "Très confortables mais il faut quelques jours pour les faire à son pied. Bon rapport qualité-prix." },
      { author: 3, rating: 5, lang: "en", days: 9, variant: 2, text: "Wore them to a wedding in Douala and got so many compliments. The seller answered all my questions quickly.", media: [img("/images/gaya/gaya-4.jpg"), img("/images/gaya/gaya-2.jpg")] },
      { author: 4, rating: 3, lang: "fr", days: 13, variant: 3, text: "Jolies mais elles taillent un peu petit, prenez une pointure au-dessus." },
      { author: 5, rating: 5, lang: "en", days: 20, variant: 1, text: "Exactly like the pictures. The red sole is glossy and clean. I will buy another colour.", media: [img("/images/gaya/gaya-1.jpg")] },
    ],
  },
  {
    handle: "noellys-adjustable-wig-band",
    reviews: [
      { author: 6, rating: 5, lang: "en", days: 1, variant: 1, text: "Holds my wig perfectly all day, no slipping even when I dance. The 3-piece pack is worth it.", media: [vid, img("/images/noellys-wigband/band-1.png")] },
      { author: 0, rating: 5, lang: "fr", days: 3, variant: 0, text: "Très pratique, l'élastique est solide et confortable. Je ne sens même pas que je le porte.", media: [img("/images/noellys-wigband/band-2.png")] },
      { author: 7, rating: 4, lang: "en", days: 7, variant: 0, text: "Good band, the velcro is strong. I wish it came in more colours." },
      { author: 3, rating: 5, lang: "fr", days: 11, edited: true, variant: 1, text: "Je l'utilise pour toutes mes perruques maintenant, ça change tout. Livraison en 24h.", media: [vid, img("/images/noellys-wigband/band-3.png")] },
      { author: 1, rating: 5, lang: "en", days: 16, variant: 1, text: "Affordable and it does the job. Comfortable even for long hours." },
    ],
  },
]

const rid = () => `rev_demo${Math.random().toString(36).slice(2, 10)}`
const now = () => new Date()

export default async function seedDemoReviews({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const customers = container.resolve(Modules.CUSTOMER)
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  // --- clean previous demo data
  const oldDetails = await knex("review_detail").where({ is_demo: true }).select("review_id")
  const oldIds: string[] = oldDetails.map((d: any) => d.review_id)
  if (oldIds.length) {
    await knex("review_media").whereIn("review_id", oldIds).del()
    await knex("review_reaction").whereIn("review_id", oldIds).del()
    await knex("review_detail").whereIn("review_id", oldIds).del()
    for (const table of [
      "product_product_review_review",
      "customer_customer_review_review",
    ]) {
      await knex(table).whereIn("review_id", oldIds).del().catch(() => {})
    }
    await knex("review").whereIn("id", oldIds).del().catch(() => {})
    logger.info(`Removed ${oldIds.length} previous demo reviews`)
  }
  if (process.env.REVIEWS_CLEAN_ONLY) return

  // --- demo authors
  const authorIds: string[] = []
  for (let i = 0; i < AUTHORS.length; i++) {
    const a = AUTHORS[i]
    const email = `demo-reviewer-${i + 1}@hybreed.dev`
    const [existing] = await customers.listCustomers({ email })
    const metadata = { demo_reviewer: true, ...(a.top ? { review_author_tier: "top" } : {}) }
    const c = existing
      ? await customers.updateCustomers(existing.id, { first_name: a.first, last_name: a.last, metadata })
      : await customers.createCustomers({ email, first_name: a.first, last_name: a.last, metadata })
    authorIds.push((c as any).id)
  }

  let created = 0
  for (const p of PRODUCTS) {
    const { data: [product] } = await query.graph({
      entity: "product",
      fields: ["id", "variants.id", "variants.title", "variants.options.value", "variants.options.option.title"],
      filters: { handle: p.handle },
    })
    if (!product) {
      logger.warn(`Product ${p.handle} not found - skipped`)
      continue
    }
    const variants = ((product as any).variants ?? []) as any[]
    const labelOf = (v: any) => {
      const opts = (v?.options ?? [])
        .filter((o: any) => o?.value)
        .map((o: any) => `${o.option?.title ?? "Option"}: ${o.value}`)
      return opts.length ? opts.join("; ") : v?.title ?? null
    }

    for (let i = 0; i < p.reviews.length; i++) {
      const s = p.reviews[i]
      const createdAt = new Date(Date.now() - s.days * 86400000 - i * 3600000)
      const reviewId = rid()
      const authorId = authorIds[s.author]
      const variant = variants.length ? variants[(s.variant ?? 0) % variants.length] : null

      await knex("review").insert({
        id: reviewId,
        reference: "product",
        rating: s.rating,
        customer_note: s.text,
        status: "published",
        created_at: createdAt,
        updated_at: s.edited ? new Date(createdAt.getTime() + 86400000) : createdAt,
      })

      const linkId = () => `link_${Math.random().toString(36).slice(2, 12)}`
      await knex("product_product_review_review").insert({
        id: linkId(),
        product_id: (product as any).id,
        review_id: reviewId,
      })
      await knex("customer_customer_review_review").insert({
        id: linkId(),
        customer_id: authorId,
        review_id: reviewId,
      })

      await knex("review_detail").insert({
        id: `revd_${Math.random().toString(36).slice(2, 12)}`,
        review_id: reviewId,
        product_id: (product as any).id,
        variant_id: variant?.id ?? null,
        variant_label: variant ? labelOf(variant) : null,
        language: s.lang,
        edited_at: s.edited ? new Date(createdAt.getTime() + 86400000) : null,
        is_demo: true,
      })

      if (s.media?.length) {
        await knex("review_media").insert(
          s.media.map((m, rank) => ({
            id: `revm_${Math.random().toString(36).slice(2, 12)}`,
            review_id: reviewId,
            product_id: (product as any).id,
            type: m.type,
            url: m.url,
            thumbnail_url: m.thumb ?? null,
            rank,
          }))
        )
      }

      const reactions: any[] = []
      const n = (i * 3 + s.rating) % 6
      for (let k = 0; k < n; k++) {
        reactions.push({ review_id: reviewId, actor_key: `demo:${k}`, type: k % 3 === 0 ? "heart" : "like" })
        if (k % 2 === 0) reactions.push({ review_id: reviewId, actor_key: `demo:${k}`, type: "clap" })
      }
      if (reactions.length) {
        await knex("review_reaction").insert(
          reactions.map((r) => ({
            id: `revr_${Math.random().toString(36).slice(2, 12)}`,
            ...r,
          }))
        )
      }
      created++
    }
    logger.info(`Seeded ${p.reviews.length} demo reviews on ${p.handle}`)
  }
  logger.info(`Done - ${created} demo reviews`)
}
