import crypto from "crypto";
import { PaymentActions } from "@medusajs/framework/utils";
import NotchPayProviderService from "../service";
import { NotchPayOptions } from "../types";

const WEBHOOK_HASH = "hsk_test.unittesthash";

const options: NotchPayOptions = {
  publicKey: "pk_test.unittest",
  privateKey: "sk_test.unittest",
  webhookHash: WEBHOOK_HASH,
  apiUrl: "https://api.notchpay.co",
};

function makeService() {
  // The provider only uses the container for Medusa-injected deps that the
  // webhook path never touches, so an empty object is sufficient here.
  return new NotchPayProviderService({} as never, options);
}

function sign(body: string, hash = WEBHOOK_HASH): string {
  return crypto.createHmac("sha256", hash).update(body).digest("hex");
}

function webhookPayload(
  type: string,
  transaction: Record<string, unknown>
): { rawData: string; data: Record<string, unknown>; headers: Record<string, string> } {
  const data = { type, data: transaction };
  const rawData = JSON.stringify(data);
  return {
    rawData,
    data,
    headers: { "x-notch-signature": sign(rawData) },
  };
}

function baseTransaction(overrides: Record<string, unknown> = {}) {
  return {
    reference: "trx.test_abc123",
    trxref: "payses_01TESTSESSION",
    status: "pending",
    amount: 29500,
    currency: "XAF",
    ...overrides,
  };
}

describe("NotchPayProviderService webhook handling", () => {
  it("maps payment.failed to FAILED", async () => {
    const service = makeService();
    const result = await service.getWebhookActionAndData(
      webhookPayload("payment.failed", baseTransaction({ status: "failed" }))
    );
    expect(result.action).toBe(PaymentActions.FAILED);
    expect(result.data?.session_id).toBe("payses_01TESTSESSION");
    expect(result.data?.amount).toBe(29500);
  });

  it("maps payment.canceled to FAILED", async () => {
    const service = makeService();
    const result = await service.getWebhookActionAndData(
      webhookPayload("payment.canceled", baseTransaction({ status: "canceled" }))
    );
    expect(result.action).toBe(PaymentActions.FAILED);
  });

  it("maps payment.expired to FAILED", async () => {
    const service = makeService();
    const result = await service.getWebhookActionAndData(
      webhookPayload("payment.expired", baseTransaction({ status: "expired" }))
    );
    expect(result.action).toBe(PaymentActions.FAILED);
  });

  it("maps payment.processing to PENDING", async () => {
    const service = makeService();
    const result = await service.getWebhookActionAndData(
      webhookPayload(
        "payment.processing",
        baseTransaction({ status: "processing" })
      )
    );
    expect(result.action).toBe(PaymentActions.PENDING);
  });

  it("returns NOT_SUPPORTED for non-payment events", async () => {
    const service = makeService();
    const result = await service.getWebhookActionAndData(
      webhookPayload("transfer.complete", baseTransaction())
    );
    expect(result.action).toBe(PaymentActions.NOT_SUPPORTED);
  });

  it("returns NOT_SUPPORTED when no Medusa session id can be resolved", async () => {
    const service = makeService();
    const result = await service.getWebhookActionAndData(
      webhookPayload(
        "payment.failed",
        baseTransaction({ trxref: "order_123", reference: "trx.test_x" })
      )
    );
    expect(result.action).toBe(PaymentActions.NOT_SUPPORTED);
  });

  it("rejects a webhook with an invalid signature", async () => {
    const service = makeService();
    const payload = webhookPayload(
      "payment.failed",
      baseTransaction({ status: "failed" })
    );
    payload.headers["x-notch-signature"] = sign(payload.rawData, "wrong-hash");
    await expect(service.getWebhookActionAndData(payload)).rejects.toThrow(
      /Invalid Notch Pay webhook signature/
    );
  });

  it("rejects a webhook with a missing signature", async () => {
    const service = makeService();
    const payload = webhookPayload(
      "payment.failed",
      baseTransaction({ status: "failed" })
    );
    delete payload.headers["x-notch-signature"];
    await expect(service.getWebhookActionAndData(payload)).rejects.toThrow(
      /Missing x-notch-signature/
    );
  });

  it("maps payment.complete to SUCCESSFUL after server-side re-verification", async () => {
    const service = makeService();
    const client = (service as never as { client_: { getPayment: jest.Mock } })
      .client_;
    client.getPayment = jest.fn().mockResolvedValue(
      baseTransaction({ status: "complete" })
    );

    const result = await service.getWebhookActionAndData(
      webhookPayload("payment.complete", baseTransaction({ status: "pending" }))
    );
    expect(result.action).toBe(PaymentActions.SUCCESSFUL);
    expect(client.getPayment).toHaveBeenCalled();
  });

  it("does not mark payment.complete successful when re-fetch disagrees", async () => {
    const service = makeService();
    const client = (service as never as { client_: { getPayment: jest.Mock } })
      .client_;
    client.getPayment = jest
      .fn()
      .mockResolvedValue(baseTransaction({ status: "processing" }));

    const result = await service.getWebhookActionAndData(
      webhookPayload("payment.complete", baseTransaction({ status: "complete" }))
    );
    expect(result.action).toBe(PaymentActions.PENDING);
  });
});
