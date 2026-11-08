import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_QA_MODULE } from "../../../modules/product-qa/service"

/**
 * GET /admin/product-questions - staff queue of buyer questions.
 * Query: status (pending|answered), product_id, limit, offset.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const qa = req.scope.resolve(PRODUCT_QA_MODULE) as any
  const filters: Record<string, unknown> = {}
  if (req.query.status) filters.status = String(req.query.status)
  if (req.query.product_id) filters.product_id = String(req.query.product_id)

  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const offset = Number(req.query.offset) || 0
  const [questions, count] = await qa.listAndCountProductQuestions(filters, {
    order: { created_at: "DESC" },
    skip: offset,
    take: limit,
  })
  res.json({ questions, count, limit, offset })
}
