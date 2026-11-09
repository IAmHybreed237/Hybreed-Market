import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  completeCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
} from "@medusajs/medusa/core-flows"
import { INSTALLMENTS_MODULE } from "../modules/installments/service"
import { WALLET_MODULE } from "../modules/wallet/service"
import { NotchPayClient } from "../providers/notchpay/client"
import {
  computeCancellationSplit,
  MAX_ACTIVE_PLANS,
  MAX_OUTSTANDING_XAF,
  REMINDER_DAYS_BEFORE,
  GRACE_DAYS,
} from "./layaway-fees"
import { sendPush } from "./push"

/** Payment provider id for layaway-settled carts (pp_{id}_{identifier}). */
export const LAYAWAY_PROVIDER_ID = "pp_layaway_layaway"

const toNum = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === "number") return v
  const n = (v as { numeric?: unknown }).numeric
  return n == null ? Number(v) : Number(n)
}

type Scope = { resolve: (key: string) => any }

/* ------------------------------------------------------------------ */
/* NotchPay per-installment charges                                    */
/* ------------------------------------------------------------------ */

let notchpayClient: NotchPayClient | null = null

export function getNotchPayClient(): NotchPayClient | null {
  if (notchpayClient) return notchpayClient
  const publicKey = process.env.NOTCHPAY_PUBLIC_KEY
  if (!publicKey) return null
  notchpayClient = new NotchPayClient({
    publicKey,
    privateKey: process.env.NOTCHPAY_PRIVATE_KEY,
    apiUrl: process.env.NOTCHPAY_API_URL,
    webhookHash: process.env.NOTCHPAY_WEBHOOK_HASH,
  })
  return notchpayClient
}

/* ------------------------------------------------------------------ */
/* Plan creation                                                       */
/* ------------------------------------------------------------------ */

type CartItemSnapshot = {
  product_id: string
  title: string
  quantity: number
  unit_price: number
  total: number
  image_url?: string | null
}

/**
 * Creates a layaway plan from an open cart. Requires at least one
 * pay_in_parts-enabled product; parts/interval come from product metadata
 * (max across items) unless overridden.
 */
export async function createPlanFromCart(
  scope: Scope,
  input: {
    customerId: string
    cartId: string
    parts?: number
    intervalDays?: number
  }
) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const installments = scope.resolve(INSTALLMENTS_MODULE)

  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "total",
      "currency_code",
      "completed_at",
      "items.id",
      "items.product_id",
      "items.title",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "items.thumbnail",
      "items.product.id",
      "items.product.metadata",
    ],
    filters: { id: input.cartId },
  })
  const cart: any = data?.[0]
  if (!cart) {
    const err = new Error("Cart not found") as Error & { status?: number }
    err.status = 404
    throw err
  }
  if (cart.completed_at) {
    const err = new Error("Cart is already completed") as Error & { status?: number }
    err.status = 409
    throw err
  }
  const items = cart.items ?? []
  if (!items.length) {
    const err = new Error("Cart is empty") as Error & { status?: number }
    err.status = 400
    throw err
  }

  // Eligibility + schedule defaults from product metadata.
  let maxParts = 0
  let maxInterval = 0
  let eligible = false
  for (const item of items) {
    const pip = item?.product?.metadata?.pay_in_parts as
      | { enabled?: boolean; parts?: number; interval_days?: number }
      | undefined
    if (pip?.enabled) {
      eligible = true
      maxParts = Math.max(maxParts, Number(pip.parts) || 4)
      maxInterval = Math.max(maxInterval, Number(pip.interval_days) || 7)
    }
  }
  if (!eligible) {
    const err = new Error(
      "Cart contains no Pay Small Small eligible items"
    ) as Error & { status?: number }
    err.status = 400
    throw err
  }

  const parts = Math.max(2, input.parts ?? maxParts ?? 4)
  const intervalDays = Math.max(1, input.intervalDays ?? maxInterval ?? 7)
  const total = toNum(cart.total)
  if (total <= 0) {
    const err = new Error("Cart total must be positive") as Error & { status?: number }
    err.status = 400
    throw err
  }

  // Caps: max active plans + max outstanding layaway value per customer.
  const activePlans = await installments.listInstallmentPlans(
    { customer_id: input.customerId, status: "active" },
    { relations: ["payments"] }
  )
  if (activePlans.length >= MAX_ACTIVE_PLANS) {
    const err = new Error(
      `Too many active Pay Small Small plans (max ${MAX_ACTIVE_PLANS})`
    ) as Error & { status?: number }
    err.status = 429
    throw err
  }
  const outstanding = activePlans.reduce(
    (sum, p) => sum + Math.max(0, toNum(p.total_amount) - toNum(p.amount_paid)),
    0
  )
  if (outstanding + total > MAX_OUTSTANDING_XAF) {
    const err = new Error(
      `Pay Small Small outstanding limit reached (max ${MAX_OUTSTANDING_XAF} XAF)`
    ) as Error & { status?: number }
    err.status = 429
    throw err
  }

  const snapshot: CartItemSnapshot[] = items.map((i: any) => ({
    product_id: i.product_id ?? i.product?.id ?? null,
    title: i.title ?? i.product?.title ?? "Item",
    quantity: Number(i.quantity) || 1,
    unit_price: toNum(i.unit_price),
    total: toNum(i.total ?? i.unit_price),
    image_url: i.thumbnail ?? i.product?.thumbnail ?? null,
  }))

  return installments.createPlan({
    customerId: input.customerId,
    cartId: cart.id,
    currencyCode: (cart.currency_code ?? "xaf").toLowerCase(),
    totalAmount: total,
    partsCount: parts,
    intervalDays,
    items: snapshot,
  })
}

