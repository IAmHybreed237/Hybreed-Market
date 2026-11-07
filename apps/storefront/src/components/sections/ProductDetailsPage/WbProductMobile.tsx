"use client"

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { useCartContext } from "@/components/providers"
import { VerifiedBadge } from "@/components/atoms/VerifiedBadge/VerifiedBadge"
import { ProductImageViewer } from "@/components/organisms/ProductImageViewer/ProductImageViewer"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

const Clover = ({ size = 16, color = "#2563EB" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
    <circle cx="8" cy="8" r="5.5" /><circle cx="16" cy="8" r="5.5" />
    <circle cx="8" cy="16" r="5.5" /><circle cx="16" cy="16" r="5.5" />
    <path fill="#fff" d="M12 10.6l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z" />
  </svg>
)
const StarIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F59E0B" aria-hidden>
    <path d="M12 2l3 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l7-1z" />
  </svg>
)
const Chevron = ({ size = 16, color = "#8A8A96" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
)
const BackIcon = ({ size = 28, color = "#fff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="15 18 9 12 15 6" /></svg>
)
const HeartIcon = ({ size = 28, filled = false, color = "#fff" }: { size?: number; filled?: boolean; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
)
const ShareIcon = ({ size = 28, color = "#fff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="10.6" x2="15.4" y2="6.4" /><line x1="8.6" y1="13.4" x2="15.4" y2="17.6" /></svg>
)
const optionValue = (v: any, key: string) => {
  const o = v?.options
  if (!o) return undefined
  if (Array.isArray(o)) return o.find((x: any) => x.option?.title === key || x.option_title === key)?.value ?? o.find((x: any) => x.title === key)?.value
  return o[key]
}

const num = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ")

const ABOUT_FIELDS: [string, string][] = [
  ["color", "Colour"],
  ["gender", "Gender"],
  ["product_type", "Category"],
  ["texture", "Texture"],
  ["length", "Length"],
  ["lace_type", "Lace type"],
  ["cap", "Cap"],
  ["hairline", "Hairline"],
  ["composition", "Composition"],
  ["hair_type", "Hair type"],
  ["material", "Material"],
  ["style", "Style"],
  ["density", "Density"],
  ["fit", "Fit"],
  ["insulation", "Insulation"],
  ["season", "Season"],
  ["condition", "Condition"],
  ["country_of_origin", "Origin"],
  ["item_no", "Item No."],
]

const ABOUT_SKIP = new Set(["color_images", "pay_in_parts", "breadcrumb"])

export const WbProductMobile = ({
  product,
  offers,
  similar,
  locale,
}: {
  product: any
  offers: any[]
  similar: any[]
  locale: string
}) => {
  const router = useRouter()
  const { addToCart, isAddingItem } = useCartContext() as any
  const [imgIdx, setImgIdx] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [fav, setFav] = useState(false)
  const [followed, setFollowed] = useState(false)
  const [added, setAdded] = useState(false)
  const [shake, setShake] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [header, setHeader] = useState(false)
  const [sheet, setSheet] = useState<null | "sizes" | "delivery" | "parts" | "about" | "price">(null)
  const [sheetClosing, setSheetClosing] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [viewerIdx, setViewerIdx] = useState<number | null>(null)
  const [tab, setTab] = useState<"like" | "buy">("like")
  const [imgRatios, setImgRatios] = useState<Record<string, number>>({})
  const galleryRef = useRef<HTMLDivElement>(null)
  const sizesRef = useRef<HTMLDivElement>(null)
  const sheetScrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<number | null>(null)

  const images = (product?.images || []).map((i: any) => i.url || i)
  const seller = product?.seller || offers?.[0]?.seller
  const pip = (product?.metadata?.pay_in_parts || {}) as {
    enabled?: boolean
    parts?: number
  }
  const pipParts = pip.enabled ? pip.parts || 4 : 0

  useEffect(() => {
    const el = galleryRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const bottom = el.getBoundingClientRect().bottom
        setHeader((prev) => (prev ? bottom < 72 : bottom < 56))
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  useBodyScrollLock(!!sheet)

  const openSheet = (s: "sizes" | "delivery" | "parts" | "about" | "price") => {
    setSheetClosing(false)
    setDragY(0)
    setSheet(s)
  }

  const closeSheet = () => {
    if (sheetClosing) return
    const target = sheet
    setSheetClosing(true)
    setTimeout(() => {
      setSheet((s) => (s === target ? null : s))
      setSheetClosing(false)
      setDragY(0)
    }, 220)
  }

  const sheetTouchStart = (e: TouchEvent) => {
    if (sheetScrollRef.current && sheetScrollRef.current.scrollTop <= 0) {
      dragRef.current = e.touches[0].clientY
    }
  }
  const sheetTouchMove = (e: TouchEvent) => {
    if (dragRef.current == null) return
    const dy = e.touches[0].clientY - dragRef.current
    if (dy > 0) setDragY(dy)
    else {
      dragRef.current = null
      setDragY(0)
    }
  }
  const sheetTouchEnd = () => {
    if (dragRef.current == null) return
    dragRef.current = null
    if (dragY > 90) closeSheet()
    else setDragY(0)
  }

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

  const colorImages = (product?.metadata?.color_images || {}) as Record<string, string>
  const colorImg = (c: string) => colorImages[c] || null

  const selectedVariant = useMemo(() => {
    const vs = product?.variants || []
    return (
      vs.find(
        (v: any) =>
          (!color || optionValue(v, "Color") === color) &&
          (!size || optionValue(v, "Size") === size)
      ) || null
    )
  }, [product, color, size])

  // when a color has its own photo, show it first in the gallery
  const displayImages = useMemo(() => {
    const cImg = color ? colorImg(color) : null
    if (!cImg) return images
    return [cImg, ...images.filter((u: string) => u !== cImg)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, color, colorImages])

  useEffect(() => {
    setImgIdx(0)
  }, [color])
  const offer = useMemo(() => {
    if (!offers?.length) return null
    if (selectedVariant) return offers.find((o) => o.variant_id === selectedVariant.id) || offers[0]
    return offers[0]
  }, [offers, selectedVariant])

  const amount = offer?.calculated_price?.calculated_amount ??
    (offer?.prices || []).find((p: any) => String(p.currency_code || "").toLowerCase() === "xaf")?.amount
  const origAmount = offer?.calculated_price?.original_amount
  const oldAmount = origAmount != null && amount != null && origAmount > amount ? origAmount : null
  // Hybreed Wallet orders get an extra 3% off (WALLET3 promo) on top of the
  // displayed price, which already includes any personal discount.
  const walletAmount = amount != null ? Math.round(amount * 0.97) : null
  const stock = offer?.inventory_quantity ?? null
  const outOfStock = stock !== null && stock <= 0

  const brand = seller?.name || "Hybreed"
  const typeName = product?.metadata?.product_type || "Sneakers"
  const md = (product?.metadata || {}) as Record<string, any>

  const aboutRows = useMemo(() => {
    const rows: [string, string][] = []
    const seen = new Set<string>()
    for (const [key, label] of ABOUT_FIELDS) {
      const v = md[key]
      if (v != null && v !== "") {
        rows.push([label, String(v)])
        seen.add(key)
      }
    }
    if (Array.isArray(md.breadcrumb) && md.breadcrumb.length) {
      rows.unshift(["Category", md.breadcrumb.join(" › ")])
    }
    for (const [key, v] of Object.entries(md)) {
      if (seen.has(key) || ABOUT_SKIP.has(key) || v == null || v === "" || typeof v === "object") continue
      rows.push([
        key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        String(v),
      ])
    }
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product])

  const buy = async (go: boolean) => {
    if (sizes.length && !size) {
      setShake(true)
      setToast("Select a size")
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      setTimeout(() => setShake(false), 500)
      return
    }
    if (colors.length > 1 && !color) {
      setToast("Select a color")
      return
    }
    if (!offer?.id) return
    await addToCart({ offerId: offer.id, quantity: 1, countryCode: locale })
    if (go) router.push("/cart")
    else setAdded(true)
  }

  const scrollToId = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

  const similarList = (similar || []).slice(0, 12)

  return (
    <div className="bg-[#F5F5F7] -mx-4 md:hidden" style={{ paddingBottom: "calc(56px + 8px + 52px + 16px + env(safe-area-inset-bottom,0px))" }}>
      {/* product pages have no site header on mobile - the gallery is the top */}
      <style>{`
        @media (max-width: 767.98px) {
          [data-testid="header"], [data-testid="mobile-header-spacer"] { display: none !important }
        }
      `}</style>
      {/* sticky mini header */}
      <div
        className="fixed top-0 left-0 right-0 h-14 bg-[#F5F5F7] z-40 flex items-center gap-2 px-3 transition-opacity duration-200"
        style={{ opacity: header ? 1 : 0, pointerEvents: header ? "auto" : "none" }}
      >
        <button aria-label="Back" onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center text-[#2563EB]">
          <BackIcon size={22} color="#2563EB" />
        </button>
        <div className="flex-1 text-center min-w-0">
          <p className="text-[16px] font-semibold text-[#1F1F23] truncate">{brand} • {typeName}</p>
          <p className="text-[14px] text-[#FA1F4B]">{amount != null ? `${num(amount)} XAF` : ""}</p>
        </div>
        <button aria-label="Favourite" onClick={() => setFav(!fav)} className="w-9 h-9 flex items-center justify-center">
          <HeartIcon size={22} filled={fav} color="#2563EB" />
        </button>
        <button aria-label="Share" className="w-9 h-9 flex items-center justify-center">
          <ShareIcon size={22} color="#2563EB" />
        </button>
      </div>

      {/* 1. gallery */}
      <div ref={galleryRef} className="relative">
        <div
          className="flex overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          onScroll={(e) => {
            const el = e.currentTarget
            setImgIdx(Math.round(el.scrollLeft / el.clientWidth))
          }}
        >
          {displayImages.map((src: string, i: number) => (
            <div
              key={i}
              className="w-full shrink-0 snap-start relative bg-[#E7E7EA] cursor-zoom-in"
              style={{
                aspectRatio: String(imgRatios[src] ?? 0.95),
                maxHeight: "85svh",
              }}
              onClick={() => setViewerIdx(i)}
              role="button"
              aria-label="View photos fullscreen"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={product?.title}
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={(e) => {
                  const img = e.currentTarget
                  if (!img.naturalWidth || !img.naturalHeight) return
                  const ratio = Math.min(
                    1.5,
                    Math.max(0.75, img.naturalWidth / img.naturalHeight)
                  )
                  setImgRatios((prev) =>
                    prev[src] === ratio ? prev : { ...prev, [src]: ratio }
                  )
                }}
              />
            </div>
          ))}
        </div>
        {/* overlay buttons */}
        {!header && (
          <>
            <button aria-label="Back" onClick={() => router.back()} className="absolute top-[16px] left-4 w-9 h-9 rounded-full bg-black/35 backdrop-blur flex items-center justify-center">
              <BackIcon size={20} />
            </button>
            <div className="absolute top-[16px] right-4 flex items-center gap-2">
              <button aria-label="Favourite" onClick={() => setFav(!fav)} className="w-9 h-9 rounded-full bg-black/35 backdrop-blur flex items-center justify-center">
                <HeartIcon size={20} filled={fav} />
              </button>
              <button aria-label="Share" className="w-9 h-9 rounded-full bg-black/35 backdrop-blur flex items-center justify-center">
                <ShareIcon size={20} />
              </button>
            </div>
          </>
        )}
        {/* badges */}
        {oldAmount && (
          <span className="absolute bottom-4 left-4 h-[31px] px-3 rounded-xl bg-[#E11D48] text-white text-[17px] font-semibold flex items-center">
            SALE
          </span>
        )}
        <button
          onClick={() => scrollToId("also-like")}
          className="absolute bottom-4 right-4 h-[31px] px-3 rounded-xl text-[#1F1F23] text-[15px] font-medium flex items-center"
          style={{ background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)" }}
        >
          Similar Items
        </button>
      </div>

      {/* 2. main card */}
      <div className="bg-white rounded-b-[28px] px-4 pt-3 pb-4 mb-1">
        <button
          onClick={() => openSheet("price")}
          className="flex items-baseline gap-1.5 h-7 w-full text-left"
          aria-label="Price breakdown"
        >
          <p className="text-[23px] font-semibold text-[#FA1F4B] leading-[28px]">
            {amount != null ? `${num(amount)} XAF` : "-"}
          </p>
          {oldAmount && (
            <p className="text-[16px] text-[#8A8A96] line-through">{num(oldAmount)} XAF</p>
          )}
        </button>

        {pipParts > 0 && (
          <button onClick={() => scrollToId("installments")} className="mt-1.5 h-[22px] px-2.5 rounded-full bg-[#DBEAFE] inline-flex items-center gap-1.5">
            <img src="/images/installments.png" alt="" className="w-4 h-4 object-contain" />
            <span className="text-[13px] font-medium text-[#2563EB] uppercase tracking-wide">Pay in parts</span>
          </button>
        )}

        {stock !== null && stock <= 30 && stock > 0 && (
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex-1 h-1 rounded-sm bg-[#E4E4EA] overflow-hidden">
              <div className="h-full bg-[#E11D48] rounded-sm" style={{ width: `${Math.min(stock, 30) / 30 * 100}%` }} />
            </div>
            <span className="text-[14px] font-medium text-[#E11D48]">
              {stock <= 5 ? `Only ${stock} left` : stock <= 10 ? "Less than 10" : "Less than 30"}
            </span>
          </div>
        )}

        {colors.length > 1 && (
          <div className="mt-4">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ scrollSnapType: "x proximity" }}>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={`w-[45px] h-[59px] rounded-[14px] overflow-hidden shrink-0 snap-start transition-all ${
                    color === c ? "border-2 border-[#2563EB]" : "border-2 border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={colorImg(c) || images[0]} alt={c} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="mt-1.5 h-5 flex items-center justify-between">
              <span className="text-[16px] text-[#8A8A96]">{(color || colors[0])?.toLowerCase()}</span>
              <span className="text-[16px] font-medium text-[#2563EB]">All {colors.length}</span>
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div ref={sizesRef} className="mt-3" style={shake ? { animation: "shake .4s" } : undefined}>
            <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}`}</style>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ scrollSnapType: "x proximity" }}>
              {sizes.map(([s]) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-[58px] h-12 rounded-[14px] shrink-0 snap-start flex flex-col items-center justify-center transition-colors ${
                    size === s ? "border-2 border-[#2563EB] bg-[#DBEAFE]" : "bg-[#F0F0F3]"
                  }`}
                >
                  <span className="text-[20px] font-medium text-[#1F1F23] leading-none">{s}</span>
                  <span className="text-[13px] text-[#8A8A96] leading-none mt-0.5">EU</span>
                </button>
              ))}
            </div>
            <div className="mt-2 h-5 flex items-center justify-between">
              <span className="text-[15px] text-[#8A8A96]">83% True to size</span>
              <button onClick={() => openSheet("sizes")} className="text-[15px] font-medium text-[#2563EB]">Size Chart</button>
            </div>
          </div>
        )}
      </div>

      {/* 3. installments card */}
      {pipParts > 0 && (
      <button id="installments" onClick={() => openSheet("parts")} className="w-full bg-white rounded-[28px] px-4 py-4 mb-1 flex items-center gap-3.5 text-left active:scale-[0.99] transition-transform">
        <img src="/images/installments.png" alt="" className="w-[35px] h-[35px] object-contain" />
        <span className="flex-1 min-w-0">
          <span className="block text-[17px] font-semibold text-[#1F1F23] leading-snug">
            Pay in Parts {amount != null ? `${num(Math.ceil(amount / pipParts))} XAF × ${pipParts}` : ""}
          </span>
          <span className="block text-[15px] text-[#8A8A96]">First payment: 0 XAF</span>
        </span>
        <Chevron size={22} />
      </button>
      )}

      {/* 4. ratings + questions tiles */}
      <div className="grid grid-cols-2 gap-1 mb-1">
        <button onClick={() => scrollToId("reviews")} className="bg-white rounded-[28px] p-4 text-left active:scale-[0.99] transition-transform">
          <span className="flex items-center gap-1.5">
            <StarIcon />
            <span className="text-[20px] font-semibold text-[#1F1F23]">4.8</span>
          </span>
          <span className="block text-[15px] text-[#8A8A96] mt-1">128 ratings</span>
        </button>
        <button onClick={() => scrollToId("reviews")} className="bg-white rounded-[28px] p-4 text-left active:scale-[0.99] transition-transform">
          <span className="flex items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A8A96" strokeWidth="2" aria-hidden><path d="M21 11.5a8.38 8.38 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-4.7a8.38 8.38 0 0 1-1.9-4.8 8.5 8.5 0 0 1 9-8.5 8.38 8.38 0 0 1 9 8.5z"/><text x="11" y="15" fontSize="11" fill="#8A8A96" stroke="none" fontWeight="bold">?</text></svg>
            <span className="text-[20px] font-semibold text-[#1F1F23]">14</span>
          </span>
          <span className="block text-[15px] text-[#8A8A96] mt-1">Questions</span>
        </button>
      </div>

      {/* 5. delivery card */}
      <button onClick={() => openSheet("delivery")} className="w-full bg-white rounded-[28px] p-4 mb-1 text-left active:scale-[0.99] transition-transform">
        <span className="flex items-center justify-between">
          <span className="text-[17px] font-semibold text-[#1F1F23]">Tomorrow</span>
          <span className="flex items-center gap-1 text-[15px] text-[#8A8A96]">Full Terms <Chevron /></span>
        </span>
        <span className="block text-[15px] text-[#8A8A96] mt-0.5">To pickup point or by courier</span>
      </button>

      {/* 6. product info card */}
      <div className="bg-white rounded-[28px] p-4 mb-1">
        <LocalizedClientLink
          href={seller?.handle ? `/sellers/${seller.handle}` : "#"}
          className="h-6 px-2.5 rounded-full bg-[#F0F0F3] inline-flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1F1F23" aria-hidden><path d="M20.6 13.4L11 3.8A2 2 0 0 0 9.6 3H4a1 1 0 0 0-1 1v5.6c0 .5.2 1 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l4.6-4.6a2 2 0 0 0 0-2.6zM6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8z"/></svg>
          <VerifiedBadge />
          <span className="text-[15px] font-medium text-[#1F1F23] uppercase">{brand}</span>
          <Chevron size={14} />
        </LocalizedClientLink>
        <div
          role="button"
          aria-label="About this item"
          onClick={() => openSheet("about")}
          className="cursor-pointer"
        >
          <h1 className="text-[18px] font-semibold text-[#1F1F23] leading-snug mt-2.5 line-clamp-2">
            {product?.title}
          </h1>
          <p className="relative text-[15px] leading-[20px] text-[#8A8A96] mt-1 line-clamp-2">
            {[product?.metadata?.color || "Black", product?.metadata?.gender || "Men", "calf suede", "All-season", "Made in Italy"].join(" · ")}
            <span className="absolute right-0 bottom-0 pl-8 text-[#2563EB] font-medium" style={{ background: "linear-gradient(90deg,transparent,#fff 40%)" }}>
              More
            </span>
          </p>
        </div>

        {/* seller card */}
        <LocalizedClientLink
          href={seller?.handle ? `/sellers/${seller.handle}` : "#"}
          className="mt-4 h-14 rounded-[20px] bg-[#F0F0F3] px-3.5 flex items-center justify-between"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[18px] font-semibold text-[#1F1F23] truncate">
              <VerifiedBadge /> {brand}
            </span>
            <span className="flex items-center gap-1.5 text-[14px] text-[#8A8A96]">
              Seller <StarIcon size={14} /> 4.9
            </span>
          </span>
          <span
            role="button"
            onClick={(e) => { e.preventDefault(); setFollowed(!followed) }}
            className="w-9 h-9 rounded-xl bg-[#E4E4EA] flex items-center justify-center shrink-0"
          >
            <HeartIcon size={20} filled={followed} color="#2563EB" />
          </span>
        </LocalizedClientLink>
      </div>

      {/* 7. you might also like / people also buy */}
      <div id="also-like" className="bg-white rounded-[28px] pt-4 pb-4 mb-1 scroll-mt-20">
        <div className="flex gap-7 px-4">
          {(
            [
              ["like", "You might also like"],
              ["buy", "People also buy"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`text-[19px] font-semibold transition-colors ${tab === k ? "text-[#1F1F23]" : "text-[#8A8A96]"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-4 px-4 mt-4">
          {similarList.length > 0 ? (
            similarList.map((p: any) => (
              <LocalizedClientLink key={p.id} href={`/products/${p.handle}`} className="block">
                <div className="aspect-[3/4] rounded-[16px] overflow-hidden bg-[#F6F6F9]">
                  <img src={p.thumbnail || p.images?.[0]?.url} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <p className="text-[14px] text-[#1F1F23] mt-2 line-clamp-2 leading-snug">{p.title}</p>
              </LocalizedClientLink>
            ))
          ) : (
            <p className="col-span-2 text-[15px] text-[#8A8A96] py-6 text-center">No similar items yet</p>
          )}
        </div>
      </div>

      {/* buy bar */}
      <div
        className="fixed left-0 right-0 z-[45] flex gap-2.5 px-3 pt-2 bg-[#F5F5F7] border-t border-[#E4E4EA]"
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom,0px))" }}
      >
        {outOfStock ? (
          <button disabled className="flex-1 h-[52px] rounded-[14px] bg-[#F0F0F3] text-[#8A8A96] text-[18px] font-semibold">
            Out of stock
          </button>
        ) : (
          <>
            <button onClick={() => buy(true)} disabled={isAddingItem} className="flex-1 h-[52px] rounded-[14px] bg-[#EA580C] text-white text-[19px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-60">
              Buy Now
            </button>
            {added ? (
              <button onClick={() => router.push("/cart")} className="flex-1 h-[52px] rounded-[14px] border-2 border-[#2563EB] text-[#2563EB] text-[19px] font-semibold bg-transparent active:scale-[0.98] transition-transform">
                Go to cart
              </button>
            ) : (
              <button onClick={() => buy(false)} disabled={isAddingItem} className="flex-1 h-[52px] rounded-[14px] bg-[#2563EB] text-white text-[19px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-60">
                Add To Cart
              </button>
            )}
          </>
        )}
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[60] bg-[#1F1F23] text-white text-[15px] font-medium px-5 py-3 rounded-2xl" style={{ bottom: "calc(56px + 8px + 52px + 20px + env(safe-area-inset-bottom,0px))" }}>
          {toast}
        </div>
      )}

      {viewerIdx !== null && (
        <ProductImageViewer
          images={displayImages}
          index={viewerIdx}
          onClose={() => setViewerIdx(null)}
        />
      )}

      {/* bottom sheets */}
      {sheet && (
        <>
          <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={closeSheet} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[56] bg-[#F5F5F7] rounded-t-[24px] max-h-[80vh] flex flex-col overflow-hidden"
            style={{
              transform: sheetClosing ? "translateY(105%)" : `translateY(${dragY}px)`,
              transition:
                dragRef.current == null
                  ? "transform .24s cubic-bezier(.32,.72,0,1)"
                  : "none",
              animation: sheetClosing ? "none" : "sheetUp .28s cubic-bezier(.32,.72,0,1)",
            }}
            onTouchStart={sheetTouchStart}
            onTouchMove={sheetTouchMove}
            onTouchEnd={sheetTouchEnd}
          >
            <div className="pt-3 pb-2 shrink-0 flex justify-center cursor-grab touch-none">
              <div className="w-10 h-1.5 rounded-full bg-[#D4D4DC]" />
            </div>
            <div
              ref={sheetScrollRef}
              className="overflow-y-auto px-5 pb-8 min-h-0 overscroll-contain"
            >
            {sheet === "sizes" && (
              <>
                <h3 className="text-[20px] font-semibold text-[#1F1F23] mb-3">Size chart</h3>
                {sizes.map(([s], i) => (
                  <div key={s} className="flex justify-between py-2.5 border-b border-[#E4E4EA] text-[15px]">
                    <span className="text-[#1F1F23]">EU {s}</span>
                    <span className="text-[#8A8A96]">{(24 + i * 0.7).toFixed(1)} cm</span>
                  </div>
                ))}
              </>
            )}
            {sheet === "delivery" && (
              <>
                <h3 className="text-[20px] font-semibold text-[#1F1F23] mb-3">Delivery terms</h3>
                <p className="text-[15px] text-[#1F1F23]/80 leading-[22px]">
                  Same-day or next-day delivery in Buea to a Hybreed pickup point or by courier.
                  Standard delivery: 1 500 XAF. Free returns within 14 days - try on at pickup
                  before you accept.
                </p>
              </>
            )}
            {sheet === "parts" && (
              <>
                <h3 className="text-[20px] font-semibold text-[#1F1F23] mb-3">Pay in Parts</h3>
                <p className="text-[15px] text-[#1F1F23]/80 leading-[22px]">
                  Split your payment into {pipParts} interest-free parts.
                  {amount != null ? ` That's ${num(Math.ceil(amount / pipParts))} XAF every 2 weeks, first payment 0 XAF at pickup.` : ""}
                </p>
              </>
            )}
            {sheet === "price" && (
              <>
                <h3 className="text-[20px] font-semibold text-[#1F1F23] mb-1">Price breakdown</h3>
                <p className="text-[14px] text-[#8A8A96] mb-4">
                  Prices are shown including your personal discount
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white rounded-[20px] p-4 border-2 border-[#2563EB]">
                    <span className="text-[13px] font-medium text-[#2563EB] uppercase tracking-wide">
                      Hybreed Wallet
                    </span>
                    <p className="text-[20px] font-semibold text-[#1F1F23] mt-1.5">
                      {walletAmount != null ? `${num(walletAmount)} XAF` : "-"}
                    </p>
                    <span className="inline-block mt-2 text-[12px] font-semibold text-white bg-[#2563EB] px-2 py-0.5 rounded-full">
                      −3%
                    </span>
                    {oldAmount && (
                      <p className="text-[13px] text-[#8A8A96] line-through mt-2">
                        {num(oldAmount)} XAF
                      </p>
                    )}
                  </div>
                  <div className="bg-white rounded-[20px] p-4">
                    <span className="text-[13px] font-medium text-[#8A8A96] uppercase tracking-wide">
                      Other payment
                    </span>
                    <p className="text-[20px] font-semibold text-[#1F1F23] mt-1.5">
                      {amount != null ? `${num(amount)} XAF` : "-"}
                    </p>
                    {oldAmount && (
                      <p className="text-[13px] text-[#8A8A96] line-through mt-2">
                        {num(oldAmount)} XAF
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[13px] text-[#8A8A96] mt-3 leading-[18px]">
                  Paying with Hybreed Wallet gives you an extra 3% off your order.
                </p>
              </>
            )}
            {sheet === "about" && (
              <>
                <h3 className="text-[20px] font-semibold text-[#1F1F23] leading-snug">{product?.title}</h3>
                {product?.description && (
                  <p className="text-[15px] leading-[22px] text-[#1F1F23]/80 mt-2 whitespace-pre-line">
                    {product.description}
                  </p>
                )}
                {aboutRows.length > 0 && (
                  <>
                    <h3 className="text-[17px] font-semibold text-[#1F1F23] mt-5">Characteristics</h3>
                    {aboutRows.map(([k, v]) => (
                      <div key={k} className="flex py-2.5 border-b border-[#E4E4EA] last:border-0">
                        <span className="w-[42%] text-[15px] text-[#8A8A96] shrink-0">{k}</span>
                        <span className="w-[58%] text-[15px] text-[#1F1F23]">{v}</span>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
