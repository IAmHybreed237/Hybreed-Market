import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { payInstallmentWithWallet } from "../../../../../lib/layaway"

/**
 * POST /store/installments/:id/pay - pay an installment from the Hybreed
 * Wallet. Body: { part_number? } (defaults to the next pending part).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }
  try {
    const result = await payInstallmentWithWallet(req.scope, {
      customerId,
      planId: req.params.id,
      partNumber:
        (req.body as any)?.part_number != null ? Number((req.body as any).part_number) : undefined,
    })
    res.json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    res.status(e.status ?? 500).json({ message: e.message ?? "Payment failed" })
  }
}
