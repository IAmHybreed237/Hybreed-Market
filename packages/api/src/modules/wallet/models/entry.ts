import { model } from "@medusajs/framework/utils"
import WalletAccount from "./account"

const WalletEntry = model.define("wallet_entry", {
  id: model.id().primaryKey(),
  account: model.belongsTo(() => WalletAccount, {
    mappedBy: "entries",
  }),
  // Signed amount in the account currency. Positive = credit, negative = debit.
  amount: model.bigNumber(),
  currency_code: model.text(),
  type: model
    .enum([
      "topup",
      "purchase",
      "refund",
      "points_earn",
      "points_redeem",
      "transfer",
      "adjustment",
    ])
    .default("adjustment"),
  status: model
    .enum(["pending", "completed", "failed", "cancelled"])
    .default("completed"),
  // Idempotency / traceability: payment session id, order id, top-up id...
  reference: model.text().nullable(),
  order_id: model.text().nullable(),
  description: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default WalletEntry
