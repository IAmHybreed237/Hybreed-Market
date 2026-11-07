import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendPush } from "../../../lib/push"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { title, body, url, customer_id } = (req.body ?? {}) as {
    title?: string
    body?: string
    url?: string
    customer_id?: string
  }

  if (!title || !body) {
    res.status(400).json({ message: "title and body are required" })
    return
  }

  try {
    const result = await sendPush(
      req.scope,
      { title, body, url },
      { customerId: customer_id }
    )
    res.json(result)
  } catch (e) {
    res.status(500).json({
      message: e instanceof Error ? e.message : "Failed to send push",
    })
  }
}
