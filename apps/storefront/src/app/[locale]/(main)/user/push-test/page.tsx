"use client"

import { useState } from "react"

const PUB =
  "BEdlQWNO6hVHifBml8fWFF3DCK1xXKnhp_oIqt5nFUlBGgnCopWy3ZyvtVOaiS8MUP2JUPyYcioPNHuO5qhayTY"

const b64 = (s: string) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4)
  const b = (s + pad).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export default function PushTestPage() {
  const [state, setState] = useState("")

  const enable = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        return setState("Push not supported on this browser")
      const perm = await Notification.requestPermission()
      if (perm !== "granted") return setState("Permission denied")
      const reg = await navigator.serviceWorker.register("/sw.js")
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64(PUB),
      })
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      })
      setState("Subscribed ✓")
    } catch (e: any) {
      setState("Error: " + (e?.message || e))
    }
  }

  const send = async () => {
    const r = await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Hybreed",
        body: "Test push notification 🎉",
        url: "/dk",
      }),
    })
    const j = await r.json()
    setState(r.ok ? `Sent to ${j.sent} device(s)` : j.error || "Send failed")
  }

  return (
    <main className="max-w-[400px] mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-[#1F1F23]">Push test</h1>
      <button
        onClick={enable}
        className="h-12 rounded-2xl bg-[#2563EB] text-white font-semibold"
      >
        Enable notifications
      </button>
      <button
        onClick={send}
        className="h-12 rounded-2xl border border-[#D9D9E0] text-[#1F1F23] font-semibold"
      >
        Send test notification
      </button>
      {state && <p className="text-[15px] text-[#8A8A96]">{state}</p>}
    </main>
  )
}
