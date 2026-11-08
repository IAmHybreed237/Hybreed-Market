import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WALLET_MODULE } from "../../../../modules/wallet/service"

const localPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("237") ? digits.slice(3) : digits
}

const phoneCandidates = (phone: string): string[] => {
  const local = localPhone(phone)
  if (!/^6\d{8}$/.test(local)) return []
  return [`+237${local}`, `237${local}`, local]
}

/**
 * POST /store/wallet/transfer - send wallet balance to another customer.
 * Body: { to_customer_id? , to_phone? , amount, reference?, note? }
 * Exactly one of to_customer_id / to_phone is required.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const fromCustomerId = req.auth_context?.actor_id as string | undefined
  if (!fromCustomerId) {
    res.status(401).json({ message: "Authentication required" })
    return
  }

  const toCustomerId = req.body?.to_customer_id
    ? String(req.body.to_customer_id)
    : undefined
  const toSellerId = req.body?.to_seller_id
    ? String(req.body.to_seller_id)
    : undefined
  const toPhone = req.body?.to_phone ? String(req.body.to_phone) : undefined
  const amount = Number(req.body?.amount)
  const reference = req.body?.reference ? String(req.body.reference) : undefined
  const note = req.body?.note ? String(req.body.note) : undefined

  if (!toCustomerId && !toSellerId && !toPhone) {
    res.status(400).json({ message: "to_customer_id, to_seller_id or to_phone is required" })
    return
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: "amount must be a positive number" })
    return
  }
  if (amount > 5_000_000) {
    res.status(400).json({ message: "amount exceeds the transfer limit" })
    return
  }

  // Merchant payments credit a wallet account keyed `seller:<id>` - seller
  // settlement is handled manually for now, same as top-up approvals.
  let recipientId = toSellerId ? `seller:${toSellerId}` : toCustomerId
  if (!recipientId && toPhone) {
    const customerModule = req.scope.resolve("customer") as any
    for (const candidate of phoneCandidates(toPhone)) {
      const [c] = await customerModule.listCustomers({ phone: candidate })
      if (c) {
        recipientId = c.id
        break
      }
    }
    if (!recipientId) {
      res.status(404).json({ message: "No Hybreed account found for that number" })
      return
    }
  }

  const wallet = req.scope.resolve(WALLET_MODULE)
  try {
    const result = await wallet.transfer({
      fromCustomerId,
      toCustomerId: recipientId,
      amount,
      reference,
      note,
    })
    res.json(result)
  } catch (error: any) {
    const status = error?.status ?? 500
    res.status(status).json({ message: error?.message ?? "Transfer failed" })
  }
}
