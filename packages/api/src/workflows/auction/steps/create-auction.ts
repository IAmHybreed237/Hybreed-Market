import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { AUCTION_MODULE } from "../../../modules/auction/service"

export interface CreateAuctionInput {
  title: string
  description?: string
  offer_id: string
  product_id?: string
  seller_id: string
  currency_code: string
  starting_price: number
  bid_increment: number
  reserve_price?: number
  buy_now_price?: number
  deposit_amount?: number
  start_at: string | Date
  end_at: string | Date
  extension_seconds?: number
  extension_window_seconds?: number
  max_extensions?: number
  status?: "draft" | "scheduled"
  metadata?: Record<string, unknown>
}

export const createAuctionStep = createStep(
  "auction-create",
  async (input: CreateAuctionInput, { container }) => {
    const service = container.resolve(AUCTION_MODULE)

    const start = new Date(input.start_at)
    const end = new Date(input.end_at)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "start_at and end_at must be valid dates"
      )
    }
    if (end <= start) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "end_at must be after start_at"
      )
    }
    if (input.starting_price <= 0 || input.bid_increment <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "starting_price and bid_increment must be positive"
      )
    }

    const auction = await service.createAuctions({
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "scheduled",
      offer_id: input.offer_id,
      product_id: input.product_id ?? null,
      seller_id: input.seller_id,
      currency_code: input.currency_code.toLowerCase(),
      starting_price: input.starting_price,
      bid_increment: input.bid_increment,
      reserve_price: input.reserve_price ?? null,
      buy_now_price: input.buy_now_price ?? null,
      deposit_amount: input.deposit_amount ?? null,
      start_at: start,
      end_at: end,
      extension_seconds: input.extension_seconds ?? 120,
      extension_window_seconds: input.extension_window_seconds ?? 300,
      max_extensions: input.max_extensions ?? 3,
      extension_count: 0,
      metadata: input.metadata ?? null,
    })

    return new StepResponse(auction)
  },
  async (auction, { container }) => {
    if (!auction?.id) return
    const service = container.resolve(AUCTION_MODULE)
    await service.deleteAuctions(auction.id)
  }
)
