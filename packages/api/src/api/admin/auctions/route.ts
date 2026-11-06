import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { AUCTION_MODULE } from "../../../modules/auction/service"
import { createAuctionWorkflow } from "../../../workflows/auction/create-auction"
import { CreateAuctionInput } from "../../../workflows/auction/steps/create-auction"

/**
 * GET /admin/auctions — list auctions (operator view).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AUCTION_MODULE)
  const status = req.query.status as string | undefined

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status

  const [auctions, count] = await service.listAndCountAuctions(filters, {
    order: { created_at: "DESC" },
    take: 50,
  })

  res.json({ auctions, count })
}

/**
 * POST /admin/auctions — create an auction for a seller's offer.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as Partial<CreateAuctionInput>

  const required = [
    "title",
    "offer_id",
    "seller_id",
    "currency_code",
    "starting_price",
    "bid_increment",
    "start_at",
    "end_at",
  ] as const
  const missing = required.filter((k) => body[k] === undefined || body[k] === null)
  if (missing.length) {
    res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` })
    return
  }

  const wfEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  const { result } = await wfEngine.run(createAuctionWorkflow, {
    input: body as CreateAuctionInput,
  })

  res.status(201).json({ auction: result })
}