/* ------------------------------------------------------------------ */
/* Installment payments                                                */
/* ------------------------------------------------------------------ */

async function getPlanForCustomer(
  scope: Scope,
  planId: string,
  customerId: string
) {
  const installments = scope.resolve(INSTALLMENTS_MODULE)
  const plan = await installments.retrievePlanWithPayments(planId)
  if (!plan || plan.customer_id !== customerId) {
    const err = new Error("Plan not found") as Error & { status?: number }
    err.status = 404
    throw err
  }
  return { installments, plan }
}

const isOpen = (p: any) => p.status === "pending" || p.status === "failed"

/** Pays the next pending installment (or a specific part) from wallet. */
export async function payInstallmentWithWallet(
  scope: Scope,
  input: { customerId: string; planId: string; partNumber?: number }
) {
  const { installments, plan } = await getPlanForCustomer(
    scope,
    input.planId,
    input.customerId
  )
  if (plan.status !== "active") {
    const err = new Error(`Plan is ${plan.status}`) as Error & { status?: number }
    err.status = 409
    throw err
  }
  const payments = await installments.listPlanPayments(plan.id)
  const payment = input.partNumber
    ? payments.find((p: any) => p.part_number === input.partNumber)
    : payments
        .filter((p: any) => isOpen(p))
        .sort((a: any, b: any) => a.part_number - b.part_number)[0]
  if (!payment) {
    const err = new Error("No pending installment") as Error & { status?: number }
    err.status = 404
    throw err
  }
  if (payment.status === "paid") {
    return { plan, payment, alreadyPaid: true }
  }
  // A pending MoMo charge means the buyer already chose that path -
  // don't let a wallet debit double-collect the same installment.
  if (payment.provider_reference && payment.method === "notchpay") {
    const err = new Error(
      "A MoMo payment is already pending for this installment"
    ) as Error & { status?: number }
    err.status = 409
    throw err
  }

  const wallet = scope.resolve(WALLET_MODULE)
  const amount = toNum(payment.amount)
  const entry = await wallet.debitForPurchase({
    customerId: input.customerId,
    amount,
    currencyCode: plan.currency_code ?? "xaf",
    reference: payment.reference,
    description: `Pay Small Small · part ${payment.part_number} of ${plan.parts_count}`,
  })

  const result = await installments.markInstallmentPaid({
    planId: plan.id,
    partNumber: payment.part_number,
    method: "wallet",
    reference: payment.reference,
    walletEntryId: entry?.id,
  })
  if (result.allPaid) {
    await maybeCompletePlan(scope, plan.id)
  }
  return result
}

