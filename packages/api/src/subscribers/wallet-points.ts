import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WALLET_MODULE } from "../modules/wallet/service"

const WALLET_MULTIPLIER = 2

const toNum = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === "number") return v
  const n = (v as { numeric?: unknown }).numeric
  return n == null ? Number(v) : Number(n)
}

/**
 * Awards HB points when an order group is placed:
 *   1 point per 100 XAF spent, doubled for Hybreed Wallet payments.
 * Mercur settles carts through order groups, so we award once per group on
 * its computed total and detect the wallet session via the cart's payment
 * collection.
 */
export default async function awardOrderPoints({
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
        "total",
        "cart.payment_collection.payment_sessions.provider_id",
      ],
      filters: { id: orderGroupId },
    })
    const group: any = data?.[0]
    if (!group?.customer_id) return

    const paidTotal = toNum(group.total)
    if (paidTotal <= 0) return

    const providers =
      group.cart?.payment_collection?.payment_sessions ?? []
    const walletPaid = providers.some((s: any) =>
      String(s?.provider_id ?? "").includes("pp_wallet")
    )

    const points = Math.floor(
      (paidTotal / 100) * (walletPaid ? WALLET_MULTIPLIER : 1)
    )
    if (points <= 0) return

    const wallet = container.resolve(WALLET_MODULE)
    await wallet.awardPoints(group.customer_id, points)

    // Record the earn as a ledger entry for the statement view.
    const account = await wallet.getOrCreateAccount(group.customer_id)
    await wallet.createWalletEntries({
      account_id: account.id,
      amount: 0,
      currency_code: "xaf",
      type: "points_earn",
      status: "completed",
      reference: `points_group_${orderGroupId}`,
      order_id: orderGroupId,
      description: `HB points · order ${orderGroupId}`,
      metadata: { points },
    })
  } catch (e) {
    const logger = container.resolve("logger")
    logger.error(`Failed to award HB points for order group ${orderGroupId}: ${e}`)
  }
}

export const config: SubscriberConfig = {
  event: "order_group.created",
}
