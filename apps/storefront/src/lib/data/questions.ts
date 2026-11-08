'use server'

import { getAuthHeaders } from './cookies'

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

export interface ProductQuestion {
  id: string
  product_id: string
  author_name: string
  body: string
  answer: string | null
  status: 'pending' | 'answered'
  answered_at: string | null
  created_at: string
}

const headers = async () => ({
  'Content-Type': 'application/json',
  'x-publishable-api-key': PUBLISHABLE_KEY,
  ...(await getAuthHeaders()),
})

export const getProductQuestions = async (
  productId: string
): Promise<ProductQuestion[]> => {
  const res = await fetch(
    `${BACKEND_URL}/store/product-questions?product_id=${encodeURIComponent(productId)}&status=answered`,
    { headers: await headers(), cache: 'no-store' }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.questions ?? []
}

export const askProductQuestion = async (input: {
  productId: string
  body: string
  authorName?: string
}): Promise<{ ok: boolean; message?: string }> => {
  const res = await fetch(`${BACKEND_URL}/store/product-questions`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({
      product_id: input.productId,
      body: input.body,
      author_name: input.authorName,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) return { ok: false, message: 'auth' }
  if (!res.ok) {
    return { ok: false, message: data.message || 'Could not send the question' }
  }
  return { ok: true }
}
