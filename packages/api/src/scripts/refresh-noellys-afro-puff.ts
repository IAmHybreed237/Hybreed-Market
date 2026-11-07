import { ExecArgs } from "@medusajs/framework/types"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { deleteOffersWorkflow } from "@mercurjs/core/workflows"

const HANDLE = "noellys-16in-waterwave-frontal-wig"

export default async function refreshNoellysAfroPuff({ container }: ExecArgs) {
  const query = container.resolve("query") as any
  const logger = container.resolve("logger") as any

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
    filters: { handle: HANDLE },
  })
  const product = products[0]
  if (!product) {
    logger.info(`No product with handle ${HANDLE}; nothing to delete`)
    return
  }

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["id"],
    filters: { product_id: product.id },
  })
  const offerIds = (offers as any[]).map((o) => o.id)
  if (offerIds.length) {
    await deleteOffersWorkflow(container).run({ input: { ids: offerIds } })
    logger.info(`Deleted ${offerIds.length} offer(s)`)
  }

  await deleteProductsWorkflow(container).run({
    input: { ids: [product.id] },
  })
  logger.info(`Deleted product ${product.id} (${product.title})`)
}
