// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"
import { PICKUP_MODULE } from "../../../modules/pickup/service"
import {
  pickupTokenHash,
  verifyPickupToken,
} from "../../../lib/pickup-token"

const summarize = (og: any) => ({
  display_id: og?.display_id ?? null,
  status: og?.status ?? null,
  created_at: og?.created_at ?? null,
  orders: (og?.orders ?? []).map((o: any) => ({
    display_id: o?.display_id ?? null,
    status: o?.status ?? o?.fulfillment_status ?? null,
    seller: o?.seller?.name ?? null,
    items: Array.isArray(o?.items) ? o.items.length : 0,
  })),
})

const loadGroup = async (req: MedusaRequest, orderGroupId: string) => {
  const sellerService = req.scope.resolve(MercurModules.SELLER) as any
  return sellerService.retrieveOrderGroup(orderGroupId).catch(() => null)
}

/**
 * POST /store/pickup/verify - validate a pickup QR token and return a
 * minimal order summary for the person handing over the parcel.
 * Does NOT redeem - call /store/pickup/redeem to mark it used.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const token = String(req.body?.token ?? "")
  const parsed = verifyPickupToken(token)
  if (!parsed) {
    res.status(400).json({ message: "Invalid or expired pickup code" })
    return
  }

  const pickup = req.scope.resolve(PICKUP_MODULE) as any
  const existing = await pickup.findByTokenHash(pickupTokenHash(token))
  if (existing) {
    res.status(409).json({
      message: "This pickup code was already used",
      redeemed_at: existing.redeemed_at,
    })
    return
  }

  const og = await loadGroup(req, parsed.orderGroupId)
  if (!og) {
    res.status(404).json({ message: "Order not found" })
    return
  }

  res.json({ valid: true, ...summarize(og) })
}

/**
 * POST /store/pickup/redeem - single-use redemption of a pickup QR token.
 * Body: { token, agent_note? }
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const token = String(req.body?.token ?? "")
  const parsed = verifyPickupToken(token)
  if (!parsed) {
    res.status(400).json({ message: "Invalid or expired pickup code" })
    return
  }

  const pickup = req.scope.resolve(PICKUP_MODULE) as any
  const existing = await pickup.findByTokenHash(pickupTokenHash(token))
  if (existing) {
    res.status(409).json({
      message: "This pickup code was already used",
      redeemed_at: existing.redeemed_at,
    })
    return
  }

  const og = await loadGroup(req, parsed.orderGroupId)
  if (!og) {
    res.status(404).json({ message: "Order not found" })
    return
  }

  try {
    await pickup.redeem({
      tokenHash: pickupTokenHash(token),
      orderGroupId: parsed.orderGroupId,
      agentNote: req.body?.agent_note ? String(req.body.agent_note) : null,
    })
  } catch {
    res.status(409).json({ message: "This pickup code was already used" })
    return
  }

  res.json({ redeemed: true, ...summarize(og) })
}
