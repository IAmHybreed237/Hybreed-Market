import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_QA_MODULE } from "../../../../../modules/product-qa/service"

/**
 * POST /admin/product-questions/:id/answer - post the seller's answer.
 * Body: { answer }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id as string
  const answer = String(req.body?.answer ?? "").trim()
  if (!answer) {
    res.status(400).json({ message: "answer is required" })
    return
  }

  const qa = req.scope.resolve(PRODUCT_QA_MODULE) as any
  const question = await qa.answer({ id, answer })
  res.json({ question })
}
