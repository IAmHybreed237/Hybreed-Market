/**
 * Pay-in-Parts (installment) financing via the Hybreed Wallet.
 *
 * A product opts in with metadata.pay_in_parts = { enabled: true, parts: 4 }.
 * When a cart contains such products, the wallet may finance the unpaid
 * portion: the buyer pays part 1 immediately and repays the rest via
 * MoMo top-ups. This helper computes the maximum amount the wallet
 * balance is allowed to go negative for a given cart.
 */

export const getInstallmentCredit = async (
  query: any,
  cartId?: string | null
): Promise<number> => {
  if (!cartId) return 0
  try {
    const { data } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "items.id",
        "items.total",
        "items.product.metadata",
      ],
      filters: { id: cartId },
    })
    const cart = data?.[0]
    let credit = 0
    for (const item of cart?.items ?? []) {
      const pip = item?.product?.metadata?.pay_in_parts as
        | { enabled?: boolean; parts?: number }
        | undefined
      if (!pip?.enabled) continue
      const parts = Math.max(2, Number(pip.parts) || 4)
      const total = Number(item?.total ?? 0)
      if (total > 0) credit += total * (1 - 1 / parts)
    }
    return credit
  } catch {
    return 0
  }
}
