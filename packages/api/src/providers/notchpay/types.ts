export type NotchPayOptions = {
  /**
   * Public API key sent as the `Authorization` header for payments,
   * refunds and retrieval. Test keys are prefixed with `test_`.
   */
  publicKey: string;
  /**
   * Private key sent as the `X-Grant` header for privileged operations
   * (transfers, refunds).
   */
  privateKey?: string;
  /**
   * Webhook hash key used to verify the `x-notch-signature` HMAC-SHA256
   * signature. Found in the dashboard under Settings > API Keys.
   */
  webhookHash?: string;
  /**
   * Base URL of the Notch Pay API. Defaults to production; sandbox uses
   * the same host with `test_` keys.
   */
  apiUrl?: string;
  /**
   * URL Notch Pay redirects the customer to after the hosted checkout.
   */
  callbackUrl?: string;
  /**
   * Optional Notch Pay channel restriction, e.g. "cm.mtn" or "cm.orange".
   * When unset the hosted page offers all enabled Cameroon channels.
   */
  lockedChannel?: string;
  /**
   * Optional country lock, defaults to "CM".
   */
  lockedCountry?: string;
};

export type NotchPayTransaction = {
  id?: number | string;
  reference?: string;
  trxref?: string;
  amount?: number;
  currency?: string;
  status?: string;
  channel?: string;
  customer?: {
    email?: string;
    phone?: string;
    name?: string;
  };
  [key: string]: unknown;
};

export type NotchPayPaymentResponse = {
  status: string;
  message: string;
  code: number;
  transaction?: NotchPayTransaction | string;
  authorization_url?: string;
};

export type NotchPayRetrieveResponse = {
  status: string;
  message: string;
  code: number;
  transaction?: NotchPayTransaction;
};

export type NotchPayRefundResponse = {
  status: string;
  message: string;
  code: number;
  refund?: {
    id?: string;
    status?: string;
    amount?: number;
    [key: string]: unknown;
  };
};

export type NotchPayTransferResponse = {
  status: string;
  message: string;
  code: number;
  transfer?: {
    id?: string;
    status?: string;
    [key: string]: unknown;
  };
};
