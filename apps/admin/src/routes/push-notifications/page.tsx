import { useEffect, useState } from "react"
import { getAuthHeaders } from "@mercurjs/admin"
import { Button, Heading, Input, Text, Textarea } from "@medusajs/ui"

declare const __BACKEND_URL__: string

export const config = {
  label: "Push notifications",
}

const PushNotificationsPage = () => {
  const [count, setCount] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [url, setUrl] = useState("/cm")
  const [customerId, setCustomerId] = useState("")
  const [status, setStatus] = useState("")
  const [sending, setSending] = useState(false)

  const loadCount = async () => {
    try {
      const res = await fetch(`${__BACKEND_URL__}/admin/push/subscribers`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const j = await res.json()
        setCount(j.count ?? 0)
      }
    } catch {
      // count is informational only
    }
  }

  useEffect(() => {
    loadCount()
  }, [])

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      setStatus("Title and message are required")
      return
    }
    setSending(true)
    setStatus("")
    try {
      const res = await fetch(`${__BACKEND_URL__}/admin/push/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || "/",
          ...(customerId.trim() ? { customer_id: customerId.trim() } : {}),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus(
          `Sent to ${j.sent ?? 0} device(s)` +
            (j.failed ? `, ${j.failed} failed` : "") +
            (j.pruned ? `, ${j.pruned} expired removed` : "")
        )
      } else {
        setStatus(j.message || "Send failed")
      }
    } catch {
      setStatus("Send failed")
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col gap-y-4 max-w-[560px] p-4">
      <div className="flex items-center justify-between">
        <Heading level="h1">Push notifications</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {count == null ? "..." : `${count} subscribed device(s)`}
        </Text>
      </div>

      <Text size="small" className="text-ui-fg-subtle">
        Send a notification to every device that opted in on the storefront.
        Leave customer ID empty for a broadcast, or enter one to notify a
        single customer.
      </Text>

      <div className="flex flex-col gap-y-3">
        <div className="flex flex-col gap-y-1">
          <Text size="small" weight="plus">Title</Text>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Flash sale this weekend!"
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Text size="small" weight="plus">Message</Text>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="20% off all wigs until Sunday"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          <div className="flex flex-col gap-y-1">
            <Text size="small" weight="plus">Link (optional)</Text>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/cm/catalog"
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Text size="small" weight="plus">Customer ID (optional)</Text>
            <Input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="cus_... for one customer"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-x-3">
        <Button onClick={send} disabled={sending}>
          {sending ? "Sending..." : "Send notification"}
        </Button>
        {status && (
          <Text size="small" className="text-ui-fg-subtle">
            {status}
          </Text>
        )}
      </div>
    </div>
  )
}

export default PushNotificationsPage
