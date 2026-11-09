import { AbstractPaymentProvider, PaymentActions } from "@medusajs/framework/utils"
import { MedusaContainer, PaymentSessionStatus } from "@medusajs/framework/types"

interface LayawayProviderOptions {
  [key: string]: unknown
}

/**
 * Pay Small Small settlement provider.
 *
 * Installment money was already collected outside Medusa's payment flow
 * (wallet ledger debits + NotchPay charges recorded on the installment
 * plan). When the plan is fully paid we complete the cart through this
 * provider so Medusa's payment state machine, order creation, and Mercur's
 * order-group pipeline work unchanged - but authorize/capture are no-ops
 * because no additional money moves here.
 *
 * Like the wallet provider, this runs in the payment module's isolated
 * container and cannot reach other modules - it is deliberately thin.
 */
class LayawayProviderService extends AbstractPaymentProvider<LayawayProviderOptions> {
  static identifier = "layaway"

  protected readonly options_: LayawayProviderOptions

  constructor(container: MedusaContainer, options: LayawayProviderOptions) {
    super(container, options)
    this.options_ = options
  }

  static validateOptions(_options: Record<string, unknown>): void {
    // No credentials needed - settlement-only provider.
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
      (data?.session_id as string | undefined) ?? `lay_${Date.now()}`

    return {
      id: `layaway_${sessionId}`,
      status: "pending",
      data: {
        ...(data ?? {}),
        layaway_settlement: true,
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
      data: { ...(input.data ?? {}), layaway_authorized: true },
    }
  }

  async capturePayment(input: {
    data?: Record<string, unknown>
    context?: { customer?: { id?: string } }
    amount?: unknown
    currency_code?: string
  }): Promise<{ data: Record<string, unknown> }> {
    return {
      data: { ...(input.data ?? {}), layaway_captured: true },
    }
  }

  async getPaymentStatus(input: {
    data?: Record<string, unknown>
  }): Promise<{ status: PaymentSessionStatus; data?: Record<string, unknown> }> {
    const captured = input.data?.layaway_captured === true
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
   * Refunds on a layaway-settled order are handled by the installments
   * module (fee split + wallet credit), not here - this only acknowledges
   * the refund to Medusa's state machine.
   */
  async refundPayment(input: {
    data?: Record<string, unknown>
    amount?: unknown
    currency_code?: string
    context?: { customer?: { id?: string } }
  }): Promise<{ data: Record<string, unknown> }> {
    return {
      data: { ...(input.data ?? {}), layaway_refund_pending: true },
    }
  }

  async cancelPayment(input: {
    data?: Record<string, unknown>
    context?: { customer?: { id?: string } }
  }): Promise<{ data: Record<string, unknown> }> {
    return { data: { ...(input.data ?? {}), layaway_authorized: false } }
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
  }): Promise<{ data: Record<string, unknown> }> {
    return { data: input.data ?? {} }
  }

  async getWebhookActionAndData(): Promise<{
    action: PaymentActions
    data?: { session_id: string; amount: number }
  }> {
    // Settlement-only provider - no external webhooks.
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default LayawayProviderService
