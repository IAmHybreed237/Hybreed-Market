// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WALLET_MODULE } from "../../../modules/wallet/service"

/**
 * GET /store/wallet - balance, points and recent ledger entries.
 * Requires customer auth (middleware).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }

  const service = req.scope.resolve(WALLET_MODULE)
  const statement = await service.getStatement(customerId)
  res.json(statement)
}
