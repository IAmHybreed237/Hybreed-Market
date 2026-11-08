import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  REACTION_TYPES,
  REVIEW_EXTRAS_MODULE,
  type ReactionType,
} from "../../../../../modules/review-extras/service"
import { actorKey } from "../../../../../lib/review-extras"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const type = (req.body as any)?.type as ReactionType
  if (!REACTION_TYPES.includes(type)) {
    res.status(400).json({ message: "Invalid reaction type" })
    return
  }
  const actor = actorKey(req)
  if (!actor) {
    res.status(400).json({ message: "Missing device id" })
    return
  }

  const reviewId = req.params.id as string
  const extras = req.scope.resolve(REVIEW_EXTRAS_MODULE) as any
  const active = await extras.toggleReaction(reviewId, actor, type)

  const rows = await extras.listReviewReactions({ review_id: reviewId })
  const counts = Object.fromEntries(REACTION_TYPES.map((t) => [t, 0])) as Record<string, number>
  const mine: string[] = []
  for (const r of rows) {
    counts[r.type] = (counts[r.type] || 0) + 1
    if (r.actor_key === actor) mine.push(r.type)
  }
  res.json({ active, reactions: counts, mine })
}
