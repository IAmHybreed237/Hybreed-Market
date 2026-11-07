const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

export type PushState = {
  supported: boolean
  permission: NotificationPermission | "unsupported"
  subscribed: boolean
}

const urlBase64ToUint8Array = (base64: string) => {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4)
  const b = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export async function getPushState(): Promise<PushState> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { supported: false, permission: "unsupported", subscribed: false }
  }
  try {
    const reg =
      (await navigator.serviceWorker.getRegistration("/sw.js")) ??
      (await navigator.serviceWorker.ready)
    const sub = await reg?.pushManager.getSubscription()
    return {
      supported: true,
      permission: Notification.permission,
      subscribed: !!sub,
    }
  } catch {
    return { supported: true, permission: Notification.permission, subscribed: false }
  }
}

export async function subscribeToPush(): Promise<{
  ok: boolean
  error?: string
}> {
  if (!VAPID_PUBLIC_KEY) return { ok: false, error: "Push is not configured" }
  try {
    const perm = await Notification.requestPermission()
    if (perm !== "granted") {
      return {
        ok: false,
        error:
          perm === "denied"
            ? "Notifications are blocked in browser settings"
            : "Permission not granted",
      }
    }
    const reg = await navigator.serviceWorker.register("/sw.js")
    await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })
    }
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    })
    if (!res.ok) return { ok: false, error: "Could not save subscription" }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Subscribe failed" }
  }
}

export async function unsubscribeFromPush(): Promise<{
  ok: boolean
  error?: string
}> {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => {})
      await sub.unsubscribe()
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unsubscribe failed" }
  }
}