/** Creates (or returns) a NotchPay hosted-checkout charge for an installment. */
export async function createNotchPayInstallmentCharge(
  scope: Scope,
  input: { customerId: string; planId: string; partNumber?: number }
) {
  const { installments, plan } = await getPlanForCustomer(
    scope,
    input.planId,
    input.customerId
  )
  if (plan.status !== "active") {
    const err = new Error(`Plan is ${plan.status}`) as Error & { status?: number }
    err.status = 409
    throw err
  }
  const payments = await installments.listPlanPayments(plan.id)
  const payment = input.partNumber
    ? payments.find((p: any) => p.part_number === input.partNumber)
    : payments
        .filter((p: any) => isOpen(p))
        .sort((a: any, b: any) => a.part_number - b.part_number)[0]
  if (!payment || payment.status === "paid") {
    const err = new Error("No pending installment") as Error & { status?: number }
    err.status = 404
    throw err
  }

  // Reuse an existing charge if one was already created.
  const existing = payment.metadata?.notchpay as
    | { authorization_url?: string; reference?: string }
    | undefined
  if (payment.provider_reference && existing?.authorization_url) {
    return { payment, authorization_url: existing.authorization_url, reused: true }
  }

  const client = getNotchPayClient()
  if (!client) {
    const err = new Error("MoMo payments are not configured") as Error & { status?: number }
    err.status = 503
    throw err
  }

  // Customer phone/name for the MoMo prompt.
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name", "phone"],
    filters: { id: input.customerId },
  })
  const customer: any = customers?.[0]

  const amount = toNum(payment.amount)
  const currency = (plan.currency_code ?? "xaf").toUpperCase()
  const txn = await client.createPayment({
    amount,
    currency,
    customer: {
      name:
        [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
        undefined,
      phone: customer?.phone ?? undefined,
    },
    description: `Hybreed Pay Small Small - part ${payment.part_number}/${plan.parts_count}`,
    reference: payment.reference,
    callback:
      process.env.NOTCHPAY_CALLBACK_URL ??
      `${process.env.STOREFRONT_URL ?? "http://localhost:3000"}/cm/user/installments`,
    lockedCountry: process.env.NOTCHPAY_LOCKED_COUNTRY ?? "CM",
    lockedChannel: process.env.NOTCHPAY_LOCKED_CHANNEL,
  })

  const reference = String(
    (txn as any)?.transaction?.reference ??
      (txn as any)?.reference ??
      payment.reference
  )
  const authorizationUrl = (txn as any)?.authorization_url as string | undefined

  await installments.updateInstallmentPayments({
    id: payment.id,
    provider_reference: reference,
    method: "notchpay",
    metadata: {
      ...(payment.metadata ?? {}),
      notchpay: { authorization_url: authorizationUrl, reference },
    },
  })

  return { payment, authorization_url: authorizationUrl, reference, reused: false }
}

