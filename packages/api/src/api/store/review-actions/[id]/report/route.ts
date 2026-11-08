import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_EXTRAS_MODULE } from "../../../../../modules/review-extras/service"
import { actorKey } from "../../../../../lib/review-extras"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const actor = actorKey(req)
  if (!actor) {
    res.status(400).json({ message: "Missing device id" })
    return
  }
  const reviewId = req.params.id as string
  const reason = String((req.body as any)?.reason ?? "").slice(0, 200) || null
  const extras = req.scope.resolve(REVIEW_EXTRAS_MODULE) as any

  const [existing] = await extras.listReviewReports({ review_id: reviewId, actor_key: actor })
  if (!existing) await extras.createReviewReports({ review_id: reviewId, actor_key: actor, reason })

  res.json({ ok: true })
}
