import { model } from "@medusajs/framework/utils"

// Records that a pickup QR token has been redeemed. One row per token -
// the unique token_hash is what makes redemption single-use.
const PickupRedemption = model.define("pickup_redemption", {
  id: model.id().primaryKey(),
  token_hash: model.text().unique(),
  order_group_id: model.text(),
  customer_id: model.text().nullable(),
  redeemed_by: model.text().nullable(),
  agent_note: model.text().nullable(),
  redeemed_at: model.dateTime(),
  metadata: model.json().nullable(),
})

export default PickupRedemption
