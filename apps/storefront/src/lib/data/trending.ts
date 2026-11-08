const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string

export interface Trends {
  window_minutes: number
  terms: { key: string; count: number }[]
  product_ids: { key: string; count: number }[]
  category_ids: { key: string; count: number }[]
}

const EMPTY: Trends = {
  window_minutes: 30,
  terms: [],
  product_ids: [],
  category_ids: [],
}

export const getTrends = async (windowMinutes = 30): Promise<Trends> => {
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/trending?minutes=${windowMinutes}`,
      {
        headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
        next: { revalidate: 60 },
      }
    )
    if (!res.ok) return EMPTY
    return (await res.json()) as Trends
  } catch {
    return EMPTY
  }
}
