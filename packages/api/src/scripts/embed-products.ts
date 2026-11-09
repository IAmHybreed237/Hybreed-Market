import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IMAGE_SEARCH_MODULE } from "../modules/image-search"
import ImageSearchService from "../modules/image-search/service"
import { embedImagesMean, resolveImageUrl } from "../lib/vision"

export default async function embedProducts({ container }: ExecArgs) {
  const svc: ImageSearchService = container.resolve(IMAGE_SEARCH_MODULE)
  const productModule = container.resolve(Modules.PRODUCT)
  const products = await productModule.listProducts(
    {},
    { take: 500, relations: ["images"] }
  )

  for (const p of products as any[]) {
    const urls = (p.images ?? [])
      .map((i: any) => i?.url)
      .filter(Boolean)
      .slice(0, 4)
    if (!urls.length && p.thumbnail) urls.push(p.thumbnail)
    if (!urls.length) { console.log(`skip ${p.id} (no image)`); continue }
    try {
      const vector = await embedImagesMean(urls.map(resolveImageUrl))
      if (!vector) { console.log(`skip ${p.id} (unreadable images)`); continue }
      const [existing] = await svc.listProductEmbeddings({ product_id: p.id })
      if (existing) await svc.updateProductEmbeddings({ id: existing.id, embedding: vector as any })
      else await svc.createProductEmbeddings({ product_id: p.id, embedding: vector as any })
      console.log(`embedded ${p.title}`)
    } catch (e: any) {
      console.error(`failed ${p.id}: ${e?.message}`)
    }
  }
}
