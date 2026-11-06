import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../../modules/auction/service"

interface Input {
  auction_id: string
  bidder_id: string
  amount: number
  deposit_reference?: string
}

export const createBidStep = createStep(
  "auction-create-bid",
  async (input: Input, { container }) => {
    const service = container.resolve(AUCTION_MODULE)

    const bid = await service.createBids({
      auction_id: input.auction_id,
      bidder_id: input.bidder_id,
      amount: input.amount,
      deposit_reference: input.deposit_reference ?? null,
      status: "active",
    })

    return new StepResponse(bid)
  },
  async (bid, { container }) => {
    if (!bid?.id) return
    const service = container.resolve(AUCTION_MODULE)
    await service.deleteBids(bid.id)
  }
)
