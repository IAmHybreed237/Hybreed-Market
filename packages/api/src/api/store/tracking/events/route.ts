// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TRENDING_MODULE } from "../../../../modules/trending/service"

const TYPES = new Set(["search", "view"])

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as {
    type?: string
    term?: string
    product_id?: string
    category_ids?: string[]
  }

  const type = body.type === "search" ? "search" : body.type === "view" ? "view" : null
  if (!type || !TYPES.has(type)) {
    res.status(400).json({ message: "Invalid event type" })
    return
  }
  if (type === "search" && !body.term?.trim()) {
    res.status(400).json({ message: "Missing search term" })
    return
  }
  if (type === "view" && !body.product_id) {
    res.status(400).json({ message: "Missing product_id" })
    return
  }

  const service = req.scope.resolve(TRENDING_MODULE)
  await service.recordEvent({
    type,
    term: body.term,
    productId: body.product_id,
    categoryIds: Array.isArray(body.category_ids)
      ? body.category_ids.slice(0, 10).map(String)
      : [],
    customerId: (req.auth_context?.actor_id as string | undefined) ?? null,
  })

  res.json({ ok: true })
}
