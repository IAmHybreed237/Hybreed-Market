// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AUCTION_MODULE } from "../../../../../modules/auction/service"
import { placeBidWorkflow } from "../../../../../workflows/auction/place-bid"

const maskBidder = (id: string) =>
  id.length <= 6 ? `${id.slice(0, 2)}***` : `${id.slice(0, 6)}***${id.slice(-2)}`

/**
 * GET /store/auctions/:id/bids - public bid history (masked bidders).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AUCTION_MODULE)
  const bids = await service.listBids(
    { auction_id: req.params.id },
    { order: { created_at: "DESC" }, take: 100 }
  )
  res.json({
    bids: bids.map((b) => ({ ...b, bidder_id: maskBidder(b.bidder_id) })),
  })
}

/**
 * POST /store/auctions/:id/bids - place a bid. Requires customer auth
 * (enforced by middleware); body: { amount, deposit_reference? }.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bidderId = req.auth_context?.actor_id as string | undefined
  if (!bidderId) {
    res.status(401).json({ message: "Authentication required to bid" })
    return
  }

  const amount = Number(req.body?.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: "amount must be a positive number" })
    return
  }

  const wfEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  const { result } = await wfEngine.run(placeBidWorkflow, {
    input: {
      auction_id: req.params.id,
      bidder_id: bidderId,
      amount,
      deposit_reference: req.body?.deposit_reference,
    },
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: "auction.bid_placed",
    data: {
      auction_id: req.params.id,
      bid_id: result?.bid?.id,
      bidder_id: bidderId,
      amount,
      ...result?.effects,
    },
  })

  res.status(201).json({ bid: result?.bid, effects: result?.effects })
}
