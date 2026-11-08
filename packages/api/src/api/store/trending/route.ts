import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TRENDING_MODULE } from "../../../modules/trending/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const minutes = Math.min(
    Math.max(Number(req.query?.minutes ?? 30) || 30, 5),
    24 * 60
  )
  const service = req.scope.resolve(TRENDING_MODULE)
  const trends = await service.getTrends(minutes)
  res.json(trends)
}
