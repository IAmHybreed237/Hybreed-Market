import { model } from "@medusajs/framework/utils"
import InstallmentPlan from "./plan"

/**
 * One scheduled payment inside an installment plan. `reference` is the
 * idempotency key (`lay_{planId}_p{partNumber}`) shared by wallet debits
 * and NotchPay charges so a payment can never be recorded twice.
 */
const InstallmentPayment = model.define("installment_payment", {
  id: model.id().primaryKey(),
  plan: model.belongsTo(() => InstallmentPlan, {
    mappedBy: "payments",
  }),

  part_number: model.number(),
  amount: model.bigNumber(),
  due_at: model.dateTime(),
  status: model
    .enum(["pending", "paid", "failed", "void"])
    .default("pending"),
  // How the installment was/will be paid. Null until paid or attempted.
  method: model.enum(["wallet", "notchpay", "manual"]).nullable(),

  reference: model.text().unique(),
  // NotchPay transaction reference once a charge exists.
  provider_reference: model.text().nullable(),
  // Wallet ledger entry id for wallet-paid installments.
  wallet_entry_id: model.text().nullable(),

  paid_at: model.dateTime().nullable(),
  attempts: model.number().default(0),
  last_attempt_at: model.dateTime().nullable(),
  last_reminder_at: model.dateTime().nullable(),

  metadata: model.json().nullable(),
})

export default InstallmentPayment
