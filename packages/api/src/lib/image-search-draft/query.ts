import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IMAGE_SEARCH_MODULE } from "../../modules/image-search"
import ImageSearchService from "../../modules/image-search/service"
import { embedImage, cosine } from "../vision"

// POST /store/image-search/query - { image, box?: {x,y,w,h} in % } -> ranked products
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as { image?: string; box?: { x: number; y: number; w: number; h: number } }
  if (!body?.image) return res.status(400).json({ message: "image required" })

  try {
    let input: string | Buffer = body.image.startsWith("data:")
      ? Buffer.from(body.image.split(",")[1], "base64")
      : body.image

    // Optional region crop (percentages of image dims)
    if (body.box && typeof input !== "string") {
      const { RawImage } = await import("@huggingface/transformers")
      const img = await RawImage.read(input)
      const { x, y, w, h } = body.box
      const crop = await img.crop(
        Math.round((x / 100) * img.width), Math.round((y / 100) * img.height),
        Math.round((w / 100) * img.width), Math.round((h / 100) * img.height)
      )
      input = Buffer.from(await crop.toBlob().then(b => b.arrayBuffer())) as Buffer
    }

    const vector = await embedImage(input)
    const svc: ImageSearchService = req.scope.resolve(IMAGE_SEARCH_MODULE)
    const rows = await svc.listProductEmbeddings({}, { take: 5000 }) as any[]

    const ranked = rows
      .map((r) => ({ product_id: r.product_id, score: cosine(vector, r.embedding as number[]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)

    if (!ranked.length) return res.json({ products: [] })

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "thumbnail", "images.url"],
      filters: { id: ranked.map((r) => r.product_id) },
    })

    const byId = new Map(products.map((p: any) => [p.id, p]))
    res.json({
      products: ranked.map((r) => ({ ...byId.get(r.product_id), score: r.score })).filter((p) => p.id),
    })
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "search failed" })
  }
}
