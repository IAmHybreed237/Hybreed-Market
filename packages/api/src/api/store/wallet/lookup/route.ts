// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WALLET_MODULE } from "../../../../modules/wallet/service"

const localPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("237") ? digits.slice(3) : digits
}

/**
 * GET /store/wallet/lookup - resolve a transfer recipient.
 * Query: ?customer_id=...  (scan-QR flow)
 *    or  ?phone=...         (send-by-number flow)
 * Returns a minimal public profile so the sender can confirm who they're paying.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!req.auth_context?.actor_id) {
    res.status(401).json({ message: "Authentication required" })
    return
  }

  const customerModule = req.scope.resolve("customer") as any
  const byId = req.query?.customer_id as string | undefined
  const byPhone = req.query?.phone as string | undefined
  const bySeller = req.query?.seller_id as string | undefined

  // Merchant QR: hbpay:s:<seller_id> - resolve the seller's display name.
  if (bySeller) {
    let name = "Hybreed seller"
    try {
      const sellerModule = req.scope.resolve("seller") as any
      const [seller] = await sellerModule.listSellers({ id: bySeller })
      if (seller?.name) name = seller.name
    } catch {
      // seller module shape varies - fall back to generic label
    }
    res.json({ found: true, seller_id: bySeller, name })
    return
  }

  let customer: any = null
  try {
    if (byId) {
      const [c] = await customerModule.listCustomers({ id: byId })
      customer = c ?? null
    } else if (byPhone) {
      const local = localPhone(byPhone)
      if (/^6\d{8}$/.test(local)) {
        for (const candidate of [`+237${local}`, `237${local}`, local]) {
          const [c] = await customerModule.listCustomers({ phone: candidate })
          if (c) {
            customer = c
            break
          }
        }
      }
    }
  } catch {
    customer = null
  }

  if (!customer) {
    res.json({ found: false })
    return
  }

  const name =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    "Hybreed user"
  res.json({
    found: true,
    customer_id: customer.id,
    name,
  })
}
