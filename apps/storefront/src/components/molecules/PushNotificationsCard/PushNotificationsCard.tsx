"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/atoms"
import { Card } from "@/components/atoms/Card/Card"
import { Heading } from "@medusajs/ui"
import {
  getPushState,
  subscribeToPush,
  unsubscribeFromPush,
  type PushState,
} from "@/lib/push"

export const PushNotificationsCard = () => {
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    getPushState().then(setState)
  }, [])

  if (!state?.supported) return null

  const enabled = state.subscribed && state.permission === "granted"
  const blocked = state.permission === "denied" && !state.subscribed

  const toggle = async () => {
    setBusy(true)
    setMessage("")
    const res = enabled ? await unsubscribeFromPush() : await subscribeToPush()
    setBusy(false)
    if (res.ok) {
      setState(await getPushState())
      setMessage(enabled ? "Notifications turned off" : "You're subscribed!")
    } else {
      setMessage(res.error || "Something went wrong")
    }
  }

  return (
    <Card className="bg-secondary p-4 flex flex-col gap-2 mt-8">
      <div className="flex justify-between items-center gap-4">
        <Heading level="h2" className="heading-sm uppercase">
          Notifications
        </Heading>
        <Button
          variant="tonal"
          className="uppercase flex items-center gap-2 font-semibold shrink-0"
          onClick={toggle}
          disabled={busy || blocked}
        >
          {busy ? "..." : enabled ? "Turn off" : "Enable"}
        </Button>
      </div>
      <p className="label-md text-secondary">
        {blocked
          ? "Notifications are blocked in your browser settings."
          : enabled
            ? "Order updates and announcements will appear on this device."
            : "Get order updates and marketplace announcements on this device."}
      </p>
      {message && <p className="label-md text-primary">{message}</p>}
    </Card>
  )
}
