"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import {
  cancelInstallmentPlan,
  confirmInstallmentMomo,
  createInstallmentMomoCharge,
  InstallmentPlan,
  InstallmentPayment,
  pauseInstallmentPlan,
  payInstallmentWithWallet,
} from "@/lib/data/installments"
import { getWalletStatement } from "@/lib/data/wallet"

const WB_FONT =
  '"Google Sans", "WB Currency", "Segoe UI", -apple-system, Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'

const fmt = (n: number) =>
  `${Math.round(n).toLocaleString("en-US").replace(/,/g, " ")} XAF`

const num = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === "number") return v
  const n = (v as { numeric?: unknown }).numeric
  return n == null ? Number(v) : Number(n)
}

const Chevron = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8A8A96]" aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
)

const statusLabel = (p: InstallmentPlan) => {
  switch (p.status) {
    case "active": return "Active"
    case "completed": return "Completed"
    case "cancelled": return "Cancelled"
    case "expired": return "Expired"
  }
}

const statusColor = (p: InstallmentPlan) =>
  p.status === "active" ? "#2563EB" : p.status === "completed" ? "#16A34A" : "#8A8A96"

const payStatusLabel = (p: InstallmentPayment) => {
  if (p.status === "paid") return "Paid"
  if (p.status === "void") return "Cancelled"
  if (p.status === "failed") return "Payment failed"
  const due = new Date(p.due_at)
  const now = new Date()
  const overdue = due.getTime() < now.getTime()
  return overdue ? "Overdue" : "Pending"
}

const planItems = (p: InstallmentPlan) =>
  Array.isArray(p.items) ? (p.items as any[]) : []

