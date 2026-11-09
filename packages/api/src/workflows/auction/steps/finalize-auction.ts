// @ts-nocheck
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../../modules/auction/service"

interface Input {
  auction_id: string
}

interface AuctionSnapshot {
  auction_id: string
  status: string
  winner_id: string | null
  winning_bid_id: string | null
  ended_at: Date | null
  current_price: unknown
  leading_bid_id: string | null
  bids: { id: string; status: string }[]
}

/**
 * Determines the winner (highest max amount, earliest bid breaks ties),
 * enforces the reserve price, and finalizes the auction. When the standing
 * price is below reserve there is no winner and all bids are marked lost.
 */
export const finalizeAuctionStep = createStep(
  "auction-finalize",
  async (input: Input, { container }) => {
    const service = container.resolve(AUCTION_MODULE)

    const auction = await service.retrieveAuction(input.auction_id, {
      relations: ["bids"],
    })

    const snapshot: AuctionSnapshot = {
      auction_id: input.auction_id,
      status: auction.status,
      winner_id: auction.winner_id,
      winning_bid_id: auction.winning_bid_id,
      ended_at: auction.ended_at,
      current_price: auction.current_price,
      leading_bid_id: auction.leading_bid_id,
      bids: (auction.bids ?? []).map((b: { id: string; status: string }) => ({
        id: b.id,
        status: b.status,
      })),
    }

    const bids = (auction.bids ?? [])
      .filter((b: { status: string }) =>
        ["active", "leading", "outbid"].includes(b.status)
      )
      .sort(
        (a: { amount: unknown; created_at: string }, b: { amount: unknown; created_at: string }) =>
          Number(b.amount) - Number(a.amount) ||
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

    const standing =
      auction.current_price != null ? Number(auction.current_price) : null
    const reserve =
      auction.reserve_price != null ? Number(auction.reserve_price) : null
    const reserveMet = reserve == null || (standing != null && standing >= reserve)

    const winner = bids.length && reserveMet ? bids[0] : null

    const now = new Date()
    await service.updateAuctions({
      id: input.auction_id,
      status: "ended",
      ended_at: now,
      winner_id: winner?.bidder_id ?? null,
      winning_bid_id: winner?.id ?? null,
    })

    const bidUpdates = bids.map((b: { id: string }) => ({
      id: b.id,
      status: winner && b.id === winner.id ? ("won" as const) : ("lost" as const),
    }))
    if (bidUpdates.length) {
      await service.updateBids(bidUpdates)
    }

    return new StepResponse(
      {
        auction_id: input.auction_id,
        winner_id: winner?.bidder_id ?? null,
        winning_bid_id: winner?.id ?? null,
        winning_amount: winner ? Number(winner.amount) : null,
        standing_price: standing,
      },
      snapshot
    )
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const service = container.resolve(AUCTION_MODULE)
    await service.updateAuctions({
      id: snapshot.auction_id,
      status: snapshot.status as never,
      winner_id: snapshot.winner_id,
      winning_bid_id: snapshot.winning_bid_id,
      ended_at: snapshot.ended_at,
      current_price: snapshot.current_price as never,
      leading_bid_id: snapshot.leading_bid_id,
    })
    if (snapshot.bids.length) {
      await service.updateBids(
        snapshot.bids.map((b) => ({ id: b.id, status: b.status as never }))
      )
    }
  }
)