/** Verifies a NotchPay installment charge server-side and marks it paid. */
export async function confirmNotchPayInstallment(
  scope: Scope,
  input: { planId: string; reference: string }
) {
  const installments = scope.resolve(INSTALLMENTS_MODULE)
  const payments = await installments.listInstallmentPayments({
    plan_id: input.planId,
  })
  const payment = payments.find(
    (p: any) =>
      p.reference === input.reference ||
      p.provider_reference === input.reference ||
      (p.metadata?.notchpay as any)?.reference === input.reference
  )
  if (!payment) {
    const err = new Error("Installment not found") as Error & { status?: number }
    err.status = 404
    throw err
  }
  if (payment.status === "paid") {
    return { status: "paid", alreadyPaid: true }
  }

  const client = getNotchPayClient()
  if (!client) {
    const err = new Error("MoMo payments are not configured") as Error & { status?: number }
    err.status = 503
    throw err
  }
  const txn = await client.getPayment(
    payment.provider_reference ?? input.reference
  )
  const status = String(txn?.status ?? "")
  if (status !== "complete") {
    return { status, transaction: txn }
  }

  const result = await installments.markInstallmentPaid({
    planId: input.planId,
    partNumber: payment.part_number,
    method: "notchpay",
    reference: payment.reference,
    providerReference: String(txn.reference ?? txn.trxref ?? payment.provider_reference),
    metadata: {
      ...(payment.metadata ?? {}),
      notchpay_status: status,
    },
  })
  if (result.allPaid) {
    await maybeCompletePlan(scope, input.planId)
  }
  return { status: "paid", result }
}

/* ------------------------------------------------------------------ */
/* Plan completion: pay off the cart through the layaway provider      */
/* ------------------------------------------------------------------ */

/**
 * When every installment is paid, completes the stored cart so Medusa
 * creates the order and Mercur creates the order group. The layaway
 * payment provider authorizes/captures without moving money - the funds
 * were already collected installment by installment.
 */
export async function maybeCompletePlan(scope: Scope, planId: string) {
  const installments = scope.resolve(INSTALLMENTS_MODULE)
  const plan = await installments.retrieveInstallmentPlan(planId)
  if (!plan || plan.status !== "active" || !plan.cart_id) return

  const payments = await installments.listPlanPayments(planId)
  const allPaid = payments.every((p) => p.status === "paid")
  if (!allPaid) return

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "total",
      "currency_code",
      "completed_at",
      "payment_collection.id",
    ],
    filters: { id: plan.cart_id },
  })
  const cart: any = data?.[0]
  const fail = async (reason: string) => {
    await installments.updateInstallmentPlans({
      id: planId,
      metadata: { ...(plan.metadata ?? {}), completion_error: reason },
    })
  }
  if (!cart || cart.completed_at) {
    await fail("cart_missing_or_completed")
    return
  }
  if (
    Math.abs(toNum(cart.total) - toNum(plan.total_amount)) > 1 ||
    (cart.currency_code ?? "").toLowerCase() !== plan.currency_code
  ) {
    await fail("total_mismatch")
    return
  }

  try {
    const wfEngine = scope.resolve(Modules.WORKFLOW_ENGINE)

    const pcRaw: any = cart.payment_collection
    let paymentCollectionId = Array.isArray(pcRaw) ? pcRaw[0]?.id : pcRaw?.id
    if (!paymentCollectionId) {
      const { result: pc } = await wfEngine.run(
        createPaymentCollectionForCartWorkflow,
        { input: { cart_id: cart.id } }
      )
      const pcResult: any = pc
      paymentCollectionId =
        pcResult?.id ?? pcResult?.payment_collection?.id ?? null
    }
    if (!paymentCollectionId) {
      await fail("no_payment_collection")
      return
    }

    await wfEngine.run(createPaymentSessionsWorkflow, {
      input: {
        payment_collection_id: paymentCollectionId,
        provider_id: LAYAWAY_PROVIDER_ID,
        customer_id: plan.customer_id,
        data: { layaway_plan_id: planId },
      },
    })

    const { result } = await wfEngine.run(completeCartWorkflow, {
      input: { id: cart.id },
    })
    const orderId = (result as any)?.id

    // Resolve the Mercur order group created for this cart.
    let orderGroupId: string | null = null
    try {
      const { data: groups } = await query.graph({
        entity: "order_group",
        fields: ["id", "display_id"],
        filters: { cart_id: cart.id },
      })
      orderGroupId = groups?.[0]?.id ?? null
    } catch {
      // Order group link may not be queryable this way - non-fatal.
    }

    await installments.updateInstallmentPlans({
      id: planId,
      status: "completed",
      order_id: orderId ?? null,
      order_group_id: orderGroupId,
      completed_at: new Date(),
      metadata: { ...(plan.metadata ?? {}), completion_error: null },
    })

    await sendPush(
      scope,
      {
        title: "Pay Small Small complete",
        body: "All installments paid - your order has been placed!",
        url: "/user/orders",
      },
      { customerId: plan.customer_id }
    )
  } catch (e) {
    const logger = scope.resolve("logger")
    logger.error(`Layaway completion failed for plan ${planId}: ${e}`)
    await fail(`completion_threw: ${(e as Error)?.message ?? "unknown"}`)
  }
}

