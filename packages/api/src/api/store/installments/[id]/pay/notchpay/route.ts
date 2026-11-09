import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createNotchPayInstallmentCharge } from "../../../../../../lib/layaway"

/**
 * POST /store/installments/:id/pay/notchpay - create a MoMo hosted-checkout
 * charge for an installment. Returns the authorization_url to redirect to.
 * Body: { part_number? }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }
  try {
    const result = await createNotchPayInstallmentCharge(req.scope, {
      customerId,
      planId: req.params.id,
      partNumber:
        (req.body as any)?.part_number != null ? Number((req.body as any).part_number) : undefined,
    })
    res.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    req.scope
      .resolve("logger")
      .error(`installment notchpay charge failed: ${e?.message}`)
    res.status(e.status ?? 500).json({ message: e.message ?? "Charge failed" })
  }
}
