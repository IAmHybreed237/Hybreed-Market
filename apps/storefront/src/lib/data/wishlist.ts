'use server'

import { getAuthHeaders } from './cookies'
import { getRegion } from './regions'

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

const auth = async () => {
  const headers = await getAuthHeaders()
  if (!('authorization' in headers)) return null
  return headers
}

const regionQuery = async () => {
  const region = await getRegion(process.env.NEXT_PUBLIC_DEFAULT_REGION || 'cm').catch(() => null)
  return region?.id ? `region_id=${region.id}` : ''
}

/** Full wishlist product list (with calculated prices) for the signed-in customer. */
export const getWishlistProducts = async (): Promise<any[]> => {
  const headers = await auth()
  if (!headers) return []
  const rq = await regionQuery()
  const res = await fetch(`${BACKEND_URL}/store/wishlist?limit=100${rq ? `&${rq}` : ''}`, {
    headers: {
      'x-publishable-api-key': PUBLISHABLE_KEY,
      ...headers,
    },
    cache: 'no-store',
  }).catch(() => null)
  if (!res?.ok) return []
  const data = await res.json().catch(() => ({}))
  return data?.products ?? []
}

/** Just the product ids in the customer's wishlist. */
export const getWishlistProductIds = async (): Promise<string[]> => {
  const headers = await auth()
  if (!headers) return []
  const rq = await regionQuery()
  const res = await fetch(
    `${BACKEND_URL}/store/wishlist?limit=100&fields=id${rq ? `&${rq}` : ''}`,
    {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
        ...headers,
      },
      cache: 'no-store',
    }
  ).catch(() => null)
  if (!res?.ok) return []
  const data = await res.json().catch(() => ({}))
  return (data?.products ?? []).map((p: any) => p.id)
}
