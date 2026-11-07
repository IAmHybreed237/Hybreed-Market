"use client"

import { useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { VerifiedBadge } from "@/components/atoms/VerifiedBadge/VerifiedBadge"
import { useCartContext } from "@/components/providers"
import { quickAdd } from "@/lib/quickAdd"
import { updateLineItem, deleteLineItem } from "@/lib/data/cart"

const fmt = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} XAF`

const FindSimilarIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="10" cy="10" r="6" stroke="white" strokeWidth="1.8" />
    <circle cx="15" cy="15" r="6" stroke="white" strokeWidth="1.8" opacity="0.85" />
    <path
      d="M18.5 4.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"
      fill="white"
    />
  </svg>
)

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill={filled ? "#EF4444" : "none"}
    stroke={filled ? "#EF4444" : "white"}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={
      filled
        ? { filter: "drop-shadow(0 0 3px rgba(0,0,0,0.6))" }
        : undefined
    }
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const CartGlyph = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const WalletIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#E11D48"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
  </svg>
)

const softShadow = { filter: "drop-shadow(0 0 3px rgba(0,0,0,0.6))" }

export const SearchResultCard = ({ p }: { p: any }) => {
  const router = useRouter()
  const { locale } = useParams() as { locale?: string }
  const loc = locale || "cm"
  const { cart, addToCart, updateCartItem, removeCartItem, refreshCart } =
    useCartContext() as any

  const [liked, setLiked] = useState(false)
  const [pop, setPop] = useState(false)
  const [busy, setBusy] = useState(false)
  const [slide, setSlide] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const images: string[] =
    (p.images?.map((i: any) => i.url).filter(Boolean).length
      ? p.images.map((i: any) => i.url)
      : [p.thumbnail]
    ).filter(Boolean) || []

  const v = p.variants?.[0]
  const price =
    v?.calculated_price?.calculated_amount ??
    v?.prices?.find(
      (pr: any) => String(pr.currency_code || "").toLowerCase() === "xaf"
    )?.amount
  const orig = v?.calculated_price?.original_amount
  const compare = orig != null && price != null && orig > price ? orig : null
  const discounted = Boolean(compare)
  const seller = p.seller?.name || "Hybreed seller"
  const verified = p.seller?.is_premium ?? true
  const rating = p.metadata?.rating
  const ratingCount = p.metadata?.rating_count ?? p.metadata?.reviews

  // cart line matching this product (by product id or offer product id)
  const line = (cart?.items || []).find(
    (i: any) =>
      i.product_id === p.id ||
      i.offer?.product_id === p.id ||
      i.variant?.product_id === p.id
  )
  const qty = line?.quantity ?? 0

  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const add = async (e: React.MouseEvent) => {
    stop(e)
    if (busy) return
    setBusy(true)
    try {
      if (qty > 0 && line?.id) {
        await updateCartItem(line.id, qty + 1)
      } else {
        // resolve the product's first offer, then add one unit
        const { listOffers } = await import("@/lib/data/offers")
        const { offers } = await listOffers({
          productId: p.id,
          countryCode: loc,
        } as any)
        const offer = (offers as any[])?.[0]
        if (!offer?.id) return
        await addToCart({ offerId: offer.id, quantity: 1, countryCode: loc })
      }
    } catch {
    } finally {
      setBusy(false)
      await refreshCart?.()
    }
  }

  const changeQty = async (next: number, e: React.MouseEvent) => {
    stop(e)
    if (!line?.id) return
    if (next <= 0) await removeCartItem(line.id)
    else await updateCartItem(line.id, next)
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el || !images.length) return
    setSlide(Math.round(el.scrollLeft / el.clientWidth))
  }

  const badges: { label: string; cls: string }[] = []
  if (!discounted)
    badges.push({ label: "GOOD PRICE", cls: "bg-[#EFF6FF] text-[#2563EB]" })
  if (discounted) badges.push({ label: "SALE", cls: "bg-[#E11D48] text-white" })

  return (
    <LocalizedClientLink
      href={`/products/${p.handle}`}
      className="block transition-opacity active:opacity-[0.92]"
    >
      {/* image */}
      <div className="relative rounded-[24px] overflow-hidden bg-white">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[3/4]"
        >
          {images.length ? (
            images.map((src, i) => (
              <div key={i} className="shrink-0 w-full relative">
                {!loaded && i === 0 && (
                  <div className="absolute inset-0 animate-pulse bg-[#E8E8EE]" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={p.title}
                  loading="lazy"
                  onLoad={() => i === 0 && setLoaded(true)}
                  className="absolute inset-0 w-full h-full object-cover snap-center"
                />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#9ca3af]">
              No image
            </div>
          )}
        </div>

        {/* find similar - top-left */}
        <button
          type="button"
          aria-label="Find similar items"
          onClick={(e) => {
            stop(e)
            router.push(
              `/${loc}/search?q=${encodeURIComponent(p.title || "")}`
            )
          }}
          className="absolute top-3 left-3 w-11 h-11 flex items-center justify-center"
          style={softShadow}
        >
          <FindSimilarIcon />
        </button>

        {/* like - top-right */}
        <button
          type="button"
          aria-label="Like"
          onClick={(e) => {
            stop(e)
            setLiked((v) => !v)
            if (!liked) {
              setPop(true)
              setTimeout(() => setPop(false), 250)
            }
          }}
          className={`absolute top-3 right-3 w-11 h-11 flex items-center justify-center transition-transform ${
            pop ? "scale-125" : ""
          }`}
          style={softShadow}
        >
          <HeartIcon filled={liked} />
        </button>

        {/* badges - bottom-left, clipped by rounded corner */}
        <div className="absolute bottom-0 left-0 flex flex-col items-start max-w-[75%]">
          {badges.slice(0, 2).map((b) => (
            <span
              key={b.label}
              className={`flex items-center h-[17px] px-2.5 text-[12px] font-semibold uppercase rounded-r-[8px] truncate max-w-full ${b.cls}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* pager dots */}
      {images.length > 1 && (
        <div className="flex justify-center mt-[1px] gap-1.5">
          {images.slice(0, 5).map((_, i) => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full ${
                i === slide ? "bg-[#2563EB]" : "bg-[rgba(120,120,130,0.5)]"
              }`}
            />
          ))}
        </div>
      )}

      {/* text block */}
      <div className="px-3 pt-1.5">
        <div className="flex items-center leading-6 gap-1.5">
          <WalletIcon />
          <span
            className="text-[19px] font-semibold leading-6"
            style={{ color: discounted ? "#E11D48" : "#1F1F23" }}
          >
            {price != null ? fmt(price) : "-"}
          </span>
          {discounted && compare != null && (
            <span className="text-[14px] text-[#6B6B76] line-through leading-6">
              {fmt(compare)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 leading-[17px] min-w-0">
          {verified && <VerifiedBadge size={14} />}
          <span className="text-[15px] text-[#1F1F23] truncate">{seller}</span>
        </div>
        <p className="text-[15px] leading-[17px] text-[#1F1F23]/85 truncate mt-0.5">
          {p.title}
        </p>
        {rating != null && (
          <div className="flex items-center gap-1 mt-[5px] leading-[22px]">
            <StarIcon />
            <span className="text-[15px] font-medium text-[#1F1F23]">
              {rating}
            </span>
            {ratingCount != null && (
              <>
                <span className="text-[15px] text-[#6B6B76]"> · </span>
                <span className="text-[15px] text-[#6B6B76] truncate">
                  {ratingCount} ratings
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* cart pill / stepper */}
      <div className="mt-3 mx-2">
        {qty === 0 ? (
          <button
            type="button"
            onClick={add}
            disabled={busy}
            className="w-full h-11 rounded-full bg-[#2563EB] text-white text-[18px] font-semibold flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-60"
          >
            <CartGlyph />
            Tomorrow
          </button>
        ) : (
          <div className="w-full h-11 rounded-full bg-[#2563EB] text-white flex items-center justify-between px-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={(e) => changeQty(qty - 1, e)}
              className="w-9 h-9 flex items-center justify-center text-[22px] font-semibold"
            >
              −
            </button>
            <span className="text-[18px] font-semibold">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={(e) => changeQty(qty + 1, e)}
              className="w-9 h-9 flex items-center justify-center text-[22px] font-semibold"
            >
              +
            </button>
          </div>
        )}
      </div>
    </LocalizedClientLink>
  )
}
