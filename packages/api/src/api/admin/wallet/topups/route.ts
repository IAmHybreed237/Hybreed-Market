import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WALLET_MODULE } from "../../../../modules/wallet/service"

/**
 * GET /admin/wallet/topups - list top-up requests for staff review.
 * Query: status (pending|approved|rejected|cancelled), limit, offset.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(WALLET_MODULE)
  const status = req.query.status as string | undefined
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const offset = Number(req.query.offset) || 0

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status

  const [topups, count] = await service.listAndCountTopupRequests(filters, {
    order: { created_at: "DESC" },
    skip: offset,
    take: limit,
  })

  res.json({ topups, count, limit, offset })
}
