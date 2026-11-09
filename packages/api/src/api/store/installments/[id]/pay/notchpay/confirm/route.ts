import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INSTALLMENTS_MODULE } from "../../../../../../../modules/installments/service"
import { confirmNotchPayInstallment } from "../../../../../../../lib/layaway"

/**
 * POST /store/installments/:id/pay/notchpay/confirm - verify a MoMo charge
 * server-side after the customer returns from hosted checkout.
 * Body: { reference } (the charge reference returned by the pay route).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }
  const reference = String((req.body as any)?.reference ?? "")
  if (!reference) {
    res.status(400).json({ message: "reference is required" })
    return
  }
  try {
    const installments: any = req.scope.resolve(INSTALLMENTS_MODULE)
    const plan = await installments.retrieveInstallmentPlan(req.params.id)
    if (!plan || plan.customer_id !== customerId) {
      res.status(404).json({ message: "Plan not found" })
      return
    }
    const result = await confirmNotchPayInstallment(req.scope, {
      planId: req.params.id,
      reference,
    })
    res.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    res.status(e.status ?? 500).json({ message: e.message ?? "Confirm failed" })
  }
}
