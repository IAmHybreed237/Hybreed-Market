// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WALLET_MODULE } from "../../../../modules/wallet/service"

/**
 * GET /store/wallet/topups - the customer's own top-up requests.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }

  const service = req.scope.resolve(WALLET_MODULE)
  const topups = await service.listTopUpsForCustomer(customerId)
  res.json({ topups })
}

/**
 * POST /store/wallet/topups - create a manual MoMo top-up request.
 * Body: { amount, currency_code?, sender_phone, momo_reference?, receipt_note? }
 * The request stays pending until staff approves it against Hybreed's own
 * MoMo transaction history.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id as string | undefined
  if (!customerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }

  const amount = Number(req.body?.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: "amount must be a positive number" })
    return
  }
  if (amount > 5_000_000) {
    res.status(400).json({ message: "amount exceeds the top-up limit" })
    return
  }

  const senderPhone = String(req.body?.sender_phone ?? "").trim()
  if (senderPhone.length < 8) {
    res.status(400).json({ message: "sender_phone is required" })
    return
  }

  const service = req.scope.resolve(WALLET_MODULE)
  try {
    const topup = await service.createTopupRequest({
      customerId,
      amount,
      currencyCode: (req.body?.currency_code as string) || "xaf",
      senderPhone,
      momoReference: req.body?.momo_reference
        ? String(req.body.momo_reference)
        : undefined,
      receiptNote: req.body?.receipt_note ? String(req.body.receipt_note) : undefined,
      metadata: req.body?.receipt_url
        ? { receipt_url: String(req.body.receipt_url) }
        : undefined,
    })
    res.status(201).json({ topup })
  } catch (err) {
    const e = err as Error & { status?: number }
    req.scope
      .resolve("logger")
      .error(`wallet topup create failed: ${e?.message}\n${e?.stack ?? ""}`)
    res.status(e.status ?? 500).json({ message: e.message ?? "Failed to create top-up" })
  }
}
