import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PUSH_MODULE } from "../../../../modules/push-notifications/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(PUSH_MODULE)
  const [subs, count] = await service.listAndCountPushSubscriptions(
    {},
    {
      select: ["id", "customer_id", "user_agent", "created_at"],
      take: 200,
      order: { created_at: "DESC" },
    }
  )
  res.json({ count, subscribers: subs })
}
