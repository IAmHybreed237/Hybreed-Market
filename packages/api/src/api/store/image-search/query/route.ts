import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IMAGE_SEARCH_MODULE } from "../../../../modules/image-search"
import ImageSearchService from "../../../../modules/image-search/service"
import { cosine, embedImage } from "../../../../lib/vision"

const TOP_K = 12
const MIN_SCORE = 0.15

/**
 * POST /store/image-search/query
 * Body: { image: "data:image/...;base64,..." }
 * Returns the products whose stored CLIP embeddings are most similar.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const image = (req.body as { image?: string })?.image
  if (!image || typeof image !== "string") {
    res.status(400).json({ message: "image is required" })
    return
  }

  try {
    const queryVector = await embedImage(image)

    const service: ImageSearchService = req.scope.resolve(IMAGE_SEARCH_MODULE)
    const embeddings = await service.listProductEmbeddings({}, { take: 2000 })

    const scored = embeddings
      .map((e: any) => ({
        product_id: e.product_id,
        score: cosine(queryVector, e.embedding as number[]),
      }))
      .filter((s) => s.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)

    if (!scored.length) {
      res.json({ products: [] })
      return
    }

    const productModule = req.scope.resolve(Modules.PRODUCT)
    const products = await productModule.listProducts(
      { id: scored.map((s) => s.product_id) },
      { select: ["id", "title", "handle", "thumbnail"] }
    )
    const byId = new Map(products.map((p: any) => [p.id, p]))
    const ordered = scored
      .map((s) => ({ ...byId.get(s.product_id), score: s.score }))
      .filter(Boolean)

    res.json({ products: ordered })
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Image search failed" })
  }
}