/* ------------------------------------------------------------------ */
/* Cancellation / expiry                                               */
/* ------------------------------------------------------------------ */

/**
 * Cancels or expires a plan and applies the fee split:
 * seller compensation + platform fee are recorded in `settlement`,
 * the buyer refund is credited back to their Hybreed Wallet.
 */
export async function cancelPlan(
  scope: Scope,
  input: {
    planId: string
    reason: string
    initiatedBy: "customer" | "admin" | "system"
  }
) {
  const installments = scope.resolve(INSTALLMENTS_MODULE)
  const plan = await installments.retrieveInstallmentPlan(input.planId)
  if (!plan) {
    const err = new Error("Plan not found") as Error & { status?: number }
    err.status = 404
    throw err
  }
  if (plan.status !== "active") {
    return { plan, alreadyClosed: true }
  }

  const payments = await installments.listPlanPayments(plan.id)
  const split = computeCancellationSplit(payments)

  // Void unpaid installments.
  for (const p of payments) {
    if (p.status === "pending" || p.status === "failed") {
      await installments.updateInstallmentPayments({
        id: p.id,
        status: "void",
      })
    }
  }

  // Refund the buyer's share to their wallet (closed-loop, instant).
  if (split.refund_amount > 0) {
    const wallet = scope.resolve(WALLET_MODULE)
    await wallet.credit({
      customerId: plan.customer_id,
      amount: split.refund_amount,
      currencyCode: plan.currency_code ?? "xaf",
      type: "refund",
      reference: `lay_refund_${plan.id}`,
      description: `Pay Small Small ${input.initiatedBy === "system" ? "expiry" : "cancel"} refund`,
    })
  }

  const status = input.initiatedBy === "system" ? "expired" : "cancelled"
  const updated = await installments.updateInstallmentPlans({
    id: plan.id,
    status,
    cancelled_at: new Date(),
    cancel_reason: input.reason,
    next_due_at: null,
    settlement: { ...split, initiated_by: input.initiatedBy },
  })

  await sendPush(
    scope,
    {
      title:
        status === "expired"
          ? "Pay Small Small expired"
          : "Pay Small Small cancelled",
      body: `Refund of ${split.refund_amount.toLocaleString("en-FR")} XAF credited to your Hybreed Wallet.`,
      url: "/user/wallet",
    },
    { customerId: plan.customer_id }
  )

  return { plan: Array.isArray(updated) ? updated[0] : updated, split }
}

/* ------------------------------------------------------------------ */
/* Lifecycle job                                                       */
/* ------------------------------------------------------------------ */

/**
 * Processes all active plans: sends due reminders, auto-attempts wallet
 * debit on the due date, reconciles pending NotchPay charges, retries
 * stuck completions, and expires plans past the grace period.
 */
