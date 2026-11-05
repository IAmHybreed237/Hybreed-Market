"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { useCartContext } from "@/components/providers"

const VerifiedBadge = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="inline-block shrink-0">
    <path fill="#2563EB" d="M12 1.8l2.4 2.1 3.1-.4 1.4 2.9 2.9 1.4-.4 3.1 2.1 2.4-2.1 2.4.4 3.1-2.9 1.4-1.4 2.9-3.1-.4L12 22.2l-2.4-2.1-3.1.4-1.4-2.9-2.9-1.4.4-3.1L.5 10.7 2.6 8.3l-.4-3.1 2.9-1.4 1.4-2.9 3.1.4z"/>
    <path fill="#fff" d="M10.7 15.4l-3-3 1.4-1.4 1.6 1.6 4.2-4.2 1.4 1.4z"/>
  </svg>
)

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6"/></svg>
)

const optionValue = (v: any, key: string) => {
  const o = v?.options
  if (!o) return undefined
  if (Array.isArray(o)) return o.find((x: any) => x.option?.title === key || x.option_title === key)?.value ?? o.find((x: any) => x.title === key)?.value
  return o[key]
}

export const WbProductTop = ({
  product,
  offers,
  locale,
}: {
  product: any
  offers: any[]
  locale: string
}) => {
  const router = useRouter()
  const { addToCart, isAddingItem } = useCartContext() as any
  const [imgIdx, setImgIdx] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [sizeErr, setSizeErr] = useState(false)
  const [added, setAdded] = useState(false)

  const images = (product?.images || []).map((i: any) => i.url || i)
  const seller = product?.seller || offers?.[0]?.seller
  const verified = seller?.metadata?.verified || seller?.name === "Gaya Shopping"
  const pip = (product?.metadata?.pay_in_parts || {}) as {
    enabled?: boolean
    parts?: number
  }
  const pipParts = pip.enabled ? pip.parts || 4 : 0

  const sizes = useMemo(() => {
    const set = new Map<string, any>()
    for (const v of product?.variants || []) {
      const s = optionValue(v, "Size")
      if (s && !set.has(s)) set.set(s, v)
    }
    return [...set.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))
  }, [product])

  const selectedVariant = size ? sizes.find(([s]) => s === size)?.[1] : null
  const offer = useMemo(() => {
    if (!offers?.length) return null
    if (selectedVariant)
      return offers.find((o) => o.variant_id === selectedVariant.id) || offers[0]
    return offers[0]
  }, [offers, selectedVariant])

  const xafPrice = (offer?.prices || []).find(
    (p: any) => String(p.currency_code || "").toLowerCase() === "xaf"
  )
  const amount = xafPrice?.amount ?? offer?.calculated_price?.calculated_amount
  const currency = xafPrice
    ? "XAF"
    : offer?.calculated_price?.currency_code || "XAF"
  const fmt = (n: number, c: string) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: c,
      maximumFractionDigits: 0,
    }).format(n)

  const buy = async (go: boolean) => {
    if (!size) {
      setSizeErr(true)
      return
    }
    if (!offer?.id) return
    await addToCart({ offerId: offer.id, quantity: 1, countryCode: locale })
    if (go) router.push("/cart")
    else {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  const crumbs = ["Main", "Shoes", "Men", "Sneakers"]

  return (
    <div className="w-full">
      {/* breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[13px] text-[#8A8A96] mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[#C7C7D1]">/</span>}
            <span className={i === crumbs.length - 1 ? "text-[#1F1F23]" : "hover:text-[#2563EB]"}>{c}</span>
          </span>
        ))}
      </nav>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* gallery — vertical thumbs left (desktop), row below (mobile) */}
        <div className="w-full lg:w-[440px] xl:w-[500px] shrink-0">
          <div className="flex gap-3">
            {images.length > 1 && (
              <div className="hidden lg:flex flex-col gap-2 overflow-y-auto max-h-[calc(100%*4/3)] w-[84px] shrink-0 scrollbar-hide">
                {images.map((src: string, i: number) => (
                  <button
                    key={src + i}
                    onClick={() => setImgIdx(i)}
                    className={`w-[84px] h-[112px] shrink-0 rounded-xl overflow-hidden bg-[#F6F6F9] border-2 transition-colors ${
                      i === imgIdx ? "border-[#2563EB]" : "border-transparent hover:border-[#C7C7D1]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative flex-1 aspect-[3/4] rounded-[24px] overflow-hidden bg-[#F6F6F9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[imgIdx]}
                alt={product?.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 bg-[#EF4444] text-white text-[12px] font-bold px-2.5 py-1 rounded-lg">
                -{amount != null ? Math.round((1 - 1 / 1.65) * 100) : 39}%
              </span>
              {/* favorite + share */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button
                  aria-label="Add to favorites"
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-[#1F1F23] hover:text-[#EF4444] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
                </button>
                <button
                  aria-label="Share"
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-[#1F1F23] hover:text-[#2563EB] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.6" x2="15.4" y2="6.4"/><line x1="8.6" y1="13.4" x2="15.4" y2="17.6"/></svg>
                </button>
              </div>
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex lg:hidden gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {images.map((src: string, i: number) => (
                <button
                  key={src + i}
                  onClick={() => setImgIdx(i)}
                  className={`shrink-0 w-[72px] aspect-[3/4] rounded-xl overflow-hidden bg-[#F6F6F9] border-2 transition-colors ${
                    i === imgIdx ? "border-[#2563EB]" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* middle column */}
        <div className="flex-1 min-w-0">
          <LocalizedClientLink
            href={seller?.handle ? `/sellers/${seller.handle}` : "#"}
            className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-[#2563EB]"
          >
            {seller?.name || "Seller"}
            {verified && <VerifiedBadge />}
          </LocalizedClientLink>
          <h1 className="text-[#1F1F23] text-[22px] md:text-[26px] font-semibold leading-[120%] mt-1">
            {product?.title}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-[14px]">
            <span className="flex items-center gap-1 font-semibold text-[#1F1F23]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden><path d="M12 2l3 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l7-1z"/></svg>
              4.8
            </span>
            <span className="text-[#8A8A96]">·</span>
            <a href="#reviews" className="text-[#2563EB]">128 ratings</a>
            <span className="text-[#8A8A96]">·</span>
            <span className="text-[#8A8A96]">14 questions</span>
          </div>
          <p className="text-[15px] text-[#8A8A96] mt-2">
            {product?.metadata?.color || "Black"}
          </p>

          {/* size picker */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2.5">
              <p className={`text-[15px] font-semibold ${sizeErr ? "text-[#EF4444]" : "text-[#1F1F23]"}`}>
                {sizeErr ? "Select a size" : "Select Size"}
              </p>
              <button type="button" className="text-[14px] text-[#2563EB]">
                Size Chart
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map(([s]) => (
                <button
                  key={s}
                  onClick={() => { setSize(s); setSizeErr(false) }}
                  className={`min-w-[52px] h-11 px-3 rounded-xl border text-[15px] font-semibold transition-colors ${
                    size === s
                      ? "border-[#2563EB] bg-[#2563EB] text-white"
                      : "border-[#E4E4EA] bg-white text-[#1F1F23] hover:border-[#2563EB]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* details card */}
          <div className="mt-6 bg-white rounded-[20px] p-5">
            {[
              ["Item No.", String(product?.id || "").replace("prod_", "").slice(-10)],
              ["Color", product?.metadata?.color || "Black"],
              ["Gender", product?.metadata?.gender || "Men"],
              ["Composition", "calf suede; rubber"],
              ["Season", "All-season"],
              ["Origin", product?.metadata?.country_of_origin || "Italy"],
            ].map(([k, v]) => (
              <div key={k} className="flex py-2 border-b border-[#F0F0F3] last:border-0">
                <span className="w-[45%] text-[14px] text-[#8A8A96]">{k}</span>
                <span className="w-[55%] text-[14px] text-[#1F1F23]">{v}</span>
              </div>
            ))}
            <a href="#details" className="inline-flex items-center gap-1 mt-3 text-[14px] font-semibold text-[#2563EB]">
              Full details <Chevron />
            </a>
          </div>

          {/* service chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {["14 days to return", "Try on at pickup", "Escrow protected"].map((c) => (
              <span key={c} className="text-[13px] text-[#1F1F23] bg-white rounded-xl px-3 py-2">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* right rail — buy panel */}
        <aside className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-20 self-start flex flex-col gap-4">
          <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <p className="text-[#FA1F4B] text-[23px] font-bold leading-none">
                {amount != null ? fmt(amount, currency) : "—"}
              </p>
              <p className="text-[#8A8A96] text-[20px] line-through">
                {amount != null ? fmt(amount * 1.65, currency) : ""}
              </p>
            </div>
            <p className="flex items-center gap-2 mt-3 text-[15px] text-[#1F1F23]">
              <span className="inline-flex items-center justify-center bg-[#2563EB] text-white text-[12px] font-bold rounded-md px-2 py-1">+</span>
              Hybreed+: extra 3% off
            </p>
            {pipParts > 0 && (
              <p className="text-[14px] text-[#8A8A96] mt-1.5 flex items-center gap-1.5">
                <img src="/images/installments.png" alt="" className="w-4 h-4 object-contain" />
                From {amount != null ? fmt(Math.round(amount / pipParts), currency) : "—"}{" "}
                × {pipParts} with installments
              </p>
            )}
            <span className="inline-block mt-3 text-[14px] font-semibold text-[#16A34A] bg-[#16A34A]/10 rounded-lg px-3 py-1.5">
              Good price
            </span>
            <div className="flex flex-col gap-2.5 mt-5">
              <button
                onClick={() => buy(true)}
                disabled={isAddingItem}
                className="h-14 w-full rounded-2xl bg-[#2563EB] text-white text-[17px] font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-60"
              >
                Buy Now
              </button>
              <button
                onClick={() => buy(false)}
                disabled={isAddingItem}
                className={`h-14 w-full rounded-2xl text-[17px] font-semibold transition-colors disabled:opacity-60 ${
                  added
                    ? "bg-[#16A34A] text-white"
                    : "bg-[#DBEAFE] text-[#2563EB] hover:bg-[#BFDBFE]"
                }`}
              >
                {added ? "Added to cart" : "Add to Cart"}
              </button>
            </div>
          </div>

          {/* delivery */}
          <div className="bg-white rounded-[24px] p-6">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-semibold text-[#1F1F23]">Tomorrow</p>
              <span className="text-[14px] text-[#16A34A] font-semibold">Fast</span>
            </div>
            <p className="text-[15px] text-[#8A8A96] mt-1.5 leading-snug">
              Hybreed warehouse · Buea pickup point or courier
            </p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F0F0F3]">
              <span className="w-10 h-10 rounded-full bg-[#2563EB] text-white text-[15px] font-bold flex items-center justify-center shrink-0">
                {String(seller?.name || "G")[0]}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[15px] font-semibold text-[#1F1F23] truncate">
                  {seller?.name || "Gaya Shopping"}
                  {verified && <VerifiedBadge size={15} />}
                </p>
                <p className="flex items-center gap-1.5 text-[13px] text-[#8A8A96] mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden><path d="M12 2l3 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l7-1z"/></svg>
                  4.9 seller rating
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
