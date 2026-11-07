"use client"

import { useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { quickAdd } from "@/lib/quickAdd"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { VerifiedBadge } from "@/components/atoms/VerifiedBadge/VerifiedBadge"

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9.9 9.9a3 3 0 0 0 4.24 4.24" />
  </svg>
)
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : "currentColor"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)
const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#E11D48" aria-hidden>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
  </svg>
)
const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)
const fmt = (n: number) =>
  `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XAF`

export const MobileProductCard = ({ p }: { p: any }) => {
  const [hidden, setHidden] = useState(false)
  const [liked, setLiked] = useState(false)
  const [qty, setQty] = useState(0)
  const [checked, setChecked] = useState(false)
  const pathname = usePathname()
  const [slide, setSlide] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const images: string[] =
    (p.images?.map((i: any) => i.url).filter(Boolean).length
      ? p.images.map((i: any) => i.url)
      : [p.thumbnail]
    ).filter(Boolean) || []

  const v = p.variants?.[0]
  const price = v?.calculated_price?.calculated_amount ?? v?.prices?.[0]?.amount
  const compare =
    v?.calculated_price?.original_amount > price
      ? v.calculated_price.original_amount
      : null
  const discounted = Boolean(compare)
  const seller = p.seller?.name || p.collection?.title || "Hybreed seller"
  const rating = p.metadata?.rating ?? 4.8
  const reviews = p.metadata?.reviews ?? "174,252"

  const badges: { label: string; cls: string }[] = []
  if (discounted) badges.push({ label: "SALE", cls: "bg-[#E11D48] text-white" })
  else badges.push({ label: "GOOD PRICE", cls: "bg-[#DBEAFE] text-[#2563EB]" })
  if (p.metadata?.badge) badges.push({ label: String(p.metadata.badge), cls: "bg-[#F3E8FF] text-[#7C3AED]" })

  if (hidden)
    return (
      <button
        onClick={() => setHidden(false)}
        className="text-xs text-[#2563EB] underline py-6 text-center w-full"
      >
        Hidden - Undo
      </button>
    )

  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const addToCart = async (e: React.MouseEvent) => {
    stop(e)
    try {
      const locale = pathname.split("/")[1] || "de"
      await quickAdd(p.id, locale)
      setQty(1)
      setChecked(true)
      setTimeout(() => setChecked(false), 1200)
    } catch {}
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el || !images.length) return
    setSlide(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <LocalizedClientLink
      href={`/products/${p.handle}`}
      className="block transition-opacity active:opacity-90"
    >
      {/* image card */}
      <div className="relative">
        <div className="rounded-[14px] overflow-hidden relative">
          <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[3/4] bg-[#f1f1f4]"
        >
          {images.length ? (
            images.map((src, i) => (
              <div key={i} className="shrink-0 w-full relative">
                {!loaded && i === 0 && (
                  <div className="absolute inset-0 animate-pulse bg-[#e5e5ea]" />
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

        {/* hide - top-left */}
        <button
          type="button"
          aria-label="Not interested"
          onClick={(e) => {
            stop(e)
            setHidden(true)
          }}
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-[#1f2937]"
        >
          <EyeOffIcon />
        </button>

        {/* like - top-right */}
        <button
          type="button"
          aria-label="Like"
          onClick={(e) => {
            stop(e)
            setLiked((v) => !v)
          }}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-[#1f2937] transition-transform ${
            liked ? "scale-110" : ""
          }`}
        >
          <HeartIcon filled={liked} />
        </button>

        {/* badges - bottom-left stack */}
        <div className="absolute bottom-3 left-0 flex flex-col gap-1 items-start max-w-[70%]">
          {badges.slice(0, 3).map((b) => (
            <span
              key={b.label}
              className={`text-[12px] font-semibold px-2 py-0.5 rounded-r-full rounded-l-md truncate max-w-full ${b.cls}`}
            >
              {b.label}
            </span>
          ))}
        </div>

        </div>

        {/* add-to-cart - bottom-right, overlapping edge */}
        <div className="absolute -bottom-2 right-2">
          {qty === 0 ? (
            <button
              type="button"
              aria-label="Add to cart"
              onClick={addToCart}
              className="w-[46px] h-[46px] rounded-[14px] bg-[#2563EB] text-white flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_0_3px_#fff]"
            >
              {checked ? <CheckIcon /> : <CartIcon />}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white rounded-[14px] px-2 py-1 shadow-[0_0_0_3px_#fff]">
              <button
                onClick={(e) => {
                  stop(e)
                  setQty((q) => Math.max(0, q - 1))
                }}
                className="w-8 h-8 text-[#2563EB] font-bold text-lg"
                aria-label="Decrease"
              >
                −
              </button>
              <span className="text-sm font-bold min-w-3 text-center">{qty}</span>
              <button
                onClick={(e) => {
                  stop(e)
                  setQty((q) => q + 1)
                }}
                className="w-8 h-8 text-[#2563EB] font-bold text-lg"
                aria-label="Increase"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* dots below image */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1">
          {images.slice(0, 5).map((_, i) => (
            <span
              key={i}
              className={`h-[5px] rounded-full transition-all ${
                i === slide ? "w-3.5 bg-[#2563EB]" : "w-[5px] bg-[#d1d5db]"
              }`}
            />
          ))}
        </div>
      )}

      {/* text block */}
      <div className="px-2.5 pt-2 pb-1 flex flex-col gap-[3px]">
        <div className="flex items-baseline gap-1.5">
          <TagIcon />
          <span
            className="text-[19px] font-bold"
            style={{ color: discounted ? "#E11D48" : "#1f2937" }}
          >
            {price != null ? fmt(price) : "-"}
          </span>
          {discounted && (
            <span className="text-sm text-[#9ca3af] line-through">
              {fmt(compare!)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[15px] text-[#1f2937] min-w-0">
          <VerifiedBadge size={16} />
          <span className="truncate">{seller}</span>
        </div>
        <p className="text-[15px] text-[#374151] truncate">{p.title}</p>
        {rating != null && (
          <div className="flex items-center gap-1 text-sm text-[#6B7280]">
            <StarIcon />
            <span className="font-medium text-[#1f2937]">{rating}</span>
            <span>·</span>
            <span className="truncate">{reviews} ratings</span>
          </div>
        )}
      </div>
    </LocalizedClientLink>
  )
}
