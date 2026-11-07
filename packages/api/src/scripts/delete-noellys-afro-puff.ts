import { ExecArgs } from "@medusajs/framework/types"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { deleteOffersWorkflow } from "@mercurjs/core/workflows"

export default async function deleteNoellysAfroPuff({ container }: ExecArgs) {
  const query = container.resolve("query") as any
  const logger = container.resolve("logger") as any

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
    filters: { title: "Afro Puff Drawstring Ponytail Extension (Afro Postiche)" },
  })

  for (const product of products as any[]) {
    const { data: offers } = await query.graph({
      entity: "offer",
      fields: ["id"],
      filters: { product_id: product.id },
    })
    const offerIds = (offers as any[]).map((o) => o.id)
    if (offerIds.length) {
      await deleteOffersWorkflow(container).run({ input: { ids: offerIds } })
    }
    await deleteProductsWorkflow(container).run({
      input: { ids: [product.id] },
    })
    logger.info(
      `Deleted product ${product.id} (${product.title}) + ${offerIds.length} offer(s)`
    )
  }
  if (!products.length) logger.info("No afro puff product found")
}
