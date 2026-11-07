"use client"

import { useEffect, useState } from "react"
import {
  getPushState,
  subscribeToPush,
  unsubscribeFromPush,
  type PushState,
} from "@/lib/push"

export default function PushTestPage() {
  const [state, setState] = useState<PushState | null>(null)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    getPushState().then(setState)
  }, [])

  const refresh = async () => setState(await getPushState())

  const enable = async () => {
    const res = await subscribeToPush()
    setMsg(res.ok ? "Subscribed ✓" : res.error || "Failed")
    await refresh()
  }

  const disable = async () => {
    const res = await unsubscribeFromPush()
    setMsg(res.ok ? "Unsubscribed ✓" : res.error || "Failed")
    await refresh()
  }

  return (
    <main className="max-w-[400px] mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-[#1F1F23]">Push test</h1>
      <p className="text-[15px] text-[#8A8A96]">
        Status:{" "}
        {state
          ? `${state.supported ? "supported" : "unsupported"} · ${
              state.permission
            } · ${state.subscribed ? "subscribed" : "not subscribed"}`
          : "checking..."}
      </p>
      <button
        onClick={enable}
        className="h-12 rounded-2xl bg-[#2563EB] text-white font-semibold"
      >
        Enable notifications
      </button>
      <button
        onClick={disable}
        className="h-12 rounded-2xl border border-[#D9D9E0] text-[#1F1F23] font-semibold"
      >
        Disable notifications
      </button>
      {msg && <p className="text-[15px] text-[#8A8A96]">{msg}</p>}
    </main>
  )
}
