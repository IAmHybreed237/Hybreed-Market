import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AUCTION_MODULE } from "../../../../modules/auction/service"

const maskBidder = (id: string) =>
  id.length <= 6 ? `${id.slice(0, 2)}***` : `${id.slice(0, 6)}***${id.slice(-2)}`

/**
 * GET /store/auctions/:id — auction detail with recent bid history
 * (bidder ids masked for privacy).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AUCTION_MODULE)
  const id = req.params.id

  const auction = await service.retrieveAuction(id).catch(() => null)
  if (!auction || ["draft", "canceled"].includes(auction.status)) {
    res.status(404).json({ message: "Auction not found" })
    return
  }

  const bids = await service.listBids(
    { auction_id: id },
    { order: { created_at: "DESC" }, take: 50 }
  )

  res.json({
    auction,
    bids: bids.map((b) => ({
      ...b,
      bidder_id: maskBidder(b.bidder_id),
    })),
  })
}
