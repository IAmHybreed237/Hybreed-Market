"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { useCartContext } from "@/components/providers"
import { VerifiedBadge } from "@/components/atoms/VerifiedBadge/VerifiedBadge"
import { ProductImageViewer } from "@/components/organisms/ProductImageViewer/ProductImageViewer"

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6"/></svg>
)
const WalletIcon = ({ color = "#2563EB" }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2"/></svg>
)

const optionValue = (v: any, key: string) => {
  const o = v?.options
  if (!o) return undefined
  if (Array.isArray(o)) return o.find((x: any) => x.option?.title === key || x.option_title === key)?.value ?? o.find((x: any) => x.title === key)?.value
  return o[key]
}
const optionEntries = (v: any): [string, any][] => {
  const o = v?.options
  if (!o) return []
  if (Array.isArray(o))
    return o
      .map((x: any) => [x.option?.title || x.option_title || x.title, x.value] as [string, any])
      .filter(([k]) => k)
  return Object.entries(o)
}

export const WbProductTop = ({
  product,
  offers,
  locale,
  wishlisted,
}: {
  product: any
  offers: any[]
  locale: string
  wishlisted?: boolean
}) => {
  const router = useRouter()
  const { addToCart, isAddingItem } = useCartContext() as any
  const [imgIdx, setImgIdx] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [extraSel, setExtraSel] = useState<Record<string, string>>({})
  const [sizeErr, setSizeErr] = useState(false)
  const [colorErr, setColorErr] = useState(false)
  const [extraErr, setExtraErr] = useState(false)
  const [fav, setFav] = useState(!!wishlisted)
  const [favBusy, setFavBusy] = useState(false)

  const toggleFav = async () => {
    if (favBusy || !product?.id) return
    const next = !fav
    setFav(next)
    setFavBusy(true)
    try {
      const res = next
        ? await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: "product", reference_id: product.id }),
          })
        : await fetch(`/api/wishlist/product/${product.id}`, { method: "DELETE" })
      if (res.status === 401) {
        setFav(!next)
        router.push(`/${locale}/login`)
        return
      }
      if (!res.ok) setFav(!next)
    } catch {
      setFav(!next)
    } finally {
      setFavBusy(false)
    }
  }
  const [added, setAdded] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  const images = (product?.images || []).map((i: any) => i.url || i)
  const seller = product?.seller || offers?.[0]?.seller
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

  const colors = useMemo(() => {
    const set = new Set<string>()
    for (const v of product?.variants || []) {
      const c = optionValue(v, "Color")
      if (c) set.add(c)
    }
    return [...set]
  }, [product])

  // option axes other than Color/Size (e.g. "Pack") rendered as generic pickers
  const extraAxes = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const v of product?.variants || []) {
      for (const [k, val] of optionEntries(v)) {
        if (k === "Color" || k === "Size") continue
        const set = map.get(k) ?? new Set<string>()
        set.add(String(val))
        map.set(k, set)
      }
    }
    return [...map.entries()]
      .filter(([, vals]) => vals.size > 1)
      .map(([k, vals]) => [k, [...vals]] as [string, string[]])
  }, [product])

  const colorImages = (product?.metadata?.color_images || {}) as Record<string, string>

  const selectedVariant = useMemo(() => {
    const vs = product?.variants || []
    return (
      vs.find(
        (v: any) =>
          (!color || optionValue(v, "Color") === color) &&
          (!size || optionValue(v, "Size") === size) &&
          Object.entries(extraSel).every(([k, val]) => optionValue(v, k) === val)
      ) || null
    )
  }, [product, color, size, extraSel])
  const offer = useMemo(() => {
    if (!offers?.length) return null
    if (selectedVariant)
      return offers.find((o) => o.variant_id === selectedVariant.id) || offers[0]
    return offers[0]
  }, [offers, selectedVariant])

  const amount = offer?.calculated_price?.calculated_amount ??
    (offer?.prices || []).find(
      (p: any) => String(p.currency_code || "").toLowerCase() === "xaf"
    )?.amount
  const currency = offer?.calculated_price?.currency_code
    ? offer.calculated_price.currency_code.toUpperCase()
    : "XAF"
  const origAmount = offer?.calculated_price?.original_amount
  const discountPct =
    amount != null && origAmount != null && origAmount > amount
      ? Math.round((1 - amount / origAmount) * 100)
      : null
  const fmt = (n: number, c: string) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: c,
      maximumFractionDigits: 0,
    }).format(n)

  const priceForOption = (key: string, val: string) => {
    const v = (product?.variants || []).find((x: any) => optionValue(x, key) === val)
    const o = v && offers?.find((x: any) => x.variant_id === v.id)
    return (
      o?.calculated_price?.calculated_amount ??
      (o?.prices || []).find(
        (p: any) => String(p.currency_code || "").toLowerCase() === "xaf"
      )?.amount ??
      null
    )
  }

  const buy = async (go: boolean) => {
    if (sizes.length && !size) {
      setSizeErr(true)
      return
    }
    if (colors.length > 1 && !color) {
      setColorErr(true)
      return
    }
    if (extraAxes.some(([key]) => !extraSel[key])) {
      setExtraErr(true)
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

  const md = (product?.metadata || {}) as Record<string, any>
  // sale = explicitly flagged -> red; plain discount -> blue
  const onSale =
    md.sale === true || String(md.badge ?? "").trim().toUpperCase() === "SALE"
  const priceAccent = discountPct != null && !onSale ? "#2563EB" : "#FA1F4B"
  // gallery = images + optional video slide (appended last)
  const galleryItems = [
    ...images.map((src: string) => ({ type: "image" as const, src })),
    ...(md.video_url
      ? [{ type: "video" as const, src: String(md.video_url) }]
      : []),
  ]
  const crumbs: string[] = Array.isArray(md.breadcrumb) && md.breadcrumb.length
    ? md.breadcrumb
    : ["Main", "Shoes", "Men", "Sneakers"]

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
        {/* gallery - vertical thumbs left (desktop), row below (mobile) */}
        <div className="w-full lg:w-[440px] xl:w-[500px] shrink-0">
          <div className="flex gap-3">
            {galleryItems.length > 1 && (
              <div className="hidden lg:flex flex-col gap-2 overflow-y-auto max-h-[calc(100%*4/3)] w-[84px] shrink-0 scrollbar-hide">
                {galleryItems.map((item, i) => (
                  <button
                    key={item.type === "video" ? "video" : item.src + i}
                    onClick={() => setImgIdx(i)}
                    className={`relative w-[84px] h-[112px] shrink-0 rounded-xl overflow-hidden bg-[#F6F6F9] border-2 transition-colors ${
                      i === imgIdx ? "border-[#2563EB]" : "border-transparent hover:border-[#C7C7D1]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.type === "video" ? images[0] : item.src} alt="" className="w-full h-full object-cover" />
                    {item.type === "video" && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden><path d="M8 5v14l11-7z"/></svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div
              className="relative flex-1 aspect-[3/4] rounded-[24px] overflow-hidden bg-[#F6F6F9] cursor-zoom-in"
              onClick={() => {
                const it = galleryItems[imgIdx]
                if (it?.type === "image" && images.length > 0) setViewerOpen(true)
              }}
              role="button"
              aria-label="View photos fullscreen"
            >
              {galleryItems[imgIdx]?.type === "video" ? (
                <video
                  src={galleryItems[imgIdx]?.src}
                  poster={images[0]}
                  controls
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover bg-black"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={images[imgIdx]}
                  alt={product?.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {discountPct != null && (
                <span
                  className={`absolute top-3 left-3 text-white text-[12px] font-bold px-2.5 py-1 rounded-lg ${
                    onSale ? "bg-[#EF4444]" : "bg-[#2563EB]"
                  }`}
                >
                  {onSale ? "SALE" : `-${discountPct}%`}
                </span>
              )}
              {/* favorite + share */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button
                  aria-label="Add to favorites"
                  onClick={toggleFav}
                  className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center transition-colors ${fav ? "text-[#EF4444]" : "text-[#1F1F23] hover:text-[#EF4444]"}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={fav ? "#EF4444" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
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
          {galleryItems.length > 1 && (
            <div className="flex lg:hidden gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {galleryItems.map((item, i) => (
                <button
                  key={item.type === "video" ? "video" : item.src + i}
                  onClick={() => setImgIdx(i)}
                  className={`relative shrink-0 w-[72px] aspect-[3/4] rounded-xl overflow-hidden bg-[#F6F6F9] border-2 transition-colors ${
                    i === imgIdx ? "border-[#2563EB]" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.type === "video" ? images[0] : item.src} alt="" className="w-full h-full object-cover" />
                  {item.type === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden><path d="M8 5v14l11-7z"/></svg>
                    </span>
                  )}
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
            {seller?.is_premium ? <VerifiedBadge /> : null}
            {seller?.name || "Seller"}
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
            {color || md.color || ""}
          </p>

          {/* color picker */}
          {colors.length > 1 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2.5">
                <p className={`text-[15px] font-semibold ${colorErr ? "text-[#EF4444]" : "text-[#1F1F23]"}`}>
                  {colorErr ? "Select a color" : "Select Color"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c)
                      setColorErr(false)
                      const ci = images.indexOf(colorImages[c])
                      if (ci >= 0) setImgIdx(ci)
                    }}
                    className={`flex items-center gap-2 h-12 pl-1.5 pr-3.5 rounded-xl border text-[15px] font-semibold transition-colors ${
                      color === c
                        ? "border-[#2563EB] bg-[#DBEAFE] text-[#2563EB]"
                        : "border-[#E4E4EA] bg-white text-[#1F1F23] hover:border-[#2563EB]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={colorImages[c] || images[0]}
                      alt={c}
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* size picker */}
          {sizes.length > 0 && (
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
          )}

          {/* other option axes (e.g. pack size) */}
          {extraAxes.map(([key, vals]) => (
            <div key={key} className="mt-6">
              <div className="flex items-center justify-between mb-2.5">
                <p className={`text-[15px] font-semibold ${extraErr ? "text-[#EF4444]" : "text-[#1F1F23]"}`}>
                  {extraErr ? `Select ${key.toLowerCase()}` : key}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {vals.map((val) => {
                  const p = priceForOption(key, val)
                  return (
                    <button
                      key={val}
                      onClick={() => {
                        setExtraSel((s) => ({ ...s, [key]: val }))
                        setExtraErr(false)
                      }}
                      className={`min-h-[44px] px-3.5 py-1.5 rounded-xl border text-[15px] font-semibold transition-colors flex flex-col items-center justify-center ${
                        extraSel[key] === val
                          ? "border-[#2563EB] bg-[#2563EB] text-white"
                          : "border-[#E4E4EA] bg-white text-[#1F1F23] hover:border-[#2563EB]"
                      }`}
                    >
                      <span>{val}</span>
                      {p != null && (
                        <span className={`text-[12px] font-normal ${extraSel[key] === val ? "text-white/80" : "text-[#8A8A96]"}`}>
                          {fmt(p, "XAF")}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* details card */}
          <div className="mt-6 bg-white rounded-[20px] p-5">
            {[
              ["Item No.", md.item_no || String(product?.id || "").replace("prod_", "").slice(-10)],
              ["Color", color || md.color || "-"],
              ["Gender", md.gender || "Men"],
              ["Composition", md.composition || "calf suede; rubber"],
              ["Texture", md.texture],
              ["Style", md.style],
              ["Density", md.density],
              ["Season", "All-season"],
              ["Origin", md.country_of_origin || "Italy"],
            ]
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => (
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

        {/* right rail - buy panel */}
        <aside className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-20 self-start flex flex-col gap-4">
          <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <WalletIcon color={priceAccent} />
              <p
                className="text-[23px] font-bold leading-none"
                style={{ color: priceAccent }}
              >
                {amount != null ? fmt(amount, currency) : "-"}
              </p>
              {discountPct != null && origAmount != null && (
                <p className="text-[#8A8A96] text-[20px] line-through">
                  {fmt(origAmount, currency)}
                </p>
              )}
            </div>
            <p className="flex items-center gap-2 mt-3 text-[15px] text-[#1F1F23]">
              <span className="inline-flex items-center justify-center bg-[#2563EB] text-white text-[12px] font-bold rounded-md px-2 py-1">+</span>
              Hybreed+: extra 3% off
            </p>
            {pipParts > 0 && (
              <p className="text-[14px] text-[#8A8A96] mt-1.5 flex items-center gap-1.5">
                <img src="/images/pay-small-small.png" alt="" className="w-4 h-4 object-contain" />
                From {amount != null ? fmt(Math.round(amount / pipParts), currency) : "-"}{" "}
                × {pipParts} · Pay Small Small
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
                  {seller?.is_premium ? <VerifiedBadge size={15} /> : null}
                  {seller?.name || "Gaya Shopping"}
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

      {viewerOpen && (
        <ProductImageViewer
          images={images}
          index={imgIdx}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  )
}
