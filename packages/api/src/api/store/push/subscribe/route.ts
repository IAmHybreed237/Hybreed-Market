// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PUSH_MODULE } from "../../../../modules/push-notifications/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as {
    endpoint?: string
    keys?: { p256dh?: string; auth?: string }
  }
  const endpoint = body.endpoint
  const p256dh = body.keys?.p256dh
  const auth = body.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    res.status(400).json({ message: "Invalid push subscription" })
    return
  }

  const customerId = req.auth_context?.actor_id as string | undefined
  const service = req.scope.resolve(PUSH_MODULE)

  const fields = {
    endpoint,
    p256dh,
    auth,
    customer_id: customerId ?? null,
    user_agent: String(req.headers["user-agent"] ?? "").slice(0, 500) || null,
  }

  const existing = await service.listPushSubscriptions({ endpoint })
  if (existing?.[0]) {
    await service.updatePushSubscriptions([{ id: existing[0].id, ...fields }])
  } else {
    await service.createPushSubscriptions(fields)
  }

  res.json({ ok: true })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const endpoint = String(req.query?.endpoint ?? "")
  if (!endpoint) {
    res.status(400).json({ message: "Missing endpoint" })
    return
  }

  const service = req.scope.resolve(PUSH_MODULE)
  const existing = await service.listPushSubscriptions({ endpoint })
  if (existing?.[0]) {
    await service.deletePushSubscriptions([existing[0].id])
  }

  res.json({ ok: true })
}
