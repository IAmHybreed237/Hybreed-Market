import webpush from "web-push"
import { PUSH_MODULE } from "../modules/push-notifications/service"

export interface PushPayload {
  title: string
  body: string
  url?: string
}

interface StoredSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  customer_id?: string | null
}

let vapidReady = false

const ensureVapid = () => {
  if (vapidReady) return
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) {
    throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not configured")
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@hybreed.dev",
    pub,
    priv
  )
  vapidReady = true
}

const toWebPushSub = (s: StoredSubscription) => ({
  endpoint: s.endpoint,
  keys: { p256dh: s.p256dh, auth: s.auth },
})

const isGone = (err: unknown): boolean => {
  const status = (err as { statusCode?: number })?.statusCode
  return status === 404 || status === 410
}

/**
 * Sends a push to stored subscriptions. When customerId is provided only
 * that customer's devices receive it; otherwise it's a broadcast.
 * Expired subscriptions (404/410 from the push service) are deleted.
 */
export async function sendPush(
  container: { resolve: (key: string) => any },
  payload: PushPayload,
  opts: { customerId?: string } = {}
): Promise<{ sent: number; failed: number; pruned: number }> {
  ensureVapid()
  const service = container.resolve(PUSH_MODULE)
  const filters: Record<string, unknown> = {}
  if (opts.customerId) filters.customer_id = opts.customerId

  const subs: StoredSubscription[] = await service.listPushSubscriptions(filters)
  if (!subs.length) return { sent: 0, failed: 0, pruned: 0 }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
  })

  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification(toWebPushSub(s), body))
  )

  const goneIds = subs
    .filter((_, i) => {
      const r = results[i]
      return r.status === "rejected" && isGone(r.reason)
    })
    .map((s) => s.id)

  if (goneIds.length) {
    await service.deletePushSubscriptions(goneIds).catch(() => {})
  }

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    pruned: goneIds.length,
  }
}
