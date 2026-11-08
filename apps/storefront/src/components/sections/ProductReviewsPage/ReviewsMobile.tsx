"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useCartContext } from "@/components/providers"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import type {
  ProductReview,
  ProductReviewsResponse,
  ReviewMediaItem,
} from "@/lib/data/reviews"

type Variant = { id: string; label: string; offerId: string | null; price?: { amount: number; orig: number | null } | null }
type ProductInfo = { title: string; image: string | null; price: { amount: number; orig: number | null } | null }
type Lang = "en" | "fr"
type Reaction = "like" | "heart" | "clap"

const STAR = "#FFA800"
const BLUE = "#2563EB"

const SORTS: [string, string][] = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["rating_desc", "Highest rating"],
  ["rating_asc", "Lowest rating"],
  ["helpful", "Most helpful"],
  ["with_media", "With photos & videos"],
]

const T = {
  en: { translate: "Translate", original: "Show original", translating: "Translating…" },
  fr: { translate: "Traduire", original: "Voir l'original", translating: "Traduction…" },
}

/* ---------- helpers ---------- */
const deviceId = () => {
  try {
    let id = localStorage.getItem("hb_device")
    if (!id) {
      id = `d${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
      localStorage.setItem("hb_device", id)
    }
    return id
  } catch {
    return ""
  }
}

const api = async (path: string, init?: { method?: "GET" | "POST"; body?: unknown }) => {
  const res = await fetch(`/api/reviews/${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json", "x-hb-device": deviceId() },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

const fmtDate = (r: ProductReview) =>
  r.edited_at
    ? `Amended ${new Date(r.edited_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
    : new Date(r.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

const num = (n: number) => n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")

/* ---------- icons ---------- */
const Back = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A8A96" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="15 18 9 12 15 6" /></svg>
)
const SortIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A8A96" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 20V5M3.5 8.5 7 5l3.5 3.5" /><path d="M17 4v15M13.5 15.5 17 19l3.5-3.5" />
  </svg>
)
const Chevron = ({ s = 22, c = "#B4B4BE" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
)
const Star = ({ s = 24, filled = true }: { s?: number; filled?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
    <path fill={filled ? STAR : "#DCDCE2"} d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z" />
  </svg>
)
const Stars = ({ value, s = 24 }: { value: number; s?: number }) => (
  <span className="inline-flex gap-[2px]">
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} s={s} filled={i <= Math.round(value)} />)}
  </span>
)
const TranslateIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="2" width="12" height="12" rx="3" fill="#1F1F23" />
    <path d="M5 6h6M8 5v1m2 0c-.4 2.6-2.2 4.6-4.6 5.4M6.6 8.4c.6 1.2 1.7 2.2 3.2 2.9" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    <rect x="10" y="10" width="12" height="12" rx="3" fill="#fff" stroke="#1F1F23" strokeWidth="1.6" />
    <path d="M13.6 19.4l2.4-6 2.4 6m-4-1.6h3.2" stroke="#1F1F23" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ThumbIcon = ({ c }: { c: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={c} aria-hidden><path d="M2 10h3.5v11H2zM7.5 21h9.7a2 2 0 0 0 2-1.6l1.6-7.2A2 2 0 0 0 18.8 10H14l.9-4.3a1.6 1.6 0 0 0-.4-1.5L13.6 3.3 7.5 9.6z" /></svg>
)
const HeartIcon = ({ c }: { c: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={c} aria-hidden><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z" /></svg>
)
const ClapIcon = ({ c }: { c: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7.5 12.5 5 10a1.4 1.4 0 0 1 2-2l4 4M9 8.5 7.6 7.1a1.4 1.4 0 0 1 2-2l5.2 5.2M11.5 6.6l-.3-.3a1.4 1.4 0 0 1 2-2l4.9 4.9a6 6 0 0 1 0 8.5l-1 1a6 6 0 0 1-8.5 0L4.4 14.5a1.4 1.4 0 0 1 2-2l2.4 2.4" />
    <path d="M18 3.5 18.8 2M20.6 6l1.4-.8M16 2.6V1" />
  </svg>
)
const WarnIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path fill="#8A8A96" d="M10.3 3.6a2 2 0 0 1 3.4 0l8.1 14a2 2 0 0 1-1.7 3H3.9a2 2 0 0 1-1.7-3z" /><path d="M12 9v4.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /><circle cx="12" cy="16.8" r="1.25" fill="#fff" /></svg>
)
const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path fill="#8A8A96" d="M14 4.5V8C7.5 8.6 4 12.6 3 19c2.4-3.3 5.6-4.9 11-5v3.5l7-6.5z" /></svg>
)
const PlayBadge = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden className="drop-shadow"><path fill="#fff" d="M7 4.5v15l12.5-7.5z" /></svg>
)

/** Gold laurel wreath drawn around a top author's avatar. */
const Laurel = () => {
  const leaves = (side: 1 | -1) =>
    Array.from({ length: 6 }).map((_, i) => {
      const a = (200 + i * 26) * (Math.PI / 180)
      const cx = 30 + side * Math.cos(a) * -25
      const cy = 31 - Math.sin(a) * -25
      const rot = side * (i * 26 + 20)
      return <ellipse key={`${side}${i}`} cx={cx} cy={cy} rx="3.4" ry="6.6" transform={`rotate(${rot} ${cx} ${cy})`} fill="url(#hbLaurel)" />
    })
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="absolute inset-0" aria-hidden>
      <defs>
        <linearGradient id="hbLaurel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8D778" />
          <stop offset="1" stopColor="#C88A1C" />
        </linearGradient>
      </defs>
      {leaves(1)}
      {leaves(-1)}
    </svg>
  )
}

/* ---------- sheet ---------- */
const Sheet = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) => {
  useBodyScrollLock(open)
  if (!open) return null
  return (
    <>
      <style>{`@keyframes rvUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[71] bg-white rounded-t-[24px] px-4 pt-3 max-h-[80vh] overflow-y-auto overscroll-contain md:max-w-[520px] md:mx-auto"
        style={{ animation: "rvUp .26s cubic-bezier(.32,.72,0,1)", paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
      >
        <div className="flex justify-center pb-3"><div className="w-10 h-1.5 rounded-full bg-[#D4D4DC]" /></div>
        {children}
      </div>
    </>
  )
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

type FeedProduct = { title: string; image: string | null; price: { amount: number; orig: number | null } | null }

const fmtPrice = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} F`

const RailBtn = ({ children, label, onClick, badge }: { children: React.ReactNode; label: string; onClick: () => void; badge?: number }) => (
  <button aria-label={label} onClick={onClick} className="flex flex-col items-center gap-1.5">
    <span className="w-11 h-11 flex items-center justify-center active:scale-90 transition-transform">{children}</span>
    {badge != null && badge > 0 && <span className="text-[14px] font-semibold text-white/95 tabular-nums">{badge}</span>}
  </button>
)

const LaurelSmall = () => (
  <svg width="34" height="34" viewBox="0 0 60 60" className="absolute -top-3 left-1/2 -translate-x-1/2" aria-hidden>
    <defs>
      <linearGradient id="hbLaurelS" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F8D778" />
        <stop offset="1" stopColor="#C88A1C" />
      </linearGradient>
    </defs>
    {[1, -1].map((side) =>
      Array.from({ length: 5 }).map((_, k) => {
        const a = (205 + k * 28) * (Math.PI / 180)
        const cx = 30 + side * Math.cos(a) * -25
        const cy = 31 - Math.sin(a) * -25
        return <ellipse key={`${side}${k}`} cx={cx} cy={cy} rx="3" ry="6" transform={`rotate(${side * (k * 28 + 20)} ${cx} ${cy})`} fill="url(#hbLaurelS)" />
      })
    )}
  </svg>
)

/** Full-screen vertical review media feed (TikTok Shop style). */
const MediaViewer = ({
  items,
  start,
  onClose,
  product,
  handle,
  onReact,
  onFollow,
  onShare,
  onReport,
}: {
  items: ReviewMediaItem[]
  start: number
  onClose: () => void
  product: FeedProduct
  handle: string
  onReact: (reviewId: string) => void
  onFollow: (review: NonNullable<ReviewMediaItem["review"]>) => void
  onShare: (review: NonNullable<ReviewMediaItem["review"]>, text: string) => void
  onReport: (reviewId: string) => void
}) => {
  useBodyScrollLock(true)
  const router = useRouter()
  const scroller = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(start)
  const [liked, setLiked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.filter((m) => m.review?.reactions.liked).map((m) => [m.review_id, true]))
  )
  const [extra, setExtra] = useState<Record<string, number>>({})
  const [following, setFollowing] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.filter((m) => m.review?.following).map((m) => [m.review_id, true]))
  )
  const [muted, setMuted] = useState<Record<string, boolean>>({})
  const [paused, setPaused] = useState<Record<string, boolean>>({})
  const [added, setAdded] = useState(false)
  const tapStart = useRef<{ x: number; y: number; t: number } | null>(null)
  const last = items.length - 1

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = start * el.clientHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cur = items[idx]
  const rv = cur?.review ?? null

  const toggleLike = (m: ReviewMediaItem, on: boolean) => {
    setLiked((s) => ({ ...s, [m.review_id]: on }))
    setExtra((s) => ({ ...s, [m.review_id]: (s[m.review_id] ?? 0) + (on ? 1 : -1) }))
    onReact(m.review_id)
  }
  const like = () => {
    if (!rv) return
    toggleLike(cur, !liked[cur.review_id])
  }

  const likeCount = (m: ReviewMediaItem) => (m.review?.reactions.like ?? 0) + (extra[m.review_id] ?? 0)

  const follow = () => {
    if (!rv) return
    const on = !!following[cur.review_id]
    setFollowing((s) => ({ ...s, [cur.review_id]: !on }))
    onFollow(rv)
  }

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    onClose()
  }

  const openProduct = () => {
    onClose()
    router.push(`/products/${handle}`)
  }

  // tap on media toggles play/pause; a real swipe scrolls instead
  const onMediaDown = (e: React.PointerEvent) => {
    tapStart.current = { x: e.clientX, y: e.clientY, t: Date.now() }
  }
  const onMediaUp = (e: React.PointerEvent, id: string) => {
    const st = tapStart.current
    tapStart.current = null
    if (!st) return
    if (Math.hypot(e.clientX - st.x, e.clientY - st.y) > 12 || Date.now() - st.t > 400) return
    if (items.find((m) => m.id === id)?.type !== "video") return
    setPaused((s) => ({ ...s, [id]: !s[id] }))
  }

  const railIcon = "rgba(255,255,255,0.95)"

  return (
    <div className="fixed inset-0 z-[80] bg-black md:left-1/2 md:right-auto md:w-[520px] md:-translate-x-1/2">
      {/* header */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ top: "max(56px, calc(env(safe-area-inset-top) + 20px))" }}>
        <div className="absolute left-6 top-0">
          <button aria-label="Back" onClick={onClose} className="pointer-events-auto w-11 h-11 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[-36px] h-[42px] min-w-[150px] px-6 rounded-full flex items-center justify-center"
          style={{ background: BLUE }}
        >
          <span className="text-white text-[16px] font-bold tracking-tight">Hybreed</span>
        </div>
      </div>

      {/* vertical feed */}
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget
          setIdx(clamp(Math.round(el.scrollTop / el.clientHeight), 0, last))
        }}
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{ overscrollBehavior: "contain" }}
      >
        {items.map((m, i) => {
          const r = m.review ?? null
          const isMuted = !!muted[m.id]
          const isPaused = !!paused[m.id]
          const isLiked = !!liked[m.review_id]
          const total = likeCount(m)
          return (
            <div key={m.id} className="h-full w-full snap-start snap-always" style={{ padding: "80px 16px 60px" }}>
              <div
                className="relative h-full w-full rounded-[32px] overflow-hidden bg-black"
                onPointerDown={onMediaDown}
                onPointerUp={(e) => onMediaUp(e, m.id)}
              >
                {m.type === "video" ? (
                  <video
                    src={m.url}
                    poster={m.thumbnail_url ?? undefined}
                    controls={false}
                    autoPlay={i === idx && !isPaused}
                    muted={isMuted}
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
                )}

                {/* bottom gradient */}
                <div
                  className="absolute left-0 right-0 bottom-0 h-[280px] pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))" }}
                />

                {/* right action bar */}
                <div className="absolute right-[18px] bottom-[240px] flex flex-col items-center gap-7 z-10">
                  {r && (
                    <RailBtn label="Like review" onClick={() => { if (i !== idx) setIdx(i); like() }} badge={total}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill={isLiked ? "#FA1F4B" : "none"} stroke={isLiked ? "#FA1F4B" : railIcon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 22V11L11.5 2.8c.6-.9 1.9-.4 1.9.7v5.5h5.6a2 2 0 0 1 2 2.4l-1.3 6.5a2 2 0 0 1-2 1.6H7z" />
                        <path d="M7 11H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" />
                      </svg>
                    </RailBtn>
                  )}
                  <RailBtn label="Report review" onClick={() => r && onReport(m.review_id)}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={railIcon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2.5 20h19z" /><line x1="12" y1="10" x2="12" y2="14" /><circle cx="12" cy="17" r="0.6" fill={railIcon} /></svg>
                  </RailBtn>
                  <RailBtn label="Share review" onClick={() => r && onShare(r, m.url)}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={railIcon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12 14 5v4c-5 0-8 3-10 8 2-4 5-5 10-5v4z" /></svg>
                  </RailBtn>
                  <RailBtn label={isMuted ? "Unmute" : "Sound"} onClick={() => setMuted((s) => ({ ...s, [m.id]: !isMuted }))}>
                    {isMuted ? (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={railIcon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><line x1="16" y1="9" x2="22" y2="15" /><line x1="22" y1="9" x2="16" y2="15" /></svg>
                    ) : (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={railIcon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
                    )}
                  </RailBtn>
                </div>

                {/* creator + review + product */}
                {r && (
                  <div className="absolute left-5 right-20 bottom-[170px] z-10 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="relative w-11 h-11 rounded-full bg-[#2A2A33] flex items-center justify-center text-white text-[16px] font-semibold shrink-0 overflow-visible">
                        {r.author.top && <LaurelSmall />}
                        {r.author.initial}
                      </span>
                      <span className="text-white text-[18px] font-semibold truncate">{r.author.name}</span>
                      {!r.is_own && (
                        <button
                          onClick={follow}
                          className="ml-auto shrink-0 text-white text-[16px] font-semibold"
                        >
                          {following[cur.review_id] ? "Subscribed" : "Subscribe"}
                        </button>
                      )}
                    </div>
                    <div className="text-white">
                      <p className="text-[22px] font-bold leading-[1.2] line-clamp-2">
                        <span className="text-[#FFD34D]">★</span> {r.rating}
                        {r.text ? ` • ${r.text}` : ""}
                      </p>
                    </div>

                    {/* product card */}
                    <div className="absolute left-0 right-0" style={{ bottom: -158 }}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={openProduct}
                        onKeyDown={(e) => e.key === "Enter" && openProduct()}
                        className="w-full h-[84px] rounded-[22px] flex items-center overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                        style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(18px)", marginLeft: 12, marginRight: 12, width: "calc(100% - 24px)" }}
                      >
                        {product.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt="" className="w-14 h-14 rounded-[12px] object-cover shrink-0 ml-3" />
                        )}
                        <span className="flex-1 min-w-0 px-3">
                          <span className="flex items-baseline gap-1.5">
                            {product.price && <span className="text-[18px] font-bold text-white">{fmtPrice(product.price.amount)}</span>}
                            {product.price?.orig != null && product.price.orig > product.price.amount && (
                              <>
                                <span className="text-[13px] text-white/50 line-through">{fmtPrice(product.price.orig)}</span>
                                <span className="text-[12px] font-semibold text-white">-{Math.round((1 - product.price.amount / product.price.orig) * 100)}%</span>
                              </>
                            )}
                          </span>
                          <span className="block text-[16px] text-white truncate">{product.title}</span>
                        </span>
                        <button
                          aria-label="Add to cart"
                          onClick={addToCart}
                          className="shrink-0 w-[60px] h-[60px] rounded-[18px] flex items-center justify-center mr-3"
                          style={{ background: added ? "#16A34A" : BLUE }}
                        >
                          {added ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 12.5 10 17 19 7" /></svg>
                          ) : (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.5 12.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6" /></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const MediaThumb = ({ m, className, onClick }: { m: ReviewMediaItem; className: string; onClick: () => void }) => (
  <button onClick={onClick} className={`relative shrink-0 overflow-hidden bg-[#F0F0F3] ${className}`}>
    {m.type === "video" ? (
      m.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.thumbnail_url} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <video src={`${m.url}#t=0.5`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
      )
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.url} alt="" loading="lazy" className="w-full h-full object-cover" />
    )}
    {m.type === "video" && <span className="absolute right-2 bottom-2"><PlayBadge /></span>}
  </button>
)

/* ---------- page ---------- */
export const ReviewsMobile = ({
  productId,
  handle,
  locale,
  initial,
  variants,
  initialVariantId,
  product: productInfo,
}: {
  productId: string
  handle: string
  locale: string
  initial: ProductReviewsResponse
  variants: Variant[]
  initialVariantId: string | null
  product: ProductInfo
}) => {
  const router = useRouter()
  const { addToCart, isAddingItem } = useCartContext() as any

  const [lang, setLang] = useState<Lang>("en")
  const [tab, setTab] = useState<"all" | "option">("all")
  const [variantId, setVariantId] = useState<string | null>(initialVariantId)
  const [sort, setSort] = useState("newest")
  const [list, setList] = useState<ProductReview[]>(initial.reviews)
  const [count, setCount] = useState(initial.count)
  const [strip, setStrip] = useState<ReviewMediaItem[]>(initial.media)
  const [mediaCount, setMediaCount] = useState(initial.media_count)
  const [loading, setLoading] = useState(false)
  const [sheet, setSheet] = useState<null | "sort" | "dist" | "variant" | "variant-cart" | "media">(null)
  const [reportFor, setReportFor] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ items: ReviewMediaItem[]; start: number } | null>(null)
  const [translated, setTranslated] = useState<Record<string, { text?: string; on: boolean; busy?: boolean }>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const reqId = useRef(0)

  const summary = initial.summary
  const activeVariant = variants.find((v) => v.id === variantId) ?? null

  useEffect(() => {
    setLang((navigator.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en")
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const load = useCallback(
    async (opts: { reset: boolean; tab: "all" | "option"; variantId: string | null; sort: string; offset: number }) => {
      const id = ++reqId.current
      setLoading(true)
      const qs = new URLSearchParams({ sort: opts.sort, limit: "10", offset: String(opts.offset) })
      if (opts.tab === "option" && opts.variantId) qs.set("variant_id", opts.variantId)
      const { ok, data } = await api(`product-reviews/${productId}?${qs}`)
      if (id !== reqId.current) return
      setLoading(false)
      if (!ok) return
      setCount(data.count ?? 0)
      setStrip(data.media ?? [])
      setMediaCount(data.media_count ?? 0)
      setList((prev) => (opts.reset ? data.reviews ?? [] : [...prev, ...(data.reviews ?? [])]))
    },
    [productId]
  )

  // refresh once on mount so viewer state (reactions by this device) is included
  useEffect(() => {
    load({ reset: true, tab, variantId, sort, offset: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reload = (next: Partial<{ tab: "all" | "option"; variantId: string | null; sort: string }>) => {
    const o = { tab, variantId, sort, ...next }
    window.scrollTo({ top: 0, behavior: "smooth" })
    load({ reset: true, ...o, offset: 0 })
  }

  // infinite scroll
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loading && list.length < count) {
        load({ reset: false, tab, variantId, sort, offset: list.length })
      }
    }, { rootMargin: "400px" })
    io.observe(el)
    return () => io.disconnect()
  }, [list.length, count, loading, tab, variantId, sort, load])

  const patch = (id: string, fn: (r: ProductReview) => ProductReview) =>
    setList((prev) => prev.map((r) => (r.id === id ? fn(r) : r)))

  const react = async (r: ProductReview, type: Reaction) => {
    const on = r.mine.includes(type)
    patch(r.id, (x) => ({
      ...x,
      mine: on ? x.mine.filter((t) => t !== type) : [...x.mine, type],
      reactions: { ...x.reactions, [type]: Math.max(0, x.reactions[type] + (on ? -1 : 1)) },
    }))
    const { ok, data } = await api(`review-actions/${r.id}/reactions`, { method: "POST", body: { type } })
    if (ok) patch(r.id, (x) => ({ ...x, reactions: data.reactions, mine: data.mine }))
  }

  const follow = async (r: ProductReview) => {
    if (!r.author.id) return
    const { ok, status, data } = await api(`review-authors/${r.author.id}/follow`, { method: "POST", body: {} })
    if (status === 401) {
      setToast("Sign in to subscribe")
      return
    }
    if (!ok) return setToast(data?.message || "Something went wrong")
    setList((prev) => prev.map((x) => (x.author.id === r.author.id ? { ...x, following: data.following } : x)))
    setToast(data.following ? `Subscribed to ${r.author.name}` : `Unsubscribed from ${r.author.name}`)
  }

  const translate = async (r: ProductReview) => {
    const cur = translated[r.id]
    if (cur?.text) return setTranslated((s) => ({ ...s, [r.id]: { ...cur, on: !cur.on } }))
    setTranslated((s) => ({ ...s, [r.id]: { on: false, busy: true } }))
    const { ok, data } = await api(`review-actions/${r.id}/translate`, { method: "POST", body: { target: lang } })
    if (!ok || !data?.text) {
      setTranslated((s) => ({ ...s, [r.id]: { on: false } }))
      return setToast("Translation unavailable, try again")
    }
    setTranslated((s) => ({ ...s, [r.id]: { text: data.text, on: true } }))
  }

  const share = async (r: ProductReview) => {
    const url = `${window.location.origin}${window.location.pathname}#${r.id}`
    try {
      if (navigator.share) await navigator.share({ title: "Hybreed review", text: r.text.slice(0, 120), url })
      else {
        await navigator.clipboard.writeText(url)
        setToast("Link copied")
      }
    } catch {}
  }

  const report = async (reason: string) => {
    const id = reportFor
    setReportFor(null)
    if (!id) return
    const { ok } = await api(`review-actions/${id}/report`, { method: "POST", body: { reason } })
    setToast(ok ? "Thanks, we'll look into it" : "Couldn't send the report")
  }

  const viewerProduct: FeedProduct = {
    title: productInfo.title,
    image: productInfo.image,
    price: activeVariant?.price ?? productInfo.price,
  }

  const viewerReact = (reviewId: string) => {
    const r = list.find((x) => x.id === reviewId)
    if (r) react(r, "like")
  }

  const viewerFollow = (rv: NonNullable<ReviewMediaItem["review"]>) => {
    const r = list.find((x) => x.id === rv.review_id)
    if (r) return follow(r)
    const authorId = rv.author.id
    if (!authorId) return
    api(`review-authors/${authorId}/follow`, { method: "POST", body: {} }).then(({ ok, data }) => {
      if (!ok) return setToast(data?.message || "Something went wrong")
      setToast(data.following ? `Subscribed to ${rv.author.name}` : `Unsubscribed from ${rv.author.name}`)
    })
  }

  const viewerShare = (rv: NonNullable<ReviewMediaItem["review"]>) => {
    const r = list.find((x) => x.id === rv.review_id)
    if (r) return share(r)
    const url = `${window.location.origin}${window.location.pathname}#${rv.review_id}`
    navigator.clipboard?.writeText(url).then(() => setToast("Link copied")).catch(() => {})
  }

  const viewerReport = (reviewId: string) => setReportFor(reviewId)

  const cartVariant = activeVariant ?? (variants.length === 1 ? variants[0] : null)
  const toCart = async (v: Variant | null = cartVariant) => {
    if (added) return router.push("/cart")
    if (!v) return setSheet("variant-cart")
    if (!v.offerId) return setToast("This option is out of stock")
    await addToCart({ offerId: v.offerId, quantity: 1, countryCode: locale })
    setAdded(true)
    setToast("Added to cart")
  }

  const pickVariant = (v: Variant) => {
    const mode = sheet
    setSheet(null)
    setVariantId(v.id)
    if (mode === "variant-cart") return toCart(v)
    setTab("option")
    reload({ tab: "option", variantId: v.id })
  }

  const maxDist = useMemo(() => Math.max(1, ...Object.values(summary.distribution)), [summary])

  return (
    <div className="min-h-screen bg-[#F2F2F5] pb-[170px]">
      {/* header */}
      <div className="sticky top-0 z-30 bg-white" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="h-[52px] flex items-center justify-between px-2">
          <button aria-label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push(`/products/${handle}`))} className="w-11 h-11 flex items-center justify-center">
            <Back />
          </button>
          <h1 className="text-[19px] font-semibold text-[#1F1F23]">
            Reviews <span className="text-[#8A8A96] font-medium">{summary.count}</span>
          </h1>
          <button aria-label="Sort reviews" onClick={() => setSheet("sort")} className="w-11 h-11 flex items-center justify-center">
            <SortIcon />
          </button>
        </div>
      </div>

      {/* rating summary */}
      <button onClick={() => setSheet("dist")} className="w-full bg-white rounded-b-[24px] px-4 pt-1 pb-4 flex items-center gap-4 text-left">
        <span className="text-[52px] leading-none font-bold text-[#1F1F23] tracking-tight">
          {summary.average != null ? summary.average.toFixed(1) : "–"}
        </span>
        <span className="flex-1 min-w-0">
          <Stars value={summary.average ?? 0} s={26} />
          <span className="block text-[17px] text-[#8A8A96] mt-0.5">Customer opinion</span>
        </span>
        <Chevron />
      </button>

      {/* tabs + media strip */}
      <div className="bg-white rounded-[24px] mt-2 pt-3 pb-4">
        <div className="mx-4 p-1 rounded-[14px] bg-[#F0F0F3] grid grid-cols-2">
          {(["all", "option"] as const).map((k) => (
            <button
              key={k}
              onClick={() => {
                if (k === "option" && !variantId) return setSheet("variant")
                if (k === tab) return
                setTab(k)
                reload({ tab: k })
              }}
              className={`h-[42px] rounded-[11px] text-[17px] transition-colors ${tab === k ? "text-white font-medium" : "text-[#6B6B76]"}`}
              style={tab === k ? { background: BLUE } : undefined}
            >
              {k === "all" ? "All reviews" : "This option"}
            </button>
          ))}
        </div>
        {tab === "option" && activeVariant && (
          <button onClick={() => setSheet("variant")} className="mx-4 mt-2 text-[14px] text-[#8A8A96] flex items-center gap-1">
            <span className="truncate">{activeVariant.label}</span>
            <span className="shrink-0 font-medium" style={{ color: BLUE }}>Change</span>
          </button>
        )}

        {strip.length > 0 && (
          <>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-4 mt-3">
              {strip.map((m, i) => (
                <MediaThumb key={m.id} m={m} className="w-[96px] h-[116px] rounded-[14px]" onClick={() => setLightbox({ items: strip, start: i })} />
              ))}
            </div>
            <button onClick={() => setSheet("media")} className="px-4 mt-3 text-[17px] font-medium" style={{ color: BLUE }}>
              View all{mediaCount > strip.length ? ` ${mediaCount}` : ""}
            </button>
          </>
        )}
      </div>

      {/* review cards */}
      {list.length === 0 && !loading && (
        <div className="bg-white rounded-[24px] mt-2 px-4 py-10 text-center">
          <p className="text-[17px] font-semibold text-[#1F1F23]">No reviews yet</p>
          <p className="text-[15px] text-[#8A8A96] mt-1">
            {tab === "option" ? "Nobody has reviewed this option yet." : "Reviews from buyers will appear here."}
          </p>
        </div>
      )}

      {list.map((r) => {
        const tr = translated[r.id]
        const showTranslate = r.text && r.language !== lang
        const n = r.media.length
        const tileW = n === 1 ? "w-full" : n === 2 ? "w-[calc(50%-3px)]" : "w-[calc(33.333%-4px)]"
        return (
          <article key={r.id} id={r.id} className="bg-white rounded-[24px] mt-2 px-4 pt-4 pb-4 scroll-mt-16">
            <div className="flex items-center gap-2.5">
              <Stars value={r.rating} s={24} />
              <span className="text-[16px] text-[#8A8A96]">{fmtDate(r)}</span>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <span className={`relative shrink-0 flex items-center justify-center ${r.author.top ? "w-[60px] h-[60px]" : "w-[46px] h-[46px]"}`}>
                {r.author.top && <Laurel />}
                <span className={`rounded-full bg-[#E9E9EE] text-[#6B6B76] flex items-center justify-center font-semibold ${r.author.top ? "w-[40px] h-[40px] text-[16px]" : "w-[46px] h-[46px] text-[18px]"}`}>
                  {r.author.initial}
                </span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-0.5">
                  <span className="text-[18px] font-semibold text-[#1F1F23] truncate">{r.author.name}</span>
                  <Chevron s={18} />
                </span>
                <span className="block text-[16px] text-[#8A8A96] leading-tight">{r.author.label}</span>
              </span>
              {!r.is_own && r.author.id && (
                <button
                  onClick={() => follow(r)}
                  className={`shrink-0 h-[42px] px-4 rounded-[14px] text-[16px] font-semibold ${r.following ? "bg-[#F0F0F3] text-[#6B6B76]" : "bg-[#EAF2FF]"}`}
                  style={r.following ? undefined : { color: BLUE }}
                >
                  {r.following ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>

            {r.variant_label && (
              <p className="text-[16px] leading-[22px] text-[#8A8A96] mt-3">
                Product variant <span style={{ color: BLUE }}>{r.variant_label}</span>
              </p>
            )}

            {showTranslate && (
              <button
                onClick={() => translate(r)}
                disabled={tr?.busy}
                className="w-full h-[50px] rounded-[14px] bg-[#F0F0F3] mt-3 flex items-center justify-center gap-2.5 active:scale-[0.99] transition-transform disabled:opacity-70"
              >
                <TranslateIcon />
                <span className="text-[17px] font-semibold text-[#1F1F23]">
                  {tr?.busy ? T[lang].translating : tr?.on ? T[lang].original : T[lang].translate}
                </span>
              </button>
            )}

            {r.text && (
              <>
                <p className="text-[16px] font-semibold text-[#1F1F23] mt-4">Comment</p>
                <p className="text-[16px] leading-[23px] text-[#1F1F23] mt-1.5 whitespace-pre-line">
                  {tr?.on && tr.text ? tr.text : r.text}
                </p>
              </>
            )}

            {r.seller_note && (
              <div className="mt-3 rounded-[14px] bg-[#F6F6F9] px-3 py-2.5">
                <p className="text-[14px] font-semibold text-[#1F1F23]">Seller&apos;s response</p>
                <p className="text-[15px] leading-[21px] text-[#1F1F23]/80 mt-0.5">{r.seller_note}</p>
              </div>
            )}

            {n > 0 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mt-4">
                {r.media.map((m, i) => (
                  <MediaThumb key={m.id} m={m} className={`${tileW} h-[200px] rounded-[16px]`} onClick={() => setLightbox({ items: r.media, start: i })} />
                ))}
              </div>
            )}

            <p className="text-[16px] text-[#8A8A96] mt-4">How do you like the review?</p>
            <div className="flex items-center gap-2 mt-2">
              {([
                ["like", ThumbIcon, BLUE],
                ["heart", HeartIcon, "#FA1F4B"],
                ["clap", ClapIcon, "#F59E0B"],
              ] as const).map(([type, Icon, color]) => {
                const on = r.mine.includes(type)
                return (
                  <button
                    key={type}
                    aria-label={type}
                    aria-pressed={on}
                    onClick={() => react(r, type)}
                    className="h-[44px] min-w-[64px] px-3.5 rounded-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    style={{ background: on ? `${color}1A` : "#F0F0F3" }}
                  >
                    <Icon c={on ? color : "#8A8A96"} />
                    <span className="text-[17px] font-semibold" style={{ color: on ? color : "#1F1F23" }}>{r.reactions[type]}</span>
                  </button>
                )
              })}
              <span className="flex-1" />
              <button aria-label="Report review" onClick={() => setReportFor(r.id)} className="w-[44px] h-[44px] rounded-[14px] bg-[#F0F0F3] flex items-center justify-center">
                <WarnIcon />
              </button>
              <button aria-label="Share review" onClick={() => share(r)} className="w-[44px] h-[44px] rounded-[14px] bg-[#F0F0F3] flex items-center justify-center">
                <ShareIcon />
              </button>
            </div>
          </article>
        )
      })}

      <div ref={sentinel} className="h-1" />
      {loading && <p className="text-center text-[14px] text-[#8A8A96] py-4">Loading…</p>}

      {/* sticky to cart */}
      <div
        className="fixed left-0 right-0 z-[45] px-3 pt-2 pb-2 bg-[#F2F2F5]/95 backdrop-blur md:max-w-[520px] md:mx-auto"
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom,0px))" }}
      >
        <button
          onClick={() => toCart()}
          disabled={isAddingItem}
          className="w-full h-[64px] rounded-[20px] text-white flex flex-col items-center justify-center active:scale-[0.99] transition-transform disabled:opacity-70"
          style={{ background: BLUE }}
        >
          <span className="text-[19px] font-semibold leading-tight">{added ? "Go to cart" : "To cart"}</span>
          <span className="text-[16px] leading-tight opacity-90">We will deliver it tomorrow</span>
        </button>
      </div>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[90] bg-[#1F1F23] text-white text-[15px] font-medium px-5 py-3 rounded-2xl whitespace-nowrap" style={{ bottom: "calc(56px + 92px + env(safe-area-inset-bottom,0px))" }}>
          {toast}
        </div>
      )}

      {/* sheets */}
      <Sheet open={sheet === "sort"} onClose={() => setSheet(null)}>
        <h3 className="text-[20px] font-semibold text-[#1F1F23] mb-2">Sort reviews</h3>
        {SORTS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => {
              setSheet(null)
              setSort(k)
              reload({ sort: k })
            }}
            className="w-full h-[52px] flex items-center justify-between text-[17px] text-[#1F1F23] border-b border-[#F0F0F3] last:border-0"
          >
            {label}
            {sort === k && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 12.5 10 17 19 7" /></svg>
            )}
          </button>
        ))}
      </Sheet>

      <Sheet open={sheet === "dist"} onClose={() => setSheet(null)}>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[44px] leading-none font-bold text-[#1F1F23]">{summary.average != null ? summary.average.toFixed(1) : "–"}</span>
          <span>
            <Stars value={summary.average ?? 0} s={22} />
            <span className="block text-[15px] text-[#8A8A96] mt-0.5">{num(summary.count)} {summary.count === 1 ? "review" : "reviews"}</span>
          </span>
        </div>
        {["5", "4", "3", "2", "1"].map((k) => (
          <div key={k} className="flex items-center gap-3 h-8">
            <span className="w-4 text-[15px] text-[#1F1F23]">{k}</span>
            <Star s={16} />
            <span className="flex-1 h-2 rounded-full bg-[#F0F0F3] overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${(summary.distribution[k] / maxDist) * 100}%`, background: STAR }} />
            </span>
            <span className="w-8 text-right text-[14px] text-[#8A8A96]">{summary.distribution[k]}</span>
          </div>
        ))}
      </Sheet>

      <Sheet open={sheet === "variant" || sheet === "variant-cart"} onClose={() => setSheet(null)}>
        <h3 className="text-[20px] font-semibold text-[#1F1F23] mb-2">{sheet === "variant-cart" ? "Choose an option" : "Reviews for which option?"}</h3>
        {variants.map((v) => (
          <button key={v.id} onClick={() => pickVariant(v)} className="w-full min-h-[52px] py-2 flex items-center justify-between text-left text-[17px] text-[#1F1F23] border-b border-[#F0F0F3] last:border-0">
            <span>{v.label}</span>
            {v.id === variantId && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 12.5 10 17 19 7" /></svg>
            )}
          </button>
        ))}
      </Sheet>

      <Sheet open={!!reportFor} onClose={() => setReportFor(null)}>
        <h3 className="text-[20px] font-semibold text-[#1F1F23] mb-2">Report review</h3>
        {["Spam or advertising", "Offensive language", "Not about this product", "Fake review", "Other"].map((reason) => (
          <button key={reason} onClick={() => report(reason)} className="w-full h-[52px] text-left text-[17px] text-[#1F1F23] border-b border-[#F0F0F3] last:border-0">
            {reason}
          </button>
        ))}
      </Sheet>

      <Sheet open={sheet === "media"} onClose={() => setSheet(null)}>
        <h3 className="text-[20px] font-semibold text-[#1F1F23] mb-3">Photos & videos</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {strip.map((m, i) => (
            <MediaThumb key={m.id} m={m} className="w-full aspect-[4/5] rounded-[12px]" onClick={() => { setSheet(null); setLightbox({ items: strip, start: i }) }} />
          ))}
        </div>
      </Sheet>

      {lightbox && (
        <MediaViewer
          items={lightbox.items}
          start={lightbox.start}
          onClose={() => setLightbox(null)}
          product={viewerProduct}
          handle={handle}
          onReact={viewerReact}
          onFollow={viewerFollow}
          onShare={viewerShare}
          onReport={viewerReport}
        />
      )}
    </div>
  )
}
