import { model } from "@medusajs/framework/utils"
import InstallmentPayment from "./payment"

/**
 * A Pay Small Small (layaway) plan: the buyer reserves items and pays the
 * total in `parts_count` installments `interval_days` apart. The order is
 * only placed (cart completed) once every installment is paid - nothing
 * ships before full payment.
 */
const InstallmentPlan = model.define("installment_plan", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  status: model
    .enum(["active", "completed", "cancelled", "expired"])
    .default("active"),

  // Medusa cart completed when the plan is fully paid. Items are also
  // snapshotted in `items` for display/admin purposes.
  cart_id: model.text().nullable(),
  order_id: model.text().nullable(),
  order_group_id: model.text().nullable(),

  currency_code: model.text(),
  total_amount: model.bigNumber(),
  amount_paid: model.bigNumber().default(0),
  parts_count: model.number(),
  interval_days: model.number(),

  // Snapshot of cart items at plan creation:
  // [{ product_id, title, quantity, unit_price, image_url, seller_id }]
  items: model.json(),

  next_due_at: model.dateTime().nullable(),
  started_at: model.dateTime(),
  completed_at: model.dateTime().nullable(),
  cancelled_at: model.dateTime().nullable(),
  cancel_reason: model.text().nullable(),

  // Emergency pause: while now < paused_until the lifecycle job skips the
  // plan. One pause per rolling year (enforced in the service).
  paused_until: model.dateTime().nullable(),
  pause_count: model.number().default(0),
  last_paused_at: model.dateTime().nullable(),

  // Fee split recorded on cancellation/expiry:
  // { paid_total, seller_compensation, platform_fee, refund_amount,
  //   parts_paid, methods: { wallet: x, notchpay: y, manual: z } }
  settlement: model.json().nullable(),

  payments: model.hasMany(() => InstallmentPayment, {
    mappedBy: "plan",
  }),

  metadata: model.json().nullable(),
})

export default InstallmentPlan
