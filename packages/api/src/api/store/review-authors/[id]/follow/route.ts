import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_EXTRAS_MODULE } from "../../../../../modules/review-extras/service"

/** Toggles following a review author. Requires a signed-in customer. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const followerId = (req as any).auth_context?.actor_id as string | undefined
  if (!followerId) {
    res.status(401).json({ message: "Sign in to subscribe" })
    return
  }
  const authorId = req.params.id as string
  if (authorId === followerId) {
    res.status(400).json({ message: "You can't subscribe to yourself" })
    return
  }
  const extras = req.scope.resolve(REVIEW_EXTRAS_MODULE) as any
  const following = await extras.toggleFollow(followerId, authorId)
  res.json({ following })
}
