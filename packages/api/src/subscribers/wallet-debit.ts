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
 * Debits the Hybreed Wallet when an order group is placed with a wallet
 * payment session. Mercur carts settle through order groups, and the cart's
 * payment collection (not the order's) holds the sessions - so we resolve
 * order_group → cart → payment_collection → payment_sessions.
 *
 * The payment provider itself cannot reach the wallet module (isolated
 * container), so the ledger entry is created here.
 *
 * Idempotent: the ledger reference is the payment session id, so subscriber
 * retries or duplicate events never double-charge.
 */
export default async function debitWalletForOrderGroup({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderGroupId = event.data?.id
  if (!orderGroupId) return

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "order_group",
      fields: [
        "id",
        "customer_id",
        "cart_id",
        "cart.payment_collection.payment_sessions.id",
        "cart.payment_collection.payment_sessions.provider_id",
        "cart.payment_collection.payment_sessions.amount",
        "cart.payment_collection.payment_sessions.currency_code",
      ],
      filters: { id: orderGroupId },
    })
    const group: any = data?.[0]
    if (!group?.customer_id) return

    const sessions =
      group.cart?.payment_collection?.payment_sessions ?? []
    const walletSessions = sessions.filter((s: any) =>
      String(s.provider_id ?? "").includes("pp_wallet")
    )
    if (!walletSessions.length) return

    const wallet = container.resolve(WALLET_MODULE)
    for (const session of walletSessions) {
      const amount = toNum(session.amount)
      if (amount <= 0) continue
      await wallet.debitForPurchase({
        customerId: group.customer_id,
        amount,
        currencyCode: session.currency_code ?? "xaf",
        reference: `wallet_session_${session.id}`,
        orderId: orderGroupId,
        description: `Order payment · ${orderGroupId}`,
      })
    }
  } catch (e) {
    const logger = container.resolve("logger")
    logger.error(`Failed to debit wallet for order group ${orderGroupId}: ${e}`)
  }
}

export const config: SubscriberConfig = {
  event: "order_group.created",
}
