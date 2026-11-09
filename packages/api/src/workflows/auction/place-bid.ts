// @ts-nocheck
import { createWorkflow } from "@medusajs/framework/workflows-sdk"
import { validateBidStep } from "./steps/validate-bid"
import { createBidStep } from "./steps/create-bid"
import { applyBidEffectsStep } from "./steps/apply-bid-effects"

export const placeBidWorkflowId = "auction-place-bid"

export const placeBidWorkflow = createWorkflow(
  placeBidWorkflowId,
  (input: {
    auction_id: string
    bidder_id: string
    amount: number
    deposit_reference?: string
  }) => {
    validateBidStep(input)
    const bid = createBidStep(input)
    const effects = applyBidEffectsStep({
      auction_id: input.auction_id,
    })

    return { bid, effects }
  }
)
