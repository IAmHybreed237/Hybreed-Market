import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendPush } from "../lib/push"

/**
 * Sends a push to the customer when a fulfillment is created for their order.
 */
export default async function orderShippedPush({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const fulfillmentId = event.data?.id
  if (!fulfillmentId) return

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "fulfillment",
      fields: ["id", "order.id", "order.customer_id", "order.display_id"],
      filters: { id: fulfillmentId },
    })
    const order: any = (data?.[0] as any)?.order
    if (!order?.customer_id) return

    await sendPush(
      container,
      {
        title: "Order on the way",
        body: `Your Hybreed order${
          order.display_id ? ` #${order.display_id}` : ""
        } has been shipped.`,
        url: "/user/orders",
      },
      { customerId: order.customer_id }
    )
  } catch (e) {
    const logger = container.resolve("logger")
    logger.error(`Failed to send shipped push for ${fulfillmentId}: ${e}`)
  }
}

export const config: SubscriberConfig = {
  event: "fulfillment.created",
}
