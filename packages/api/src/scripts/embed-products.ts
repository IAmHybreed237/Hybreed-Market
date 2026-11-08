import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IMAGE_SEARCH_MODULE } from "../modules/image-search"
import ImageSearchService from "../modules/image-search/service"
import { embedImage, resolveImageUrl } from "../lib/vision"

export default async function embedProducts({ container }: ExecArgs) {
  const svc: ImageSearchService = container.resolve(IMAGE_SEARCH_MODULE)
  const productModule = container.resolve(Modules.PRODUCT)
  const products = await productModule.listProducts({}, { take: 500 })

  for (const p of products) {
    const url = p.thumbnail || p.images?.[0]?.url
    if (!url) { console.log(`skip ${p.id} (no image)`); continue }
    try {
      const vector = await embedImage(resolveImageUrl(url))
      const [existing] = await svc.listProductEmbeddings({ product_id: p.id })
      if (existing) await svc.updateProductEmbeddings({ id: existing.id, embedding: vector })
      else await svc.createProductEmbeddings({ product_id: p.id, embedding: vector })
      console.log(`embedded ${p.title}`)
    } catch (e: any) {
      console.error(`failed ${p.id}: ${e?.message}`)
    }
  }
}
