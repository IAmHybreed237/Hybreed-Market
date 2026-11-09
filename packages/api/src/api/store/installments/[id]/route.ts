import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INSTALLMENTS_MODULE } from "../../../../modules/installments/service"

/**
 * GET /store/installments/:id - plan detail with its payments.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }
  const service: any = req.scope.resolve(INSTALLMENTS_MODULE)
  const plan = await service.retrievePlanWithPayments(req.params.id)
  if (!plan || plan.customer_id !== customerId) {
    res.status(404).json({ message: "Plan not found" })
    return
  }
  const payments = await service.listPlanPayments(plan.id)
  res.json({ plan, payments })
}
