"use client"

import { useEffect, useState } from "react"
import { getTopCategories } from "@/lib/behavior"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

const API = "http://localhost:9000"
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const ForYouShelf = ({ locale }: { locale: string }) => {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const cats = getTopCategories(3)
    if (!cats.length) return
    fetch(
      `${API}/store/products?limit=10&fields=title,handle,thumbnail,*variants.calculated_price&${cats
        .map((c) => `category_id[]=${c}`)
        .join("&")}`,
      { headers: { "x-publishable-api-key": KEY } }
    )
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
  }, [])

  if (!products.length) return null

  return (
    <section className="px-3 mt-6 mb-4">
      <h2 className="text-xl font-bold text-[#1F1F23] mb-3">Picked for you</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {products.map((p) => {
          const price = p.variants?.[0]?.calculated_price?.calculated_amount
          return (
            <LocalizedClientLink
              key={p.id}
              href={`/products/${p.handle}`}
              className="bg-white rounded-2xl overflow-hidden hover:opacity-90 transition-opacity"
            >
              <div className="aspect-[3/4] bg-[#F0F0F3]">
                {p.thumbnail && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-[#1F1F23] truncate">{p.title}</p>
                {price != null && (
                  <p className="text-base font-bold text-[#2563EB] mt-1">
                    {Math.round(price).toLocaleString()} XAF
                  </p>
                )}
              </div>
            </LocalizedClientLink>
          )
        })}
      </div>
    </section>
  )
}
