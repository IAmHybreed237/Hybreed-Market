import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_QA_MODULE } from "../../../modules/product-qa/service"

/**
 * GET /store/product-questions?product_id=...&status=answered
 * Public - answered questions are product content shown on the PDP.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.query.product_id as string | undefined
  if (!productId) {
    res.status(400).json({ message: "product_id is required" })
    return
  }
  const qa = req.scope.resolve(PRODUCT_QA_MODULE) as any
  const filters: Record<string, unknown> = { product_id: productId }
  if (req.query.status) filters.status = String(req.query.status)
  const questions = await qa.listProductQuestions(filters, {
    order: { created_at: "DESC" },
    take: 50,
  })
  res.json({ questions })
}

/**
 * POST /store/product-questions - ask a question about a product.
 * Requires customer auth (guests go through the signup sheet first).
 * Body: { product_id, body, author_name? }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Sign in to ask a question" })
    return
  }

  const productId = String(req.body?.product_id ?? "")
  const body = String(req.body?.body ?? "").trim()
  if (!productId || body.length < 5) {
    res.status(400).json({ message: "product_id and a question (5+ chars) are required" })
    return
  }
  if (body.length > 1000) {
    res.status(400).json({ message: "Question is too long" })
    return
  }

  const qa = req.scope.resolve(PRODUCT_QA_MODULE) as any
  const question = await qa.ask({
    productId,
    customerId,
    authorName: String(req.body?.author_name ?? "").trim() || "Hybreed customer",
    body,
  })
  res.status(201).json({ question })
}
