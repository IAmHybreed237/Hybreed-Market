import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_EXTRAS_MODULE } from "../../../modules/review-extras/service"

/** Lists the ids (sellers, review authors) the customer follows. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Sign in required" })
    return
  }
  const extras = req.scope.resolve(REVIEW_EXTRAS_MODULE) as any
  const follows = await extras.listAuthorFollows({ follower_id: customerId })
  res.json({ ids: (follows ?? []).map((f: any) => f.author_id) })
}
