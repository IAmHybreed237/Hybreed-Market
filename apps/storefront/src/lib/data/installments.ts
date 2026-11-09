'use server'

import { getAuthHeaders } from './cookies'

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

export interface InstallmentPayment {
  id: string
  part_number: number
  amount: unknown
  due_at: string
  status: 'pending' | 'paid' | 'failed' | 'void'
  method: 'wallet' | 'notchpay' | 'manual' | null
  provider_reference: string | null
  paid_at: string | null
  attempts: number
  metadata?: Record<string, unknown> | null
}

export interface InstallmentItem {
  product_id: string | null
  title: string
  quantity: number
  unit_price: number
  total: number
  image_url?: string | null
}

export interface InstallmentPlan {
  id: string
  status: 'active' | 'completed' | 'cancelled' | 'expired'
  cart_id: string | null
  order_id: string | null
  order_group_id: string | null
  currency_code: string
  total_amount: unknown
  amount_paid: unknown
  parts_count: number
  interval_days: number
  items: InstallmentItem[] | Record<string, unknown>
  next_due_at: string | null
  started_at: string
  completed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  paused_until: string | null
  settlement?: {
    paid_total: number
    parts_paid: number
    seller_compensation: number
    platform_fee: number
    refund_amount: number
    methods?: Record<string, number>
    initiated_by?: string
  } | null
  payments?: InstallmentPayment[]
}

const headers = async () => ({
  'Content-Type': 'application/json',
  'x-publishable-api-key': PUBLISHABLE_KEY,
  ...(await getAuthHeaders()),
})

const num = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === 'number') return v
  const n = (v as { numeric?: unknown }).numeric
  return n == null ? Number(v) : Number(n)
}

export const listInstallmentPlans = async (): Promise<InstallmentPlan[]> => {
  const res = await fetch(`${BACKEND_URL}/store/installments`, {
    headers: await headers(),
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  return data.plans ?? []
}

export const getInstallmentPlan = async (
  id: string
): Promise<{ plan: InstallmentPlan; payments: InstallmentPayment[] } | null> => {
  const res = await fetch(`${BACKEND_URL}/store/installments/${id}`, {
    headers: await headers(),
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export const createInstallmentPlan = async (input: {
  cart_id: string
  parts?: number
  interval_days?: number
}): Promise<{ ok: boolean; plan?: InstallmentPlan; payments?: InstallmentPayment[]; message?: string }> => {
  const res = await fetch(`${BACKEND_URL}/store/installments`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, message: data.message || 'Could not start Pay Small Small' }
  }
  return { ok: true, plan: data.plan, payments: data.payments }
}

export const payInstallmentWithWallet = async (
  planId: string,
  partNumber?: number
): Promise<{ ok: boolean; message?: string }> => {
  const res = await fetch(`${BACKEND_URL}/store/installments/${planId}/pay`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(partNumber ? { part_number: partNumber } : {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, message: data.message || 'Wallet payment failed' }
  }
  return { ok: true }
}

export const createInstallmentMomoCharge = async (
  planId: string,
  partNumber?: number
): Promise<{ ok: boolean; authorization_url?: string; message?: string }> => {
  const res = await fetch(
    `${BACKEND_URL}/store/installments/${planId}/pay/notchpay`,
    {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify(partNumber ? { part_number: partNumber } : {}),
    }
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.authorization_url) {
    return { ok: false, message: data.message || 'Could not start MoMo payment' }
  }
  return { ok: true, authorization_url: data.authorization_url }
}

export const confirmInstallmentMomo = async (
  planId: string,
  reference: string
): Promise<{ ok: boolean; status?: string }> => {
  const res = await fetch(
    `${BACKEND_URL}/store/installments/${planId}/pay/notchpay/confirm`,
    {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify({ reference }),
    }
  )
  if (!res.ok) return { ok: false }
  const data = await res.json().catch(() => ({}))
  return { ok: data.status === 'paid' || data.alreadyPaid === true, status: data.status }
}

export const cancelInstallmentPlan = async (
  planId: string,
  reason?: string
): Promise<{ ok: boolean; refund?: number; message?: string }> => {
  const res = await fetch(`${BACKEND_URL}/store/installments/${planId}/cancel`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ reason: reason ?? 'customer_cancelled' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, message: data.message || 'Cancel failed' }
  }
  return { ok: true, refund: num(data?.split?.refund_amount) }
}

export const pauseInstallmentPlan = async (
  planId: string
): Promise<{ ok: boolean; message?: string }> => {
  const res = await fetch(`${BACKEND_URL}/store/installments/${planId}/pause`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, message: data.message || 'Pause failed' }
  }
  return { ok: true }
}

/** Total still owed across all active plans - for the wallet page tile. */
export const getOutstandingInstallments = async (): Promise<number> => {
  const plans = await listInstallmentPlans()
  return plans
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + Math.max(0, num(p.total_amount) - num(p.amount_paid)), 0)
}