export async function processInstallmentLifecycle(scope: Scope) {
  const installments = scope.resolve(INSTALLMENTS_MODULE)
  const plans = await installments.listActivePlans()
  const now = Date.now()
  const dayMs = 24 * 3600 * 1000

  for (const plan of plans) {
    try {
      // Paused plans are skipped entirely.
      if (plan.paused_until && new Date(plan.paused_until).getTime() > now) {
        continue
      }

      const payments = await installments.listPlanPayments(plan.id)
      const pending = payments.filter(isOpen)

      // Fully paid but completion previously failed - retry.
      if (!pending.length && payments.length) {
        await maybeCompletePlan(scope, plan.id)
        continue
      }

      for (const payment of pending) {
        const dueAt = new Date(payment.due_at).getTime()

        // --- reminders -------------------------------------------------
        const lastReminder = payment.last_reminder_at
          ? new Date(payment.last_reminder_at).getTime()
          : 0
        if (dueAt > now) {
          // Future due date: T-3d / T-1d / due-day reminders.
          for (const days of REMINDER_DAYS_BEFORE) {
            const threshold = dueAt - days * dayMs
            if (now >= threshold && lastReminder < threshold) {
              await sendPush(
                scope,
                {
                  title: `Installment ${payment.part_number} of ${plan.parts_count} due`,
                  body: `${toNum(payment.amount).toLocaleString("en-FR")} XAF due ${days === 0 ? "today" : `in ${days} day${days > 1 ? "s" : ""}`} - pay from Wallet or MoMo.`,
                  url: "/user/installments",
                },
                { customerId: plan.customer_id }
              )
              await installments.updateInstallmentPayments({
                id: payment.id,
                last_reminder_at: new Date(),
              })
            }
          }
        } else if (lastReminder < now - dayMs) {
          // Overdue and unpaid: nudge at most once per day until expiry.
          await sendPush(
            scope,
            {
              title: `Installment ${payment.part_number} overdue`,
              body: `${toNum(payment.amount).toLocaleString("en-FR")} XAF is overdue - pay from Wallet or MoMo to keep your items reserved.`,
              url: "/user/installments",
            },
            { customerId: plan.customer_id }
          )
          await installments.updateInstallmentPayments({
            id: payment.id,
            last_reminder_at: new Date(),
          })
        }

        // --- expiry ----------------------------------------------------
        if (dueAt + GRACE_DAYS * dayMs < now) {
          await cancelPlan(scope, {
            planId: plan.id,
            reason: `installment_${payment.part_number}_overdue`,
            initiatedBy: "system",
          })
          break
        }

        // --- auto wallet debit on due date ------------------------------
        // Skip if a NotchPay charge is already pending for this payment -
        // the buyer chose MoMo, don't double-collect.
        const hasPendingNotchpay =
          payment.provider_reference && payment.method === "notchpay"
        // Part 1 always requires an explicit payment action at checkout;
        // auto wallet debit only applies to scheduled later installments.
        if (dueAt <= now && payment.part_number > 1 && !hasPendingNotchpay) {
          try {
            await payInstallmentWithWallet(scope, {
              customerId: plan.customer_id,
              planId: plan.id,
              partNumber: payment.part_number,
            })
          } catch (e) {
            const status = (e as { status?: number })?.status
            if (status === 402) {
              await installments.recordPaymentAttempt({
                paymentId: payment.id,
                error: "insufficient_wallet_balance",
              })
              await sendPush(
                scope,
                {
                  title: "Installment payment failed",
                  body: `Not enough wallet balance for part ${payment.part_number}. Top up or pay via MoMo.`,
                  url: "/user/installments",
                },
                { customerId: plan.customer_id }
              )
            } else {
              await installments.recordPaymentAttempt({
                paymentId: payment.id,
                error: (e as Error)?.message ?? "unknown",
              })
            }
          }
        }

        // --- reconcile pending NotchPay charges -------------------------
        if (payment.provider_reference && isOpen(payment)) {
          const client = getNotchPayClient()
          if (client) {
            try {
              const txn = await client.getPayment(payment.provider_reference)
              if (String(txn?.status) === "complete") {
                await installments.markInstallmentPaid({
                  planId: plan.id,
                  partNumber: payment.part_number,
                  method: "notchpay",
                  reference: payment.reference,
                  providerReference: String(
                    txn.reference ?? txn.trxref ?? payment.provider_reference
                  ),
                })
              }
            } catch {
              // Reconciliation is best-effort; the next run retries.
            }
          }
        }
      }
    } catch (e) {
      const logger = scope.resolve("logger")
      logger.error(`Installment lifecycle failed for plan ${plan.id}: ${e}`)
    }
  }
}
