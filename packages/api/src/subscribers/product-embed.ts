import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { IMAGE_SEARCH_MODULE } from "../modules/image-search"
import ImageSearchService from "../modules/image-search/service"
import { embedImage } from "../lib/vision"

export default async function productEmbed({ event, container }: SubscriberArgs<{ id: string }>) {
  const svc: ImageSearchService = container.resolve(IMAGE_SEARCH_MODULE)
  const productModule = container.resolve(Modules.PRODUCT)
  const [product] = await productModule.listProducts({ id: event.data.id }, { take: 1 })
  const url = product?.thumbnail || product?.images?.[0]?.url
  if (!url) return

  try {
    const vector = await embedImage(url)
    const store = svc as any
    const [existing] = await store.listProductEmbeddings({ product_id: product.id })
    if (existing) await store.updateProductEmbeddings({ id: existing.id, embedding: vector })
    else await store.createProductEmbeddings({ product_id: product.id, embedding: vector })
  } catch (e) {
    console.error("product-embed failed:", e)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
