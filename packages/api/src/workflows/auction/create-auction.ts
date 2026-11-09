// @ts-nocheck
import { createWorkflow } from "@medusajs/framework/workflows-sdk"
import {
  createAuctionStep,
  CreateAuctionInput,
} from "./steps/create-auction"

export const createAuctionWorkflowId = "auction-create"

export const createAuctionWorkflow = createWorkflow(
  createAuctionWorkflowId,
  (input: CreateAuctionInput) => {
    return createAuctionStep(input)
  }
)
