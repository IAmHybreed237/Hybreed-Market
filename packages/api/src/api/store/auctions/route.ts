import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AUCTION_MODULE } from "../../../modules/auction/service"

const PUBLIC_STATUSES = ["scheduled", "live", "ended"]

/**
 * GET /store/auctions — list auctions visible to buyers.
 * Query: status (scheduled|live|ended), limit, offset.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(AUCTION_MODULE)
  const status = req.query.status as string | undefined
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const offset = Number(req.query.offset) || 0

  const filters: Record<string, unknown> = {
    status: status && PUBLIC_STATUSES.includes(status) ? status : PUBLIC_STATUSES,
  }

  const [auctions, count] = await service.listAndCountAuctions(filters, {
    order: { end_at: "ASC" },
    skip: offset,
    take: limit,
  })

  res.json({ auctions, count, limit, offset })
}
