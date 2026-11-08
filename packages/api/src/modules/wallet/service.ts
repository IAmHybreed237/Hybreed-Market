import { MedusaService } from "@medusajs/framework/utils"
import { MathBN } from "@medusajs/framework/utils"
import WalletAccount from "./models/account"
import WalletEntry from "./models/entry"
import TopupRequest from "./models/topup"

export const WALLET_MODULE = "wallet"

const toNum = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === "number") return v
  const n = (v as { numeric?: unknown }).numeric
  return n == null ? Number(v) : Number(n)
}

const bn = (n: number) => MathBN.convert(n)

// Generated MedusaService methods may return a single entity or an array
// depending on version - normalize to the first result.
const first = <T>(v: T | T[]): T => (Array.isArray(v) ? v[0] : v) as T

class WalletModuleService extends MedusaService({
  WalletAccount,
  WalletEntry,
  TopupRequest,
}) {
  async getOrCreateAccount(customerId: string, currencyCode = "xaf") {
    const [existing] = await this.listWalletAccounts({
      customer_id: customerId,
    })
    if (existing) return existing
    const created = first(
      await this.createWalletAccounts({
        customer_id: customerId,
        currency_code: currencyCode,
        balance: 0,
        points: 0,
      })
    )
    return created
  }

  async getBalance(customerId: string) {
    const account = await this.getOrCreateAccount(customerId)
    return { balance: toNum(account.balance), points: toNum(account.points) }
  }

  /**
   * Debits the wallet for a purchase. Throws if balance is insufficient.
   * Idempotent on `reference` (payment session id): a repeated call with the
   * same reference returns the existing entry instead of double-debiting.
   */
  async debitForPurchase(input: {
    customerId: string
    amount: number
    currencyCode: string
    reference: string
    orderId?: string
    description?: string
    /** Pay-in-Parts: max amount the balance may go negative (installment credit). */
    allowNegativeUpTo?: number
  }) {
    const { customerId, amount, currencyCode, reference, orderId, description } = input
    const allowNegativeUpTo = input.allowNegativeUpTo ?? 0

    const [existing] = await this.listWalletEntries({ reference })
    if (existing) return existing

    const account = await this.getOrCreateAccount(customerId, currencyCode)
    const balance = toNum(account.balance)
    if (MathBN.lt(bn(balance - amount), bn(-allowNegativeUpTo))) {
      const err = new Error("Insufficient wallet balance") as Error & { status?: number }
      err.status = 402
      throw err
    }

    const entry = first(
      await this.createWalletEntries({
        account_id: account.id,
        amount: bn(-amount),
        currency_code: currencyCode,
        type: "purchase",
        status: "completed",
        reference,
        order_id: orderId ?? null,
        description: description ?? "Order payment",
      })
    )

    await this.updateWalletAccounts({
      id: account.id,
      balance: bn(balance - amount),
    })

    return entry
  }

  /** Credits the wallet (refunds, manual adjustments). */
  async credit(input: {
    customerId: string
    amount: number
    currencyCode: string
    type?: "refund" | "adjustment" | "topup"
    reference?: string
    orderId?: string
    description?: string
  }) {
    const { customerId, amount, currencyCode, type = "adjustment", reference, orderId, description } = input
    if (amount <= 0) throw new Error("Credit amount must be positive")

    if (reference) {
      const [existing] = await this.listWalletEntries({ reference })
      if (existing) return existing
    }

    const account = await this.getOrCreateAccount(customerId, currencyCode)
    const balance = toNum(account.balance)

    const entry = first(
      await this.createWalletEntries({
        account_id: account.id,
        amount: bn(amount),
        currency_code: currencyCode,
        type,
        status: "completed",
        reference: reference ?? null,
        order_id: orderId ?? null,
        description: description ?? null,
      })
    )

    await this.updateWalletAccounts({
      id: account.id,
      balance: bn(balance + amount),
    })

    return entry
  }

  /** Awards HB loyalty points (1 pt per 100 XAF by default). */
  async awardPoints(customerId: string, points: number) {
    if (points <= 0) return
    const account = await this.getOrCreateAccount(customerId)
    const current = toNum(account.points)
    await this.updateWalletAccounts({
      id: account.id,
      points: bn(current + points),
    })
  }

  async createTopupRequest(input: {
    customerId: string
    amount: number
    currencyCode: string
    senderPhone: string
    momoReference?: string
    receiptNote?: string
    metadata?: Record<string, unknown>
  }) {
    const account = await this.getOrCreateAccount(
      input.customerId,
      input.currencyCode
    )
    const topup = first(
      await this.createTopupRequests({
      account_id: account.id,
      amount: bn(input.amount),
      currency_code: input.currencyCode,
      sender_phone: input.senderPhone,
      momo_reference: input.momoReference ?? null,
      receipt_note: input.receiptNote ?? null,
      status: "pending",
      metadata: input.metadata ?? null,
      })
    )
    return topup
  }

  async listTopUpsForCustomer(customerId: string) {
    const account = await this.getOrCreateAccount(customerId)
    return this.listTopupRequests(
      { account_id: account.id },
      { order: { created_at: "DESC" }, take: 50 }
    )
  }

  /**
   * Staff approval: credits the wallet and marks the request approved.
   * Idempotent - an already-approved request is returned unchanged.
   */
  async approveTopUp(input: {
    topupId: string
    reviewedBy?: string
    reviewNote?: string
  }) {
    const topup = await this.retrieveTopupRequest(input.topupId)
    if (topup.status === "approved") return topup
    if (topup.status !== "pending") {
      const err = new Error(`Top-up is ${topup.status}, cannot approve`) as Error & { status?: number }
      err.status = 409
      throw err
    }

    const account = await this.retrieveWalletAccount(topup.account_id)
    const amount = toNum(topup.amount)
    const balance = toNum(account.balance)

    const entry = first(
      await this.createWalletEntries({
        account_id: account.id,
        amount: bn(amount),
        currency_code: topup.currency_code,
        type: "topup",
        status: "completed",
        reference: `topup_${topup.id}`,
        description: "Mobile Money top-up",
        metadata: { topup_id: topup.id },
      })
    )

    await this.updateWalletAccounts({
      id: account.id,
      balance: bn(balance + amount),
    })

    const updated = first(
      await this.updateTopupRequests({
        id: topup.id,
        status: "approved",
        reviewed_by: input.reviewedBy ?? null,
        reviewed_at: new Date(),
        review_note: input.reviewNote ?? null,
        entry_id: entry.id,
      })
    )
    return updated
  }

  async rejectTopUp(input: {
    topupId: string
    reviewedBy?: string
    reviewNote?: string
  }) {
    const topup = await this.retrieveTopupRequest(input.topupId)
    if (topup.status !== "pending") {
      const err = new Error(`Top-up is ${topup.status}, cannot reject`) as Error & { status?: number }
      err.status = 409
      throw err
    }
    const updated = first(
      await this.updateTopupRequests({
        id: topup.id,
        status: "rejected",
        reviewed_by: input.reviewedBy ?? null,
        reviewed_at: new Date(),
        review_note: input.reviewNote ?? null,
      })
    )
    return updated
  }

  /** Full wallet statement for the customer-facing page. */
  async getStatement(customerId: string) {
    const account = await this.getOrCreateAccount(customerId)
    const [entries, topups] = await Promise.all([
      this.listWalletEntries(
        { account_id: account.id },
        { order: { created_at: "DESC" }, take: 50 }
      ),
      this.listTopupRequests(
        { account_id: account.id },
        { order: { created_at: "DESC" }, take: 20 }
      ),
    ])
    return {
      account,
      balance: toNum(account.balance),
      points: toNum(account.points),
      entries,
      topups,
    }
  }
}

export default WalletModuleService
