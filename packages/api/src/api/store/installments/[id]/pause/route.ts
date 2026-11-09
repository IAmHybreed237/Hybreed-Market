import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INSTALLMENTS_MODULE } from "../../../../../modules/installments/service"

/**
 * POST /store/installments/:id/pause - emergency pause: shifts all pending
 * installments out by 14 days. Once per rolling 12 months.
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
    const updated = await installments.pausePlan(plan.id, 14)
    res.json({ plan: Array.isArray(updated) ? updated[0] : updated })
  } catch (err) {
    const e = err as Error & { status?: number }
    res.status(e.status ?? 500).json({ message: e.message ?? "Pause failed" })
  }
}
