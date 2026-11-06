import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../../modules/auction/service"

interface Input {
  auction_id: string
}

/**
 * Recomputes the standing price/leader and applies the anti-sniping
 * extension when the bid landed inside the closing window.
 */
export const applyBidEffectsStep = createStep(
  "auction-apply-bid-effects",
  async (input: Input, { container }) => {
    const service = container.resolve(AUCTION_MODULE)
    const auction = await service.retrieveAuction(input.auction_id)

    const standing = await service.recomputeStandingPrice(input.auction_id)

    // Anti-sniping: extend the end when a bid arrives inside the window,
    // up to max_extensions times so auctions cannot be extended forever.
    const now = Date.now()
    const endAt = new Date(auction.end_at).getTime()
    const windowMs = auction.extension_window_seconds * 1000
    const shouldExtend =
      endAt - now <= windowMs &&
      auction.extension_count < auction.max_extensions

    if (shouldExtend) {
      const newEnd = new Date(
        endAt + auction.extension_seconds * 1000
      )
      await service.updateAuctions({
        id: input.auction_id,
        end_at: newEnd,
        extension_count: auction.extension_count + 1,
      })
    }

    return new StepResponse({ ...standing, extended: shouldExtend })
  },
  async (_result, { container }) => {
    // Recomputing on compensation is unnecessary: if a later step fails,
    // create-bid's compensation removes the bid, and the next successful
    // bid (or the close job) recomputes anyway.
  }
)
