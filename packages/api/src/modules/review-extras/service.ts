import { MedusaService } from "@medusajs/framework/utils"
import {
  AuthorFollow,
  ReviewDetail,
  ReviewMedia,
  ReviewReaction,
  ReviewReport,
} from "./models"

export const REVIEW_EXTRAS_MODULE = "reviewExtras"

export type ReactionType = "like" | "heart" | "clap"
export const REACTION_TYPES: ReactionType[] = ["like", "heart", "clap"]

// key "ReviewAsset" (not ReviewMedia) so generated methods pluralize
// predictably: listReviewAssets / createReviewAssets / deleteReviewAssets
export default class ReviewExtrasService extends MedusaService({
  ReviewDetail,
  ReviewAsset: ReviewMedia,
  ReviewReaction,
  ReviewReport,
  AuthorFollow,
}) {
  /** Toggles a reaction; returns whether it is now active. */
  async toggleReaction(reviewId: string, actorKey: string, type: ReactionType) {
    const [existing] = await this.listReviewReactions({
      review_id: reviewId,
      actor_key: actorKey,
      type,
    })
    if (existing) {
      await this.deleteReviewReactions([existing.id])
      return false
    }
    await this.createReviewReactions({ review_id: reviewId, actor_key: actorKey, type })
    return true
  }

  /** Toggles following an author; returns whether now following. */
  async toggleFollow(followerId: string, authorId: string) {
    const [existing] = await this.listAuthorFollows({
      follower_id: followerId,
      author_id: authorId,
    })
    if (existing) {
      await this.deleteAuthorFollows([existing.id])
      return false
    }
    await this.createAuthorFollows({ follower_id: followerId, author_id: authorId })
    return true
  }
}
