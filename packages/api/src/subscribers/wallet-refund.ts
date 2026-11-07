import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WALLET_MODULE } from "../modules/wallet/service"

const toNum = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === "number") return v
  const n = (v as { numeric?: unknown }).numeric
  return n == null ? Number(v) : Number(n)
}

/**
 * Credits the Hybreed Wallet back when a wallet-paid payment is refunded.
 * The provider cannot reach the wallet module, so the ledger credit happens
 * here. Mercur orders settle through order groups, so the customer is
 * resolved via payment → payment_collection → cart → order_group.
 * Idempotent per payment via the `refund_pay_<id>` reference.
 *
 * Note: credits the full payment amount; partial-refund reconciliation is a
 * follow-up once refund volumes justify it.
 */
export default async function creditWalletRefund({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const paymentId = event.data?.id
  if (!paymentId) return

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "payment",
      fields: [
        "id",
        "amount",
        "currency_code",
        "provider_id",
        "payment_session.provider_id",
        "payment_collection.cart.order_group.id",
        "payment_collection.cart.order_group.customer_id",
      ],
      filters: { id: paymentId },
    })
    const payment: any = data?.[0]
    if (!payment) return

    const providerId =
      payment.provider_id ?? payment.payment_session?.provider_id ?? ""
    if (!String(providerId).includes("pp_wallet")) return

    const group = payment.payment_collection?.cart?.order_group
    const customerId = group?.customer_id
    const amount = toNum(payment.amount)
    if (!customerId || amount <= 0) return

    const wallet = container.resolve(WALLET_MODULE)
    await wallet.credit({
      customerId,
      amount,
      currencyCode: payment.currency_code ?? "xaf",
      type: "refund",
      reference: `refund_pay_${paymentId}`,
      orderId: group?.id,
      description: `Refund · order ${String(group?.id ?? "").slice(-8)}`,
    })
  } catch (e) {
    const logger = container.resolve("logger")
    logger.error(`Failed to credit wallet refund for payment ${paymentId}: ${e}`)
  }
}

export const config: SubscriberConfig = {
  event: "payment.refunded",
}
