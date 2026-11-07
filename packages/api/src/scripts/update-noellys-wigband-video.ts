import { ExecArgs } from "@medusajs/framework/types"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

const HANDLE = "noellys-adjustable-wig-band"
const VIDEO_URL =
  "https://res.cloudinary.com/mykk0ao4/video/upload/19398949472971.mp4"

export default async function updateNoellysWigbandVideo({ container }: ExecArgs) {
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
    video_url: VIDEO_URL,
  }

  await updateProductsWorkflow(container).run({
    input: {
      products: [{ id: product.id, metadata }],
    } as any,
  })

  logger.info(`Set video_url on ${HANDLE} (${product.id})`)
}