export default function InstallmentsClient({
  plans: initialPlans,
  userName,
}: {
  plans: InstallmentPlan[]
  userName: string
}) {
  const router = useRouter()
  const [plans, setPlans] = useState<InstallmentPlan[]>(initialPlans)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)

  const showToast = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(null), 3500)
  }

  // Load wallet balance once for pay-button labels.
  useEffect(() => {
    getWalletStatement()
      .then((s) => setWalletBalance(s?.balance ?? null))
      .catch(() => setWalletBalance(null))
  }, [])

  // On return from MoMo hosted checkout, confirm any pending NotchPay
  // installment charges server-side, then refresh.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const pending: { planId: string; reference: string }[] = []
      for (const plan of plans) {
        if (plan.status !== "active") continue
        for (const p of plan.payments ?? []) {
          if (
            p.status === "pending" &&
            p.method === "notchpay" &&
            p.provider_reference
          ) {
            pending.push({ planId: plan.id, reference: p.provider_reference })
          }
        }
      }
      if (!pending.length) return
      setConfirming(true)
      for (const item of pending) {
        if (cancelled) return
        try {
          await confirmInstallmentMomo(item.planId, item.reference)
        } catch {
          // best-effort; the lifecycle job reconciles later
        }
      }
      if (!cancelled) {
        router.refresh()
        setConfirming(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = () => router.refresh()

  const payWithWallet = async (plan: InstallmentPlan, part?: number) => {
    const key = `${plan.id}:${part ?? "next"}`
    setBusy(key)
    const res = await payInstallmentWithWallet(plan.id, part)
    setBusy(null)
    if (!res.ok) {
      showToast(res.message || "Wallet payment failed")
      return
    }
    showToast("Installment paid")
    refresh()
  }

  const payWithMomo = async (plan: InstallmentPlan, part?: number) => {
    const key = `${plan.id}:momo:${part ?? "next"}`
    setBusy(key)
    const res = await createInstallmentMomoCharge(plan.id, part)
    setBusy(null)
    if (!res.ok || !res.authorization_url) {
      showToast(res.message || "Could not start MoMo payment")
      return
    }
    window.location.href = res.authorization_url
  }

  const cancelPlan = async (plan: InstallmentPlan) => {
    const key = `${plan.id}:cancel`
    setBusy(key)
    const res = await cancelInstallmentPlan(plan.id)
    setBusy(null)
    if (!res.ok) {
      showToast(res.message || "Cancel failed")
      return
    }
    showToast(
      res.refund
        ? `Cancelled - ${fmt(res.refund)} refunded to your wallet`
        : "Plan cancelled"
    )
    refresh()
  }

  const pausePlan = async (plan: InstallmentPlan) => {
    const key = `${plan.id}:pause`
    setBusy(key)
    const res = await pauseInstallmentPlan(plan.id)
    setBusy(null)
    if (!res.ok) {
      showToast(res.message || "Pause failed")
      return
    }
    showToast("Plan paused for 14 days")
    refresh()
  }

  const active = plans.filter((p) => p.status === "active")
  const past = plans.filter((p) => p.status !== "active")

  return (
    <div className="pt-2">
      {/* header */}
      <div className="flex items-center justify-between px-2 pt-2 pb-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1F1F23]" style={{ fontFamily: WB_FONT }}>
            Pay Small Small
          </h1>
          <p className="text-[13px] text-[#8A8A96] mt-0.5">
            {userName} - pay in parts, items reserved until fully paid
          </p>
        </div>
        <LocalizedClientLink
          href="/user"
          aria-label="Back to profile"
          className="w-10 h-10 flex items-center justify-center text-[#2563EB]"
        >
          <Chevron size={22} />
        </LocalizedClientLink>
      </div>

      {toast && (
        <div className="mx-2 mb-2 rounded-2xl bg-[#1F1F23] text-white text-sm px-3.5 py-2.5">
          {toast}
        </div>
      )}
      {confirming && (
        <div className="mx-2 mb-2 rounded-2xl bg-[#EFF6FF] text-[#2563EB] text-sm px-3.5 py-2.5">
          Confirming your MoMo payment...
        </div>
      )}

      {plans.length === 0 && (
        <div className="mx-2 mt-6 rounded-[20px] bg-white p-8 text-center">
          <p className="text-[16px] font-medium text-[#1F1F23]">No installment plans yet</p>
          <p className="text-[13px] text-[#8A8A96] mt-1">
            Items marked Pay Small Small can be split into parts at checkout.
          </p>
          <LocalizedClientLink
            href="/catalog"
            className="inline-block mt-4 h-11 px-6 rounded-2xl bg-[#2563EB] text-white text-[15px] font-medium flex items-center justify-center"
          >
            Browse catalog
          </LocalizedClientLink>
        </div>
      )}

      {/* active plans */}
      <div className="space-y-3">
        {active.map((plan) => {
          const total = num(plan.total_amount)
          const paid = num(plan.amount_paid)
          const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
          const payments = (plan.payments ?? []).slice().sort((a, b) => a.part_number - b.part_number)
          const next = payments.find((p) => p.status === "pending" || p.status === "failed")
          const items = planItems(plan)
          const paused = plan.paused_until && new Date(plan.paused_until).getTime() > Date.now()

          return (
            <div key={plan.id} className="mx-2 rounded-[20px] bg-white p-4">
              {/* top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold text-[#1F1F23] truncate">
                    {items[0]?.title ?? "Pay Small Small plan"}
                    {items.length > 1 ? ` +${items.length - 1} more` : ""}
                  </p>
                  <p className="text-[12px] text-[#8A8A96] mt-0.5">
                    {plan.parts_count} parts · every {plan.interval_days} days
                    {paused ? " · paused" : ""}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ color: statusColor(plan), background: `${statusColor(plan)}18` }}
                >
                  {statusLabel(plan)}
                </span>
              </div>

              {/* progress */}
              <div className="mt-3">
                <div className="h-2 rounded-full bg-[#F0F0F3] overflow-hidden">
                  <div className="h-full rounded-full bg-[#2563EB] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[12px]">
                  <span className="text-[#8A8A96]">{pct}% paid</span>
                  <span className="text-[#1F1F23] font-medium">
                    {fmt(paid)} / {fmt(total)}
                  </span>
                </div>
              </div>

              {/* next payment */}
              {next && (
                <div className="mt-3 rounded-2xl bg-[#F8F9FC] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-[#1F1F23]">
                        Part {next.part_number} of {plan.parts_count}
                      </p>
                      <p className="text-[12px] text-[#8A8A96]">
                        {fmt(num(next.amount))} · due{" "}
                        {new Date(next.due_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                        {new Date(next.due_at).getTime() < Date.now() ? " (overdue)" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={!!busy || walletBalance == null || walletBalance < num(next.amount)}
                        onClick={() => payWithWallet(plan, next.part_number)}
                        className="h-9 px-3 rounded-xl bg-[#2563EB] text-white text-[12px] font-medium disabled:opacity-40"
                      >
                        {busy === `${plan.id}:${next.part_number}` ? "…" : "Wallet"}
                      </button>
                      <button
                        disabled={!!busy}
                        onClick={() => payWithMomo(plan, next.part_number)}
                        className="h-9 px-3 rounded-xl bg-[#F0F0F3] text-[#1F1F23] text-[12px] font-medium disabled:opacity-40"
                      >
                        {busy === `${plan.id}:momo:${next.part_number}` ? "…" : "MoMo"}
                      </button>
                    </div>
                  </div>
                  {walletBalance != null && walletBalance < num(next.amount) && (
                    <p className="text-[11px] text-[#B45309] mt-1.5">
                      Wallet balance too low - top up or pay via MoMo.
                    </p>
                  )}
                </div>
              )}

              {/* schedule */}
              <div className="mt-3 space-y-1">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-[12px]">
                    <span className={p.status === "paid" ? "text-[#16A34A]" : "text-[#1F1F23]"}>
                      Part {p.part_number} · {fmt(num(p.amount))}
                    </span>
                    <span className={p.status === "paid" ? "text-[#16A34A]" : "text-[#8A8A96]"}>
                      {payStatusLabel(p)}
                      {p.method ? ` · ${p.method === "notchpay" ? "MoMo" : p.method}` : ""}
                    </span>
                  </div>
                ))}
              </div>

              {/* actions */}
              <div className="mt-3 flex gap-2">
                {plan.order_group_id && (
                  <LocalizedClientLink
                    href={`/user/orders/${plan.order_group_id}`}
                    className="h-9 px-3 rounded-xl bg-[#EFF6FF] text-[#2563EB] text-[12px] font-medium flex items-center"
                  >
                    View order
                  </LocalizedClientLink>
                )}
                {!paused && (
                  <button
                    disabled={!!busy}
                    onClick={() => pausePlan(plan)}
                    className="h-9 px-3 rounded-xl bg-[#F0F0F3] text-[#1F1F23] text-[12px] font-medium disabled:opacity-40"
                  >
                    Pause 14 days
                  </button>
                )}
                <button
                  disabled={!!busy}
                  onClick={() => {
                    if (window.confirm("Cancel this plan? Paid installments are refunded minus the cancellation fee.")) {
                      cancelPlan(plan)
                    }
                  }}
                  className="h-9 px-3 rounded-xl bg-[#FEE2E2] text-[#B91C1C] text-[12px] font-medium disabled:opacity-40 ml-auto"
                >
                  Cancel plan
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* past plans */}
      {past.length > 0 && (
        <div className="mt-6">
          <p className="px-2 text-[13px] font-semibold text-[#8A8A96] mb-2">Past plans</p>
          <div className="space-y-2">
            {past.map((plan) => {
              const items = planItems(plan)
              const settlement = plan.settlement
              return (
                <div key={plan.id} className="mx-2 rounded-[16px] bg-white/70 p-3.5 opacity-80">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[#1F1F23] truncate">
                      {items[0]?.title ?? "Plan"}
                    </p>
                    <span className="text-[11px] font-semibold" style={{ color: statusColor(plan) }}>
                      {statusLabel(plan)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A8A96] mt-1">
                    {fmt(num(plan.total_amount))} · {plan.parts_count} parts
                    {settlement?.refund_amount
                      ? ` · refunded ${fmt(settlement.refund_amount)}`
                      : ""}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
