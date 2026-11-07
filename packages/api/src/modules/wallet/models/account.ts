import { model } from "@medusajs/framework/utils"
import WalletEntry from "./entry"
import TopUpRequest from "./topup"

const WalletAccount = model.define("wallet_account", {
  id: model.id().primaryKey(),
  // Medusa customer id. One account per customer.
  customer_id: model.text().unique(),
  currency_code: model.text(),
  // Spendable store credit (closed-loop: only usable on Hybreed orders).
  balance: model.bigNumber().default(0),
  // HB loyalty points (cumulative, earned on purchases).
  points: model.bigNumber().default(0),

  entries: model.hasMany(() => WalletEntry, {
    mappedBy: "account",
  }),
  topups: model.hasMany(() => TopUpRequest, {
    mappedBy: "account",
  }),

  metadata: model.json().nullable(),
})

export default WalletAccount
