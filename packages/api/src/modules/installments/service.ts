import { MedusaService } from "@medusajs/framework/utils"
import InstallmentPlan from "./models/plan"
import InstallmentPayment from "./models/payment"

export const INSTALLMENTS_MODULE = "installments"

const toNum = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === "number") return v
  const n = (v as { numeric?: unknown }).numeric
  return n == null ? Number(v) : Number(n)
}

class InstallmentModuleService extends MedusaService({
  InstallmentPlan,
  InstallmentPayment,
}) {
  async createPlan(input: {
    customerId: string
    cartId?: string | null
    currencyCode: string
    totalAmount: number
    partsCount: number
    intervalDays: number
    items: Record<string, unknown>[]
    firstDueAt?: Date
    metadata?: Record<string, unknown>
  }) {
    const parts = Math.max(2, Math.floor(input.partsCount) || 4)
    const intervalDays = Math.max(1, Math.floor(input.intervalDays) || 7)
    const total = Math.round(input.totalAmount)
    // Split evenly; the last installment absorbs rounding remainder.
    const base = Math.floor(total / parts)
    const remainder = total - base * parts

    const plan = await this.createInstallmentPlans({
      customer_id: input.customerId,
      status: "active",
      cart_id: input.cartId ?? null,
      currency_code: input.currencyCode,
      total_amount: total,
      amount_paid: 0,
      parts_count: parts,
      interval_days: intervalDays,
      items: input.items as unknown as Record<string, unknown>,
      next_due_at: input.firstDueAt ?? new Date(),
      started_at: new Date(),
      paused_until: null,
      pause_count: 0,
      metadata: input.metadata ?? null,
    })
    const created = Array.isArray(plan) ? plan[0] : plan

    const start = input.firstDueAt ?? new Date()
    const payments: unknown[] = []
    for (let i = 0; i < parts; i++) {
      const due = new Date(start)
      due.setDate(due.getDate() + i * intervalDays)
      const amount = i === parts - 1 ? base + remainder : base
      const p = await this.createInstallmentPayments({
        plan_id: created.id,
        part_number: i + 1,
        amount,
        due_at: due,
        status: "pending",
        reference: `lay_${created.id}_p${i + 1}`,
        attempts: 0,
      })
      payments.push(Array.isArray(p) ? p[0] : p)
    }

    return { plan: created, payments }
  }

  async listPlansForCustomer(customerId: string) {
    return this.listInstallmentPlans(
      { customer_id: customerId },
      {
        relations: ["payments"],
        order: { created_at: "DESC" },
        take: 50,
      }
    )
  }

  async retrievePlanWithPayments(id: string) {
    return this.retrieveInstallmentPlan(id, { relations: ["payments"] })
  }

  /** Payments of a plan ordered by part number. */
  async listPlanPayments(planId: string) {
    return this.listInstallmentPayments(
      { plan_id: planId },
      { order: { part_number: "ASC" } }
    )
  }

  /**
   * Marks an installment paid. Idempotent on `reference`: if a payment with
   * the same reference already exists and is paid, returns it unchanged.
   * Updates the plan's amount_paid and next_due_at.
   */
  async markInstallmentPaid(input: {
    planId: string
    partNumber: number
    method: "wallet" | "notchpay" | "manual"
    reference: string
    providerReference?: string
    walletEntryId?: string
    metadata?: Record<string, unknown>
  }) {
    const plan = await this.retrieveInstallmentPlan(input.planId)
    const payments = await this.listPlanPayments(input.planId)
    const payment = payments.find((p) => p.part_number === input.partNumber)
    if (!payment) {
      const err = new Error("Installment not found") as Error & { status?: number }
      err.status = 404
      throw err
    }
    if (payment.status === "paid") return { plan, payment, alreadyPaid: true }
    if (payment.status === "void") {
      const err = new Error("Installment is void") as Error & { status?: number }
      err.status = 409
      throw err
    }

    const amount = toNum(payment.amount)
    const paidSoFar = toNum(plan.amount_paid)
    const allPaid = payments.every(
      (p) =>
        p.part_number === input.partNumber || p.status === "paid"
    )

    const updated = await this.updateInstallmentPayments({
      id: payment.id,
      status: "paid",
      method: input.method,
      provider_reference: input.providerReference ?? payment.provider_reference,
      wallet_entry_id: input.walletEntryId ?? payment.wallet_entry_id,
      paid_at: new Date(),
      metadata: input.metadata ?? payment.metadata,
    })

    const nextPending = payments.find(
      (p) =>
        p.part_number !== input.partNumber &&
        (p.status === "pending" || p.status === "failed")
    )
    const updatedPlan = await this.updateInstallmentPlans({
      id: plan.id,
      amount_paid: paidSoFar + amount,
      next_due_at: allPaid ? null : (nextPending?.due_at ?? null),
    })

    return {
      plan: Array.isArray(updatedPlan) ? updatedPlan[0] : updatedPlan,
      payment: Array.isArray(updated) ? updated[0] : updated,
      allPaid,
      alreadyPaid: false,
    }
  }

  /** Records a failed payment attempt (insufficient balance, declined...). */
  async recordPaymentAttempt(input: {
    paymentId: string
    error?: string
  }) {
    const payment = await this.retrieveInstallmentPayment(input.paymentId)
    return this.updateInstallmentPayments({
      id: payment.id,
      status: payment.status === "paid" ? "paid" : "failed",
      attempts: (payment.attempts ?? 0) + 1,
      last_attempt_at: new Date(),
      metadata: {
        ...(payment.metadata ?? {}),
        last_error: input.error ?? null,
      },
    })
  }

  /** Active plans whose lifecycle the job should process. */
  async listActivePlans() {
    return this.listInstallmentPlans(
      { status: "active" },
      { relations: ["payments"], take: 500 }
    )
  }

  /**
   * Emergency pause: pushes every pending payment's due date out by
   * `days` and sets paused_until. Enforces one pause per rolling year.
   */
  async pausePlan(planId: string, days = 14) {
    const plan = await this.retrieveInstallmentPlan(planId)
    if (plan.status !== "active") {
      const err = new Error(`Plan is ${plan.status}`) as Error & { status?: number }
      err.status = 409
      throw err
    }
    const now = Date.now()
    const lastPause = plan.last_paused_at
      ? new Date(plan.last_paused_at).getTime()
      : 0
    if (now - lastPause < 365 * 24 * 3600 * 1000) {
      const err = new Error(
        "Emergency pause already used in the last 12 months"
      ) as Error & { status?: number }
      err.status = 429
      throw err
    }

    const payments = await this.listPlanPayments(planId)
    const shiftMs = days * 24 * 3600 * 1000
    for (const p of payments) {
      if (p.status !== "pending" && p.status !== "failed") continue
      await this.updateInstallmentPayments({
        id: p.id,
        due_at: new Date(new Date(p.due_at).getTime() + shiftMs),
      })
    }
    const nextPending = payments
      .filter((p) => p.status === "pending" || p.status === "failed")
      .sort((a, b) => a.part_number - b.part_number)[0]
    const shiftedNextDue = nextPending
      ? new Date(new Date(nextPending.due_at).getTime() + shiftMs)
      : null

    return this.updateInstallmentPlans({
      id: planId,
      paused_until: new Date(now + shiftMs),
      pause_count: (plan.pause_count ?? 0) + 1,
      last_paused_at: new Date(),
      next_due_at: shiftedNextDue ?? plan.next_due_at,
    })
  }

  /** Records the cancellation fee split on the plan. */
  async recordSettlement(
    planId: string,
    settlement: Record<string, unknown>
  ) {
    return this.updateInstallmentPlans({
      id: planId,
      settlement,
    })
  }
}

export default InstallmentModuleService
