import { model } from "@medusajs/framework/utils"
import WalletAccount from "./account"

// Manual MoMo top-up: customer sends money to Hybreed's MoMo number and
// submits proof; staff verifies against Hybreed's own MoMo transaction
// history and approves. Balance is only credited on approval.
const TopUpRequest = model.define("topup_request", {
  id: model.id().primaryKey(),
  account: model.belongsTo(() => WalletAccount, {
    mappedBy: "topups",
  }),
  amount: model.bigNumber(),
  currency_code: model.text(),
  // MoMo number the customer sent FROM (must match account expectations).
  sender_phone: model.text(),
  // Transaction reference / memo the customer put on the MoMo transfer.
  momo_reference: model.text().nullable(),
  // Free-text receipt note (e.g. WhatsApp message id or SMS excerpt).
  receipt_note: model.text().nullable(),
  status: model
    .enum(["pending", "approved", "rejected", "cancelled"])
    .default("pending"),
  reviewed_by: model.text().nullable(),
  reviewed_at: model.dateTime().nullable(),
  review_note: model.text().nullable(),
  // Wallet entry created when approved (for traceability).
  entry_id: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default TopUpRequest
