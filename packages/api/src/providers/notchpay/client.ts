import {
  NotchPayOptions,
  NotchPayPaymentResponse,
  NotchPayRefundResponse,
  NotchPayRetrieveResponse,
  NotchPayTransaction,
  NotchPayTransferResponse,
} from "./types";

const DEFAULT_API_URL = "https://api.notchpay.co";

export class NotchPayApiError extends Error {
  constructor(
    public statusCode: number,
    public responseBody: unknown,
    message?: string
  ) {
    super(message ?? `Notch Pay API error (${statusCode})`);
    this.name = "NotchPayApiError";
  }
}

export class NotchPayClient {
  private readonly apiUrl: string;
  private readonly publicKey: string;
  private readonly privateKey?: string;

  constructor(options: NotchPayOptions) {
    this.apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, "");
    this.publicKey = options.publicKey;
    this.privateKey = options.privateKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    opts?: { grant?: boolean }
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: this.publicKey,
      "Content-Type": "application/json",
    };
    if (opts?.grant) {
      if (!this.privateKey) {
        throw new Error(
          "Notch Pay private key is required for privileged operations (transfers/refunds)"
        );
      }
      headers["X-Grant"] = this.privateKey;
    }

    const res = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await res.json().catch(() => ({}))) as T & {
      message?: string;
    };

    if (!res.ok) {
      const detail =
        (json as { message?: string })?.message ??
        JSON.stringify(json).slice(0, 500);
      throw new NotchPayApiError(
        res.status,
        json,
        `Notch Pay ${method} ${path} failed (${res.status}): ${detail}`
      );
    }

    return json;
  }

  /**
   * POST /payments — create a hosted-checkout payment.
   * Returns the transaction id and the authorization_url to redirect to.
   */
  async createPayment(input: {
    amount: number;
    currency: string;
    customer: {
      name?: string;
      email?: string;
      phone?: string;
    };
    description?: string;
    reference: string;
    callback?: string;
    lockedChannel?: string;
    lockedCountry?: string;
  }): Promise<NotchPayPaymentResponse> {
    const body: Record<string, unknown> = {
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      customer: input.customer,
      description: input.description,
      reference: input.reference,
      callback: input.callback,
    };
    if (input.lockedChannel) body.locked_channel = input.lockedChannel;
    if (input.lockedCountry) body.locked_country = input.lockedCountry;

    return this.request<NotchPayPaymentResponse>("POST", "/payments", body);
  }

  /**
   * GET /payments/{reference} — retrieve a payment/transaction by its
   * reference or transaction id. Always verify status server-side instead
   * of trusting redirect or webhook parameters.
   */
  async getPayment(reference: string): Promise<NotchPayTransaction> {
    const res = await this.request<NotchPayRetrieveResponse>(
      "GET",
      `/payments/${encodeURIComponent(reference)}`
    );
    const txn = res.transaction;
    if (!txn || typeof txn !== "object") {
      throw new NotchPayApiError(
        res.code ?? 0,
        res,
        "Notch Pay returned no transaction for payment lookup"
      );
    }
    return txn;
  }

  /**
   * POST /refunds — refund a completed payment (full or partial).
   * Requires the private key (X-Grant).
   */
  async createRefund(input: {
    payment: string;
    amount?: number;
    reason?: string;
    reference?: string;
  }): Promise<NotchPayRefundResponse> {
    const body: Record<string, unknown> = {
      payment: input.payment,
      reason: input.reason,
    };
    if (typeof input.amount === "number") body.amount = input.amount;
    if (input.reference) body.reference = input.reference;

    return this.request<NotchPayRefundResponse>("POST", "/refunds", body, {
      grant: true,
    });
  }

  /**
   * POST /transfers — send money to a Mobile Money recipient.
   * Requires the private key (X-Grant). Used for seller payouts and refunds.
   */
  async createTransfer(input: {
    amount: number;
    currency: string;
    channel: string;
    recipient: string;
    description: string;
    reference?: string;
  }): Promise<NotchPayTransferResponse> {
    const body: Record<string, unknown> = {
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      channel: input.channel,
      recipient: input.recipient,
      description: input.description,
      reference: input.reference,
    };

    return this.request<NotchPayTransferResponse>(
      "POST",
      "/transfers",
      body,
      { grant: true }
    );
  }

  /**
   * GET /transfers/{id} — retrieve transfer status for reconciliation.
   */
  async getTransfer(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "GET",
      `/transfers/${encodeURIComponent(id)}`
    );
  }
}
