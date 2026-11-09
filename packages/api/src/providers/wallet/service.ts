// @ts-nocheck
import { AbstractPaymentProvider, PaymentActions } from "@medusajs/framework/utils"
import { PaymentSessionStatus } from "@medusajs/framework/types"

interface WalletProviderOptions {
  [key: string]: unknown
}

/**
 * Hybreed Balance payment provider.
 *
 * Closed-loop store credit: the customer's prepaid wallet balance pays for
 * Hybreed orders internally - no external payment rail, no fees.
 *
 * Payment providers run inside the payment module's isolated container and
 * cannot reach the wallet module, so this provider is deliberately thin:
 *   - balance enforcement happens in middleware before the session is
 *     created (`src/api/middlewares.ts` → walletBalanceGuard)
 *   - the actual ledger debit happens in `src/subscribers/wallet-debit.ts`
 *     when the order is placed (idempotent on the payment session id)
 *   - refunds are credited back by `src/subscribers/wallet-refund.ts`
 *     on `payment.refunded`
 *
 * This provider only carries the payment-session lifecycle so checkout,
 * order totals, and Medusa's payment state machine work unchanged.
 */
class WalletProviderService extends AbstractPaymentProvider<WalletProviderOptions> {
  static identifier = "wallet"

  protected readonly options_: WalletProviderOptions

  constructor(
    container: ConstructorParameters<typeof AbstractPaymentProvider>[0],
    options: WalletProviderOptions
  ) {
    super(container, options)
    this.options_ = options
  }

  static validateOptions(_options: Record<string, unknown>): void {
    // No credentials needed - internal ledger provider.
  }

  async initiatePayment(input: {
    amount: unknown
    currency_code: string
    data?: Record<string, unknown>
    context?: { customer?: { id?: string } }
  }): Promise<{
    id: string
    status: PaymentSessionStatus
    data: Record<string, unknown>
  }> {
    const { data } = input
    const sessionId =
      (data?.session_id as string | undefined) ?? `wlt_${Date.now()}`

    return {
      id: `wallet_${sessionId}`,
      status: "pending",
      data: {
        ...(data ?? {}),
        wallet_payment: true,
      },
    }
  }

  async authorizePayment(input: {
    data?: Record<string, unknown>
    context?: { customer?: { id?: string } }
    amount?: unknown
    currency_code?: string
  }): Promise<{ status: PaymentSessionStatus; data: Record<string, unknown> }> {
    return {
      status: "authorized",
      data: { ...(input.data ?? {}), wallet_authorized: true },
    }
  }

  async capturePayment(input: {
    data?: Record<string, unknown>
    context?: { customer?: { id?: string } }
    amount?: unknown
    currency_code?: string
  }): Promise<{ data: Record<string, unknown> }> {
    return {
      data: { ...(input.data ?? {}), wallet_captured: true },
    }
  }

  async getPaymentStatus(input: {
    data?: Record<string, unknown>
  }): Promise<{ status: PaymentSessionStatus; data?: Record<string, unknown> }> {
    const captured = input.data?.wallet_captured === true
    return {
      status: captured ? "captured" : "authorized",
      data: input.data,
    }
  }

  async retrievePayment(input: {
    data?: Record<string, unknown>
  }): Promise<{ data: Record<string, unknown> }> {
    return { data: input.data ?? {} }
  }

  /**
   * The wallet credit itself happens in the wallet-refund subscriber on
   * `payment.refunded` - the provider container cannot reach the wallet
   * module, so this only acknowledges the refund to Medusa's state machine.
   */
  async refundPayment(input: {
    data?: Record<string, unknown>
    amount?: unknown
    currency_code?: string
    context?: { customer?: { id?: string } }
  }): Promise<{ data: Record<string, unknown> }> {
    return {
      data: { ...(input.data ?? {}), wallet_refund_pending: true },
    }
  }

  async cancelPayment(input: {
    data?: Record<string, unknown>
    context?: { customer?: { id?: string } }
  }): Promise<{ data: Record<string, unknown> }> {
    // No ledger entry exists until order.placed - nothing to cancel.
    return { data: { ...(input.data ?? {}), wallet_authorized: false } }
  }

  async deletePayment(input: {
    data?: Record<string, unknown>
    context?: { customer?: { id?: string } }
  }): Promise<{ data: Record<string, unknown> }> {
    return this.cancelPayment(input)
  }

  async updatePayment(input: {
    amount?: unknown
    currency_code?: string
    data?: Record<string, unknown>
  }): Promise<{
    status?: PaymentSessionStatus
    data: Record<string, unknown>
  }> {
    const currencyCode =
      input.currency_code ??
      (input.data?.currency_code as string | undefined)
    const amountChanged =
      typeof input.amount !== "undefined" &&
      typeof input.data?.amount !== "undefined" &&
      !!currencyCode &&
      Number(input.amount) !== Number(input.data.amount)
    const currencyChanged =
      !!input.currency_code && input.currency_code !== input.data?.currency_code

    if (amountChanged || currencyChanged) {
      // Wallet sessions carry no editable state - Medusa recreates the
      // session when cart totals change, so just acknowledge.
      return { status: "authorized", data: input.data ?? {} }
    }

    return {
      status: "authorized",
      data: input.data ?? {},
    }
  }

  async getWebhookActionAndData(): Promise<{
    action: PaymentActions
    data?: { session_id: string; amount: number }
  }> {
    // Internal provider - no external webhooks.
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default WalletProviderService
