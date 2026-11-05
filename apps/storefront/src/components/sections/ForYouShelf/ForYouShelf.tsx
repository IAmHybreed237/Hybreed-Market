"use client"

import { useEffect, useState } from "react"
import { getTopCategories } from "@/lib/behavior"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"

const API = "http://localhost:9000"
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const ForYouShelf = ({ locale }: { locale: string }) => {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const cats = getTopCategories(3)
    if (!cats.length) return
    fetch(
      `${API}/store/products?limit=10&fields=title,handle,thumbnail,*variants.calculated_price,*variants.prices&${cats
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
    <section className="px-3 lg:px-10 mt-6 mb-4 max-w-[1400px] mx-auto w-full">
      <h2 className="text-xl font-bold text-[#1F1F23] mb-3">Picked for you</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            className="lg:!w-full !min-w-0"
          />
        ))}
      </div>
    </section>
  )
}
