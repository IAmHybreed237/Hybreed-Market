import crypto from "crypto";
import {
  AbstractPaymentProvider,
  BigNumber,
  MathBN,
  MedusaError,
  PaymentActions,
} from "@medusajs/framework/utils";
import {
  MedusaContainer,
  PaymentSessionStatus,
} from "@medusajs/framework/types";
import { NotchPayClient, NotchPayApiError } from "./client";
import {
  NotchPayOptions,
  NotchPayTransaction,
} from "./types";

const ZERO_DECIMAL_CURRENCIES = [
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF",
  "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
];
const THREE_DECIMAL_CURRENCIES = [
  "BHD", "IQD", "JOD", "KWD", "OMR", "TND",
];

function currencyMultiplier(currency: string): number {
  const c = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.includes(c)) return 1;
  if (THREE_DECIMAL_CURRENCIES.includes(c)) return 1000;
  return 100;
}

/** Major units -> smallest currency unit (e.g. XAF stays as-is, EUR *100). */
function toSmallestUnit(amount: unknown, currency: string): number {
  const multiplier = currencyMultiplier(currency);
  const value = new BigNumber(MathBN.mult(amount as never, multiplier));
  return parseInt(value.numeric.toString().split(".")[0], 10);
}

/** Smallest currency unit -> major units. */
function fromSmallestUnit(amount: unknown, currency: string): number {
  const multiplier = currencyMultiplier(currency);
  return new BigNumber(MathBN.div(amount as never, multiplier)).numeric;
}

/**
 * Maps a Notch Pay transaction status to a Medusa payment session status.
 * Notch Pay statuses: pending, processing, incomplete, canceled, failed,
 * rejected, abandoned, expired, complete, refunded, partialy-refunded.
 */
function mapNotchStatus(status?: string): PaymentSessionStatus {
  switch (status) {
    case "complete":
    case "refunded":
    case "partialy-refunded":
      return "captured";
    case "pending":
    case "processing":
    case "incomplete":
      return "pending";
    case "canceled":
    case "expired":
    case "abandoned":
      return "canceled";
    case "failed":
    case "rejected":
    default:
      return "error";
  }
}

function transactionId(txn: NotchPayTransaction | string | undefined): string | undefined {
  if (!txn) return undefined;
  if (typeof txn === "string") return txn;
  const id = txn.id ?? txn.reference;
  return id === undefined ? undefined : String(id);
}

function transactionReference(txn: NotchPayTransaction): string | undefined {
  return txn.reference ?? txn.trxref;
}

class NotchPayProviderService extends AbstractPaymentProvider<NotchPayOptions> {
  static identifier = "notchpay";

  protected readonly options_: NotchPayOptions;
  private readonly client_: NotchPayClient;
  private warnedMissingWebhookHash_ = false;

  constructor(container: MedusaContainer, options: NotchPayOptions) {
    super(container, options);
    this.options_ = options;
    this.client_ = new NotchPayClient(options);
  }

  static validateOptions(options: Record<string, unknown>): void {
    if (!options.publicKey) {
      throw new Error("Notch Pay public key is required");
    }
  }

