/**
 * Pay Small Small cancellation fee policy.
 *
 * On cancellation or expiry the money actually paid is split three ways:
 *   - seller compensation: scales with how many installments were paid
 *     (the seller held stock longer)
 *   - platform fee: covers processing + manual reconciliation labor;
 *     slightly higher when installments were paid via wallet/manual
 *     top-up (more platform labor) than via NotchPay (automated)
 *   - buyer refund: everything else - always the majority
 *
 * All rates are constants so they can be tuned without touching logic.
 */

// Seller compensation as a fraction of amount paid, indexed by
// installments paid (1 -> 15%, 2 -> 20%, 3+ -> 22%).
export const SELLER_COMP_PCTS = [0.15, 0.2, 0.22]

// Platform fee as a fraction of amount paid, per payment method.
// Wallet/manual top-ups cost the platform more manual labor than
// automated NotchPay charges.
export const PLATFORM_FEE_PCTS: Record<string, number> = {
  notchpay: 0.05,
  wallet: 0.08,
  manual: 0.08,
}

// Days a buyer has to rescue an overdue installment before the plan
// expires and the fee split applies.
export const GRACE_DAYS = 3

// Reminder windows before the due date (days).
export const REMINDER_DAYS_BEFORE = [3, 1, 0]

// Max active plans and total outstanding layaway value per customer.
export const MAX_ACTIVE_PLANS = 3
export const MAX_OUTSTANDING_XAF = 150_000

export interface CancellationSplit {
  paid_total: number
  parts_paid: number
  seller_compensation: number
  platform_fee: number
  refund_amount: number
  methods: Record<string, number>
}

interface PaidPaymentLike {
  status: string
  amount: unknown
  method: string | null
}

const toNum = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === "number") return v
  const n = (v as { numeric?: unknown }).numeric
  return n == null ? Number(v) : Number(n)
}

/**
 * Computes the cancellation split for a plan given its payments.
 * `payments` should be the plan's installment rows (any order).
 */
export function computeCancellationSplit(
  payments: PaidPaymentLike[]
): CancellationSplit {
  const paid = payments.filter((p) => p.status === "paid")
  const partsPaid = paid.length

  let paidTotal = 0
  let sellerComp = 0
  let platformFee = 0
  const methods: Record<string, number> = {}

  // Seller compensation is a single percentage of the total paid,
  // indexed by how many parts were paid.
  const sellerPct =
    SELLER_COMP_PCTS[Math.min(Math.max(partsPaid, 1), SELLER_COMP_PCTS.length) - 1]

  for (const p of paid) {
    const amount = toNum(p.amount)
    paidTotal += amount
    const method = p.method ?? "manual"
    methods[method] = (methods[method] ?? 0) + amount
    platformFee += amount * (PLATFORM_FEE_PCTS[method] ?? PLATFORM_FEE_PCTS.manual)
  }
  sellerComp = paidTotal * sellerPct

  const refund = Math.max(0, Math.round(paidTotal - sellerComp - platformFee))

  return {
    paid_total: Math.round(paidTotal),
    parts_paid: partsPaid,
    seller_compensation: Math.round(sellerComp),
    platform_fee: Math.round(platformFee),
    refund_amount: refund,
    methods,
  }
}
