import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { AUCTION_MODULE } from "../../../modules/auction/service"
import { NotchPayClient } from "../../../providers/notchpay/client"

interface Input {
  auction_id: string
  bidder_id: string
  amount: number
  deposit_reference?: string
}

/**
 * Loads the auction, verifies it is live and inside its window, validates
 * the bid amount against the current standing price, and — when the auction
 * requires a deposit — verifies the referenced Notch Pay transaction is
 * complete for at least the deposit amount.
 */
export const validateBidStep = createStep(
  "auction-validate-bid",
  async (input: Input, { container }) => {
    const service = container.resolve(AUCTION_MODULE)
    const now = new Date()

    const auction = await service.retrieveAuction(input.auction_id)

    if (auction.status !== "live") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Auction is not live (status: ${auction.status})`
      )
    }
    if (now >= new Date(auction.end_at)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Auction has ended"
      )
    }
    if (now < new Date(auction.start_at)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Auction has not started yet"
      )
    }
    if (input.bidder_id === auction.seller_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Sellers cannot bid on their own auctions"
      )
    }

    const start = Number(auction.starting_price)
    const increment = Number(auction.bid_increment)
    const current =
      auction.current_price != null ? Number(auction.current_price) : null
    const minBid = current != null ? current + increment : start

    if (!(input.amount >= minBid)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Bid must be at least ${minBid} ${auction.currency_code}`
      )
    }

    // Deposit commitment: when required, the bidder must reference a
    // completed Notch Pay transaction covering the deposit. Verified
    // server-side — the reference alone proves nothing.
    const deposit =
      auction.deposit_amount != null ? Number(auction.deposit_amount) : 0
    if (deposit > 0) {
      if (!input.deposit_reference) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `This auction requires a deposit of ${deposit} ${auction.currency_code}`
        )
      }
      const publicKey = process.env.NOTCHPAY_PUBLIC_KEY
      if (!publicKey) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Payment provider is not configured"
        )
      }
      const client = new NotchPayClient({ publicKey })
      let txn
      try {
        txn = await client.getPayment(input.deposit_reference)
      } catch {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Deposit payment could not be verified"
        )
      }
      const paid = Number(txn.amount ?? 0)
      const requiredSmallest = deposit // XAF is zero-decimal
      if (
        txn.status !== "complete" ||
        paid < requiredSmallest ||
        String(txn.currency).toLowerCase() !==
          String(auction.currency_code).toLowerCase()
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Deposit payment is not complete or does not cover the required amount"
        )
      }
    }

    return new StepResponse({ auction, minBid })
  },
  async () => {
    // Validation has no side effects to compensate.
  }
)