  private buildError(message: string, error?: unknown): MedusaError {
    if (error instanceof NotchPayApiError) {
      return new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `${message}: ${error.message}`
      );
    }
    return new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message);
  }

  /**
   * Creates a Notch Pay hosted-checkout payment and returns the
   * authorization_url the storefront must redirect the customer to.
   */
  async initiatePayment(input: {
    amount: unknown;
    currency_code: string;
    data?: Record<string, unknown>;
    context?: {
      customer?: {
        first_name?: string | null;
        last_name?: string | null;
        company_name?: string | null;
        email?: string;
        phone?: string | null;
      };
      idempotency_key?: string;
    };
  }): Promise<{
    id: string;
    status: PaymentSessionStatus;
    data: Record<string, unknown>;
  }> {
    const { amount, currency_code, data, context } = input;
    const sessionId = (data?.session_id as string | undefined) ?? undefined;
    const reference =
      sessionId ??
      `hybreed_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const customer = context?.customer;
    // Guest carts have no Medusa customer, so context.customer is empty.
    // The storefront passes the checkout email/phone through session `data`.
    const guestEmail = data?.customer_email as string | undefined;
    const guestPhone = data?.customer_phone as string | undefined;
    const guestName = data?.customer_name as string | undefined;
    const customerName =
      customer?.company_name ??
      [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ??
      guestName ??
      undefined;
    const customerEmail = customer?.email ?? guestEmail;
    const customerPhone = customer?.phone ?? guestPhone;

    let payment;
    try {
      payment = await this.client_.createPayment({
        amount: toSmallestUnit(amount, currency_code),
        currency: currency_code,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone ?? undefined,
        },
        description: `Hybreed order payment ${reference}`,
        reference,
        callback: this.options_.callbackUrl,
        lockedChannel: this.options_.lockedChannel,
        lockedCountry: this.options_.lockedCountry ?? "CM",
      });
    } catch (e) {
      throw this.buildError("Failed to initialize Notch Pay payment", e);
    }

    const txnId = transactionId(payment.transaction);
    if (!txnId || !payment.authorization_url) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Notch Pay did not return a transaction id or authorization_url"
      );
    }

    return {
      id: txnId,
      status: "pending",
      data: {
        ...(data ?? {}),
        id: txnId,
        notchpay_transaction_id: txnId,
        notchpay_reference: reference,
        reference,
        session_id: sessionId,
        authorization_url: payment.authorization_url,
        notchpay_status: "pending",
        amount,
        currency_code,
      },
    };
  }

  /**
   * Verifies the payment directly with Notch Pay. We never trust the
   * amount/status stored locally alone — MoMo is a push payment, so
   * "complete" means funds were actually collected.
   */
  private async fetchVerifiedTransaction(
    data: Record<string, unknown> | undefined,
    currencyCode?: string
  ): Promise<{
    txn: NotchPayTransaction;
    status: PaymentSessionStatus;
    amount?: number;
  }> {
    // Notch Pay lookups require the transaction id (trx.*), not our
    // internal reference (payses_*) which lives in `trxref`.
    const lookupKey =
      (data?.notchpay_transaction_id as string | undefined) ??
      (data?.id as string | undefined) ??
      (data?.reference as string | undefined) ??
      (data?.session_id as string | undefined);

    if (!lookupKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing Notch Pay reference/id in payment session data"
      );
    }

    let txn: NotchPayTransaction;
    try {
      txn = await this.client_.getPayment(lookupKey);
    } catch (e) {
      throw this.buildError("Failed to retrieve Notch Pay payment", e);
    }

    return {
      txn,
      status: mapNotchStatus(txn.status),
      amount:
        typeof txn.amount === "number" && currencyCode
          ? fromSmallestUnit(txn.amount, currencyCode)
          : undefined,
    };
  }

  async authorizePayment(input: {
    data?: Record<string, unknown>;
  }): Promise<{ status: PaymentSessionStatus; data: Record<string, unknown> }> {
    const verified = await this.fetchVerifiedTransaction(input.data);
    // MoMo is an async push payment: while the customer is still on the
    // hosted page (or the webhook hasn't landed), authorization is
    // deferred so cart completion can proceed and the order is created
    // with a pending payment. The payment.complete webhook later
    // authorizes + captures through processPaymentWorkflow.
    const status =
      verified.status === "captured"
        ? "authorized"
        : verified.status === "pending"
          ? "pending_authorization"
          : verified.status;
    return {
      status,
      data: {
        ...(input.data ?? {}),
        notchpay_status: verified.txn.status,
        notchpay_transaction: verified.txn,
      },
    };
  }

  async capturePayment(input: {
    data?: Record<string, unknown>;
    currency_code?: string;
  }): Promise<{ data: Record<string, unknown> }> {
    // Notch Pay has no separate auth/capture step: a "complete" MoMo
    // transaction means funds are already collected. Confirm server-side.
    const currencyCode =
      (input.data?.currency_code as string | undefined) ??
      input.currency_code;
    const verified = await this.fetchVerifiedTransaction(
      input.data,
      currencyCode
    );

    if (verified.status !== "captured") {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Cannot capture Notch Pay payment: status is "${verified.txn.status}"`
      );
    }

    return {
      data: {
        ...(input.data ?? {}),
        notchpay_status: verified.txn.status,
        notchpay_transaction: verified.txn,
      },
    };
  }

  async getPaymentStatus(input: {
    data?: Record<string, unknown>;
  }): Promise<{ status: PaymentSessionStatus; data?: Record<string, unknown> }> {
    const verified = await this.fetchVerifiedTransaction(input.data);
    return {
      status: verified.status,
      data: {
        ...(input.data ?? {}),
        notchpay_status: verified.txn.status,
      },
    };
  }

  async retrievePayment(input: {
    data?: Record<string, unknown>;
  }): Promise<{ data: Record<string, unknown> }> {
    const verified = await this.fetchVerifiedTransaction(input.data);
    return {
      data: {
        ...(input.data ?? {}),
        notchpay_status: verified.txn.status,
        notchpay_transaction: verified.txn,
      },
    };
  }

  async refundPayment(input: {
    data?: Record<string, unknown>;
    amount?: unknown;
  }): Promise<{ data: Record<string, unknown> }> {
    const paymentRef =
      (input.data?.id as string | undefined) ??
      (input.data?.reference as string | undefined);
    if (!paymentRef) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing Notch Pay payment reference for refund"
      );
    }

    const currencyCode = input.data?.currency_code as string | undefined;
    const amountSmallest =
      typeof input.amount !== "undefined" && currencyCode
        ? toSmallestUnit(input.amount, currencyCode)
        : undefined;

    try {
      const refund = await this.client_.createRefund({
        payment: paymentRef,
        amount: amountSmallest,
        reason: "Hybreed refund",
        reference: `refund_${Date.now()}`,
      });
      return {
        data: {
          ...(input.data ?? {}),
          notchpay_refund: refund.refund,
        },
      };
    } catch (e) {
      throw this.buildError("Failed to create Notch Pay refund", e);
    }
  }

  async cancelPayment(input: {
    data?: Record<string, unknown>;
  }): Promise<{ data: Record<string, unknown> }> {
    // Notch Pay transactions expire on their own (~3h) and cannot be
    // canceled once the customer is on the hosted page. Keep the session
    // data unchanged.
    return { data: input.data ?? {} };
  }

  async deletePayment(input: {
    data?: Record<string, unknown>;
  }): Promise<{ data: Record<string, unknown> }> {
    return this.cancelPayment(input);
  }

  async updatePayment(input: {
    amount?: unknown;
    currency_code?: string;
    data?: Record<string, unknown>;
  }): Promise<{
    status?: PaymentSessionStatus;
    data: Record<string, unknown>;
  }> {
    // A Notch Pay payment is immutable once created. If the cart total
    // or currency changed, Medusa must create a new payment session.
    const currencyCode =
      input.currency_code ??
      (input.data?.currency_code as string | undefined);
    const amountChanged =
      typeof input.amount !== "undefined" &&
      typeof input.data?.amount !== "undefined" &&
      !!currencyCode &&
      toSmallestUnit(input.amount, currencyCode) !==
        toSmallestUnit(input.data.amount, currencyCode);
    const currencyChanged =
      !!input.currency_code &&
      input.currency_code !== input.data?.currency_code;

    if (amountChanged || currencyChanged) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Notch Pay payments cannot be updated; create a new payment session"
      );
    }

    return {
      status: mapNotchStatus(input.data?.notchpay_status as string | undefined),
      data: input.data ?? {},
    };
  }

  /**
   * Handles Notch Pay webhook events forwarded by Medusa's built-in
   * /hooks/payment/[provider] endpoint. Verifies the x-notch-signature
   * HMAC before trusting the payload, then re-verifies the transaction
   * status server-side before reporting an action.
   */
  async getWebhookActionAndData(webhookData: {
    data?: Record<string, unknown>;
    rawData?: Buffer | string;
    headers?: Record<string, unknown>;
  }): Promise<{
    action: PaymentActions;
    data?: { session_id: string; amount: number };
  }> {
    const body = webhookData.data ?? {};
    const eventType = body.type as string | undefined;
    const eventData = (body.data ?? {}) as Record<string, unknown>;

    // Only payment lifecycle events map to Medusa payment actions.
    if (!eventType?.startsWith("payment.")) {
      return { action: PaymentActions.NOT_SUPPORTED };
    }

    this.verifySignature(webhookData);

    const txn = await this.resolveWebhookTransaction(eventData);
    const sessionId = this.resolveSessionId(txn, eventData);

    if (!sessionId) {
      // Payment did not originate from this Medusa instance.
      return { action: PaymentActions.NOT_SUPPORTED };
    }

    const currencyCode = (txn.currency as string | undefined) ?? "XAF";
    const amount =
      typeof txn.amount === "number"
        ? fromSmallestUnit(txn.amount, currencyCode)
        : 0;

    switch (eventType) {
      case "payment.complete":
        // Final confirmation: always re-fetch the transaction so a spoofed
        // or replayed webhook cannot mark an unpaid session as paid —
        // the embedded payload's status is never trusted.
        try {
          const fresh = await this.client_.getPayment(
            transactionReference(txn) ?? String(txn.id)
          );
          if (fresh.status !== "complete") {
            return {
              action: PaymentActions.PENDING,
              data: { session_id: sessionId, amount },
            };
          }
        } catch {
          return { action: PaymentActions.NOT_SUPPORTED };
        }
        return {
          action: PaymentActions.SUCCESSFUL,
          data: { session_id: sessionId, amount },
        };
      case "payment.created":
      case "payment.processing":
        return {
          action: PaymentActions.PENDING,
          data: { session_id: sessionId, amount },
        };
      case "payment.failed":
      case "payment.canceled":
      case "payment.expired":
        return {
          action: PaymentActions.FAILED,
          data: { session_id: sessionId, amount },
        };
      default:
        return { action: PaymentActions.NOT_SUPPORTED };
    }
  }

  private verifySignature(webhookData: {
    data?: Record<string, unknown>;
    rawData?: Buffer | string;
    headers?: Record<string, unknown>;
  }): void {
    const hash = this.options_.webhookHash;
    if (!hash) {
      if (!this.warnedMissingWebhookHash_) {
        this.warnedMissingWebhookHash_ = true;
        console.warn(
          "[notchpay] NOTCHPAY_WEBHOOK_HASH is not configured; webhook signatures cannot be verified"
        );
      }
      return;
    }

    const signature = webhookData.headers?.["x-notch-signature"] as
      | string
      | undefined;
    const raw = webhookData.rawData;
    const payload =
      raw instanceof Buffer
        ? raw.toString("utf8")
        : typeof raw === "string"
          ? raw
          : JSON.stringify(webhookData.data ?? {});

    if (!signature) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing x-notch-signature header"
      );
    }

    const expected = crypto
      .createHmac("sha256", hash)
      .update(payload)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid Notch Pay webhook signature"
      );
    }
  }

  /**
   * Webhook payloads may embed the transaction object or only its id.
   * Fetch the full transaction when needed so we always work with
   * authoritative data.
   */
  private async resolveWebhookTransaction(
    eventData: Record<string, unknown>
  ): Promise<NotchPayTransaction> {
    const embedded =
      eventData.transaction && typeof eventData.transaction === "object"
        ? (eventData.transaction as NotchPayTransaction)
        : (eventData as NotchPayTransaction);

    const hasStatus = typeof embedded.status === "string";
    const hasAmount = typeof embedded.amount === "number";

    // If the payload is rich enough, trust its shape but still verify
    // status server-side for `payment.complete` in the caller.
    if (hasStatus && hasAmount) {
      return embedded;
    }

    const lookupKey =
      embedded.reference ??
      embedded.trxref ??
      (embedded.id !== undefined ? String(embedded.id) : undefined);

    if (!lookupKey) {
      return embedded;
    }

    try {
      return await this.client_.getPayment(String(lookupKey));
    } catch {
      return embedded;
    }
  }

  private resolveSessionId(
    txn: NotchPayTransaction,
    eventData: Record<string, unknown>
  ): string | undefined {
    // We set the Notch Pay `reference` to the Medusa payment session id
    // (payses_...) at initiation, so prefer it. Fall back to trxref.
    const candidates = [
      txn.reference,
      txn.trxref,
      eventData.reference,
      eventData.trxref,
    ];
    const sessionId = candidates.find(
      (c): c is string => typeof c === "string" && c.startsWith("payses_")
    );
    return sessionId;
  }
}

export default NotchPayProviderService;
