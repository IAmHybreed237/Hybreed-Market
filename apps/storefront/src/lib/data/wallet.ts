'use server'

import { getAuthHeaders } from './cookies'

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

export interface WalletEntry {
  id: string
  amount: unknown
  currency_code: string
  type: string
  status: string
  reference: string | null
  order_id: string | null
  description: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface TopUpRequest {
  id: string
  amount: unknown
  currency_code: string
  sender_phone: string
  momo_reference: string | null
  receipt_note: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  review_note: string | null
  created_at: string
}

export interface FundingSource {
  phone: string
  verified: boolean
  uses: number
  last_used_at: string
}

export interface WalletStatement {
  balance: number
  points: number
  entries: WalletEntry[]
  topups: TopUpRequest[]
  funding_sources: FundingSource[]
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

export const getWalletStatement = async (): Promise<WalletStatement | null> => {
  const res = await fetch(`${BACKEND_URL}/store/wallet`, {
    headers: await headers(),
    cache: 'no-store',
  })
  if (res.status === 401 || res.status === 403) return null
  if (!res.ok) return null
  const data = await res.json()
  const sources = data.account?.metadata?.funding_sources
  return {
    balance: num(data.balance),
    points: num(data.points),
    entries: data.entries ?? [],
    topups: data.topups ?? [],
    funding_sources: Array.isArray(sources) ? sources : [],
  }
}

export const requestWalletTopUp = async (input: {
  amount: number
  sender_phone: string
  momo_reference?: string
  receipt_note?: string
  receipt_url?: string
}): Promise<{ ok: boolean; message?: string }> => {
  const res = await fetch(`${BACKEND_URL}/store/wallet/topups`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ ...input, currency_code: 'xaf' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, message: data.message || 'Top-up request failed' }
  }
  return { ok: true }
}

export const uploadTopUpReceipt = async (
  file: File
): Promise<{ ok: boolean; url?: string; message?: string }> => {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })

  const res = await fetch(`${BACKEND_URL}/store/wallet/topups/receipt`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({
      filename: file.name || 'receipt.jpg',
      content_type: file.type || 'image/jpeg',
      data: dataUrl,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, message: data.message || 'Receipt upload failed' }
  }
  return { ok: true, url: data.url }
}

export interface WalletLookupResult {
  found: boolean
  customer_id?: string
  seller_id?: string
  name?: string
}

export const lookupWalletUser = async (
  query: { customer_id?: string; seller_id?: string; phone?: string }
): Promise<WalletLookupResult | null> => {
  const params = new URLSearchParams()
  if (query.customer_id) params.set('customer_id', query.customer_id)
  if (query.seller_id) params.set('seller_id', query.seller_id)
  if (query.phone) params.set('phone', query.phone)
  const res = await fetch(`${BACKEND_URL}/store/wallet/lookup?${params}`, {
    headers: await headers(),
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export const transferWallet = async (input: {
  to_customer_id?: string
  to_seller_id?: string
  to_phone?: string
  amount: number
  note?: string
}): Promise<{ ok: boolean; message?: string }> => {
  const res = await fetch(`${BACKEND_URL}/store/wallet/transfer`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({
      ...input,
      reference: crypto.randomUUID(),
      currency_code: 'xaf',
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, message: data.message || 'Transfer failed' }
  }
  return { ok: true }
}
