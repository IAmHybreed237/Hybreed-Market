import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_EXTRAS_MODULE } from "../../../../../modules/review-extras/service"

/** Toggles following a seller. Requires a signed-in customer. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Sign in to follow sellers" })
    return
  }
  const sellerId = req.params.id as string
  const extras = req.scope.resolve(REVIEW_EXTRAS_MODULE) as any
  const following = await extras.toggleFollow(customerId, sellerId)
  res.json({ following })
}
