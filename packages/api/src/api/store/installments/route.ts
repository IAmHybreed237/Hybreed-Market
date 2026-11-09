import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INSTALLMENTS_MODULE } from "../../../modules/installments/service"
import { createPlanFromCart } from "../../../lib/layaway"

/**
 * GET /store/installments - the customer's own layaway plans.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }
  const service: any = req.scope.resolve(INSTALLMENTS_MODULE)
  const plans = await service.listPlansForCustomer(customerId)
  res.json({ plans })
}

/**
 * POST /store/installments - create a Pay Small Small plan from the cart.
 * Body: { cart_id, parts?, interval_days? }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }
  const cartId = String((req.body as any)?.cart_id ?? "")
  if (!cartId) {
    res.status(400).json({ message: "cart_id is required" })
    return
  }
  try {
    const { plan, payments } = await createPlanFromCart(req.scope, {
      customerId,
      cartId,
      parts: (req.body as any)?.parts != null ? Number((req.body as any).parts) : undefined,
      intervalDays:
        (req.body as any)?.interval_days != null ? Number((req.body as any).interval_days) : undefined,
    })
    res.status(201).json({ plan, payments })
  } catch (err) {
    const e = err as Error & { status?: number }
    req.scope
      .resolve("logger")
      .error(`installment plan create failed: ${e?.message}\n${e?.stack ?? ""}`)
    res.status(e.status ?? 500).json({ message: e.message ?? "Failed to create plan" })
  }
}
