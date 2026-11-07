import { MedusaService } from "@medusajs/framework/utils"
import Auction from "./models/auction"
import Bid from "./models/bid"

export const AUCTION_MODULE = "auction"

class AuctionModuleService extends MedusaService({ Auction, Bid }) {
  /**
   * Recomputes the standing price and leader for an auction using
   * second-price (proxy) semantics:
   *
   *   standing = min(leader.max, runnerUp.max + increment)
   *
   * floored at the starting price. The leader pays `standing`, never their
   * max - so bidders can safely enter their true ceiling.
   */
  async recomputeStandingPrice(auctionId: string) {
    const bids = await this.listBids(
      { auction_id: auctionId, status: ["active", "leading", "outbid"] },
      { order: { amount: "DESC", created_at: "ASC" } }
    )

    const auction = await this.retrieveAuction(auctionId)
    const start = Number(auction.starting_price)
    const increment = Number(auction.bid_increment)

    if (!bids.length) {
      await this.updateAuctions({
        id: auctionId,
        current_price: null,
        leading_bid_id: null,
      })
      return { currentPrice: null, leadingBidId: null }
    }

    const leader = bids[0]
    const runnerUpMax =
      bids.length > 1 ? Number(bids[1].amount) : start - increment

    let standing = Math.min(Number(leader.amount), runnerUpMax + increment)
    standing = Math.max(standing, start)

    const updates = bids.map((bid, i) => ({
      id: bid.id,
      status: i === 0 ? ("leading" as const) : ("outbid" as const),
      standing_amount: i === 0 ? standing : Number(bid.amount),
    }))
    await this.updateBids(updates)

    await this.updateAuctions({
      id: auctionId,
      current_price: standing,
      leading_bid_id: leader.id,
    })

    return { currentPrice: standing, leadingBidId: leader.id as string }
  }
}

export default AuctionModuleService
