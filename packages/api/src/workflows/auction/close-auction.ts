// @ts-nocheck
import { createWorkflow } from "@medusajs/framework/workflows-sdk"
import { finalizeAuctionStep } from "./steps/finalize-auction"

export const closeAuctionWorkflowId = "auction-close"

export const closeAuctionWorkflow = createWorkflow(
  closeAuctionWorkflowId,
  (input: { auction_id: string }) => {
    return finalizeAuctionStep({ auction_id: input.auction_id })
  }
)
