import { model } from "@medusajs/framework/utils"

const PushSubscription = model.define("push_subscription", {
  id: model.id().primaryKey(),
  endpoint: model.text().unique(),
  p256dh: model.text(),
  auth: model.text(),
  customer_id: model.text().nullable(),
  user_agent: model.text().nullable(),
})

export default PushSubscription
