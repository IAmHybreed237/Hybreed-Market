import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IMAGE_SEARCH_MODULE } from "../modules/image-search"
import ImageSearchService from "../modules/image-search/service"
import { embedImagesMean, resolveImageUrl } from "../lib/vision"

const MAX_PER_RUN = 10
const MAX_IMAGES = 4

/**
 * Keeps product image embeddings in sync with the catalog.
 * Runs hourly: embeds products that have no embedding yet, or
 * whose product was updated after the embedding was last written.
 * Each product is represented by the mean of up to 4 gallery images.
 */
export default async function embedProductsJob(container: MedusaContainer) {
  const svc: ImageSearchService = container.resolve(IMAGE_SEARCH_MODULE)
  const productModule = container.resolve(Modules.PRODUCT)

  const products = await productModule.listProducts(
    {},
    { take: 500, relations: ["images"] }
  )

  const stale: any[] = []
  for (const p of products as any[]) {
    const urls = (p.images ?? [])
      .map((i: any) => i?.url)
      .filter(Boolean)
      .slice(0, MAX_IMAGES)
    if (!urls.length && p.thumbnail) urls.push(p.thumbnail)
    if (!urls.length) continue

    const [existing] = await svc.listProductEmbeddings({ product_id: p.id })
    const productUpdated = p.updated_at ? new Date(p.updated_at).getTime() : 0
    const embeddedAt = existing?.updated_at
      ? new Date(existing.updated_at).getTime()
      : 0
    if (!existing || productUpdated > embeddedAt) stale.push({ product: p, urls })
  }

  for (const { product: p, urls } of stale.slice(0, MAX_PER_RUN)) {
    try {
      const vector = await embedImagesMean(urls.map(resolveImageUrl))
      if (!vector) continue
      const [existing] = await svc.listProductEmbeddings({ product_id: p.id })
      if (existing) {
        await svc.updateProductEmbeddings({ id: existing.id, embedding: vector as any })
      } else {
        await svc.createProductEmbeddings({ product_id: p.id, embedding: vector as any })
      }
    } catch (e: any) {
      console.error(`[embed-products] failed ${p.id}: ${e?.message}`)
    }
  }
}

export const config = {
  name: "embed-products",
  schedule: "7 * * * *",
}
