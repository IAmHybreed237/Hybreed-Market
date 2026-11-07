"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/atoms"
import { getPushState, subscribeToPush } from "@/lib/push"

const SNOOZE_KEY = "hb_push_prompt_last"
const OPENS_KEY = "hb_push_prompt_opens"
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000
const PROMPT_EVERY_N_OPENS = 3

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true)

const isDue = () => {
  const opens = Number(localStorage.getItem(OPENS_KEY) || "0") + 1
  localStorage.setItem(OPENS_KEY, String(opens))
  const last = Number(localStorage.getItem(SNOOZE_KEY) || "0")
  return Date.now() - last > SNOOZE_MS && opens % PROMPT_EVERY_N_OPENS === 1
}

const markAsked = () => localStorage.setItem(SNOOZE_KEY, String(Date.now()))

export const PushPermissionPrompt = () => {
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!isStandalone()) return
      const state = await getPushState()
      if (cancelled || !state.supported) return

      if (state.permission === "granted") {
        if (!state.subscribed) subscribeToPush().catch(() => {})
        return
      }
      if (state.permission !== "default" || state.subscribed) return
      if (!isDue()) return

      // Ask natively on open, same as the location prompt. Some browsers
      // (iOS Safari) ignore requests without a user gesture and return
      // "default" — for those we show the banner so the user can tap.
      markAsked()
      try {
        const perm = await Notification.requestPermission()
        if (cancelled) return
        if (perm === "granted") {
          await subscribeToPush()
          return
        }
        if (perm === "denied") return
      } catch {
        // fall through to banner
      }
      if (!cancelled) setShow(true)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (!show || done) return null

  const enable = async () => {
    setBusy(true)
    const res = await subscribeToPush()
    setBusy(false)
    if (res.ok) setDone(true)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-xl flex flex-col gap-3">
        <div>
          <p className="text-[15px] font-semibold text-gray-900">
            Turn on notifications?
          </p>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Get order updates, deals and drops on this device.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="tonal"
            className="flex-1 rounded-xl font-semibold"
            onClick={() => setShow(false)}
            disabled={busy}
          >
            Not now
          </Button>
          <Button
            className="flex-1 rounded-xl font-semibold"
            onClick={enable}
            disabled={busy}
          >
            {busy ? "..." : "Enable"}
          </Button>
        </div>
      </div>
    </div>
  )
}
