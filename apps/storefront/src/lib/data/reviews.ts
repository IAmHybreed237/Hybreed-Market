'use server'

import { getAuthHeaders } from './cookies'

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

export type ViewerReview = {
  rating: number
  text: string
  author: ProductReview['author']
  reactions: { like: number; liked: boolean }
  following: boolean
  is_own: boolean
}

export type ReviewMediaItem = {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnail_url: string | null
  review_id: string
  review?: ViewerReview | null
}

export type ProductReview = {
  id: string
  rating: number
  text: string
  seller_note: string | null
  created_at: string
  edited_at: string | null
  language: string | null
  variant_id: string | null
  variant_label: string | null
  media: ReviewMediaItem[]
  author: { id: string | null; name: string; initial: string; label: string; top: boolean }
  reactions: { like: number; heart: number; clap: number }
  mine: ('like' | 'heart' | 'clap')[]
  following: boolean
  is_own: boolean
}

export type ProductReviewsResponse = {
  summary: { average: number | null; count: number; distribution: Record<string, number> }
  media: ReviewMediaItem[]
  media_count: number
  count: number
  offset: number
  limit: number
  reviews: ProductReview[]
}

// not exported: 'use server' modules may only export async functions
const EMPTY_REVIEWS: ProductReviewsResponse = {
  summary: { average: null, count: 0, distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } },
  media: [],
  media_count: 0,
  count: 0,
  offset: 0,
  limit: 10,
  reviews: [],
}

export const getProductReviews = async (
  productId: string,
  params: { variant_id?: string | null; sort?: string; limit?: number; offset?: number } = {}
): Promise<ProductReviewsResponse> => {
  const qs = new URLSearchParams()
  if (params.variant_id) qs.set('variant_id', params.variant_id)
  if (params.sort) qs.set('sort', params.sort)
  qs.set('limit', String(params.limit ?? 10))
  qs.set('offset', String(params.offset ?? 0))
  try {
    const res = await fetch(`${BACKEND_URL}/store/product-reviews/${productId}?${qs}`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY, ...(await getAuthHeaders()) },
      cache: 'no-store',
    })
    if (!res.ok) return EMPTY_REVIEWS
    return (await res.json()) as ProductReviewsResponse
  } catch {
    return EMPTY_REVIEWS
  }
}
