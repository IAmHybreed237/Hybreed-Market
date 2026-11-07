"use client"

import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@/lib/utils"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { Product } from "@/types/product"
import { useState } from "react"

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : "#1F1F23"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
)
const BagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FA1F4B" aria-hidden>
    <path d="M6 7V6a6 6 0 1 1 12 0v1h3l-1.2 13.2a2 2 0 0 1-2 1.8H6.2a2 2 0 0 1-2-1.8L3 7h3zm2 0h8V6a4 4 0 1 0-8 0v1z" />
  </svg>
)
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden>
    <path d="M12 2l3 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l7-1z" />
  </svg>
)
const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

const num = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ")

export const ProductCard = ({
  product,
  className,
}: {
  product: HttpTypes.StoreProduct | Product,
  className?: string
}) => {
  const [fav, setFav] = useState(false)

  if (!product) {
    return null
  }

  const { cheapestPrice } = getProductPrice({ product: product as HttpTypes.StoreProduct })
  const productName = String(product.title || "Product")

  const calcNum = (cheapestPrice as any)?.calculated_price_number as number | undefined
  const origNum = (cheapestPrice as any)?.original_price_number as number | undefined

  // calculated_price already resolves price lists/promotions - prefer it.
  // Raw variant.prices only hold base prices, so they must not win over it.
  const calcCurrency = String((cheapestPrice as any)?.currency_code || "").toLowerCase()
  let xafAmount: number | null =
    calcNum != null
      ? calcCurrency === "xaf"
        ? calcNum
        : Math.round(calcNum * 655.957)
      : null
  if (xafAmount == null) {
    for (const v of (product as any).variants || []) {
      for (const p of v?.prices || []) {
        const c = String(p?.currency_code || "").toLowerCase()
        if (c === "xaf") xafAmount = xafAmount == null ? p.amount : Math.min(xafAmount, p.amount)
      }
    }
  }
  const xaf = xafAmount
  const priceStr = xaf != null ? `${num(xaf)} XAF` : cheapestPrice?.calculated_price

  const hasRealSale = origNum != null && calcNum != null && origNum > calcNum
  const oldNum = hasRealSale ? origNum : null
  const pct = hasRealSale
    ? Math.round((1 - calcNum! / origNum!) * 100)
    : null

  const stock = (product.variants || []).reduce(
    (acc: number, v: any) => acc + (v?.inventory_quantity ?? 0),
    0
  ) || 0
  const stockShown =
    stock > 0 && stock <= 30
      ? stock
      : stock === 0
        ? ((product.handle || "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 10) + 3
        : null

  const brand = (product as any)?.metadata?.brand || (product as any)?.seller?.name || "Hybreed"
  const categoryName = (product as any)?.categories?.[0]?.name || "Sneakers"

  return (
    <div
      className={cn(
        "relative group flex flex-col w-full lg:w-[calc(25%-1rem)] min-w-[200px]",
        className
      )}
      data-testid="product-card"
      data-product-handle={product.handle}
    >
      {/* image block */}
      <div className="relative w-full aspect-[3/4] rounded-[16px] overflow-hidden bg-[#F6F6F9]">
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          aria-label={`View ${productName}`}
          title={`View ${productName}`}
          data-testid="product-card-link"
          className="block w-full h-full"
        >
          {product.thumbnail ? (
            <Image
              priority
              fetchPriority="high"
              src={decodeURIComponent(product.thumbnail)}
              alt={`${productName} image`}
              width={400}
              height={533}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover w-full h-full"
              data-testid="product-card-image"
            />
          ) : (
            <Image
              priority
              fetchPriority="high"
              src="/images/placeholder.svg"
              alt={`${productName} image placeholder`}
              width={400}
              height={533}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover w-full h-full"
              data-testid="product-card-placeholder-image"
            />
          )}
        </LocalizedClientLink>

        <button
          type="button"
          aria-label="Add to favorites"
          onClick={() => setFav(!fav)}
          className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center"
        >
          <HeartIcon filled={fav} />
        </button>

        {pct != null && (
          <div className="absolute bottom-2.5 left-2.5 flex flex-col items-start gap-1">
            <span className="h-[18px] px-1.5 rounded-md bg-[#E11D48] text-white text-[10px] font-bold flex items-center">
              -{pct}%
            </span>
            <span className="h-[18px] px-1.5 rounded-md bg-[#6129CE] text-white text-[10px] font-bold flex items-center">
              SALE
            </span>
          </div>
        )}
      </div>

      {/* info block */}
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        aria-label={`Go to ${productName} page`}
        title={`Go to ${productName} page`}
      >
        <div className="mt-2.5" data-testid="product-card-info">
          <div className="flex items-center gap-1.5" data-testid="product-card-price">
            <BagIcon />
            <p className="text-[16px] font-bold text-[#FA1F4B]" data-testid="product-card-current-price">
              {priceStr}
            </p>
            {oldNum != null && (
              <p className="text-[14px] text-[#8A8A96] line-through" data-testid="product-card-original-price">
                {num(oldNum)} XAF
              </p>
            )}
          </div>
          <p className="text-[14px] text-[#8A8A96] truncate mt-0.5" data-testid="product-card-title">
            {brand} / {categoryName}
          </p>
          <p className="flex items-center gap-1 text-[13px] text-[#8A8A96] mt-1">
            <StarIcon /> 4.8 · 128 ratings
          </p>
          {stockShown != null && (
            <>
              <p className="text-[13px] font-medium text-[#E11D48] mt-1">
                Only {stockShown} left
              </p>
              <div className="h-[3px] rounded-full bg-[#F0F0F3] mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#E11D48] rounded-full"
                  style={{ width: `${Math.min(stockShown, 30) / 30 * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      </LocalizedClientLink>

      {/* delivery CTA */}
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="mt-2.5 h-9 rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#1D4ED8] transition-colors"
      >
        <CartIcon />
        Tomorrow
      </LocalizedClientLink>
    </div>
  )
}
