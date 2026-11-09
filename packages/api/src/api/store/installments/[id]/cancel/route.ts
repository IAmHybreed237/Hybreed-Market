import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INSTALLMENTS_MODULE } from "../../../../../modules/installments/service"
import { cancelPlan } from "../../../../../lib/layaway"

/**
 * POST /store/installments/:id/cancel - buyer-initiated cancellation.
 * Applies the fee split: seller compensation + platform fee are recorded,
 * the remainder is refunded to the Hybreed Wallet.
 * Body: { reason? }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }
  try {
    const installments: any = req.scope.resolve(INSTALLMENTS_MODULE)
    const plan = await installments.retrieveInstallmentPlan(req.params.id)
    if (!plan || plan.customer_id !== customerId) {
      res.status(404).json({ message: "Plan not found" })
      return
    }
    const result = await cancelPlan(req.scope, {
      planId: req.params.id,
      reason: String((req.body as any)?.reason ?? "customer_cancelled"),
      initiatedBy: "customer",
    })
    res.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    res.status(e.status ?? 500).json({ message: e.message ?? "Cancel failed" })
  }
}
