import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendPush } from "../lib/push"

/**
 * Sends a push to the customer when their order group is placed.
 */
export default async function orderConfirmedPush({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderGroupId = event.data?.id
  if (!orderGroupId) return

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "order_group",
      fields: ["id", "customer_id", "display_id"],
      filters: { id: orderGroupId },
    })
    const group: any = data?.[0]
    if (!group?.customer_id) return

    await sendPush(
      container,
      {
        title: "Order confirmed",
        body: `Thanks for shopping with Hybreed! Your order${
          group.display_id ? ` #${group.display_id}` : ""
        } is confirmed.`,
        url: "/user/orders",
      },
      { customerId: group.customer_id }
    )
  } catch (e) {
    const logger = container.resolve("logger")
    logger.error(`Failed to send order push for ${orderGroupId}: ${e}`)
  }
}

export const config: SubscriberConfig = {
  event: "order_group.created",
}
