import { ExecArgs } from "@medusajs/framework/types"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

const HANDLE = "gaya-spiked-suede-sneakers"

export default async function updateGayaSneakersInstallments({
  container,
}: ExecArgs) {
  const query = container.resolve("query") as any
  const logger = container.resolve("logger") as any

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
    filters: { handle: HANDLE },
  })
  const product = data[0]
  if (!product) throw new Error(`Product not found: ${HANDLE}`)

  const metadata = {
    ...((product.metadata as Record<string, any>) || {}),
    pay_in_parts: { enabled: true, parts: 4, interval_days: 7 },
  }

  await updateProductsWorkflow(container).run({
    input: {
      products: [{ id: product.id, metadata }],
    } as any,
  })

  logger.info(`Enabled pay_in_parts (4 parts) on ${HANDLE} (${product.id})`)
}
