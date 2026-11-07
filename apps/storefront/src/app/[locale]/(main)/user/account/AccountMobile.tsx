"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { HbMark } from "@/components/atoms"
import { toast } from "@/lib/helpers/toast"

/* ---------- icons ---------- */
const BackChevron = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const Chevron = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const UserSilhouette = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
const CardIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="5" width="20" height="14" rx="2.5" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="10" y2="15" />
  </svg>
)
const GearIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
  </svg>
)
const DotsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--muted)" aria-hidden>
    <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
  </svg>
)
const Star = ({ filled, size = 32 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke={filled ? "#F59E0B" : "var(--locked)"} strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
    <path d="M12 2l3 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l7-1z" />
  </svg>
)

/* ---------- placeholder achievement art ---------- */
const AchievementArt = ({ kind, locked }: { kind: string; locked?: boolean }) => {
  const c = locked ? "var(--locked)" : "#2563EB"
  const c2 = locked ? "var(--locked)" : "#3B82F6"
  if (kind === "trophy")
    return (
      <svg width="70" height="70" viewBox="0 0 70 70" aria-hidden>
        <path d="M22 14h26v10a13 13 0 0 1-26 0z" fill={c} />
        <path d="M22 17h-8a8 8 0 0 0 8 10M48 17h8a8 8 0 0 1-8 10" stroke={c2} strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="30" y="38" width="10" height="8" fill={c2} />
        <rect x="24" y="46" width="22" height="6" rx="3" fill={c} />
        <circle cx="35" cy="22" r="5" fill={locked ? "var(--tile)" : "#DBEAFE"} />
      </svg>
    )
  if (kind === "gift")
    return (
      <svg width="70" height="70" viewBox="0 0 70 70" aria-hidden>
        <rect x="14" y="28" width="42" height="28" rx="6" fill={c} />
        <rect x="14" y="28" width="42" height="8" rx="4" fill={c2} />
        <rect x="32" y="28" width="6" height="28" fill={locked ? "var(--tile)" : "#DBEAFE"} />
        <path d="M35 28c-6 0-9-4-7-8 2-3 7-2 7 4 0-6 5-7 7-4 2 4-1 8-7 8z" fill={c2} />
      </svg>
    )
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" aria-hidden>
      <path d="M35 10l7.6 15.9 17.4 2.4-12.7 12.2 3.1 17.3L35 49.4 19.6 57.8l3.1-17.3L10 28.3l17.4-2.4z" fill={c} />
      <circle cx="35" cy="35" r="8" fill={locked ? "var(--tile)" : "#DBEAFE"} />
    </svg>
  )
}

/* ---------- placeholder achievements (no backend yet) ---------- */
const ACHIEVEMENTS = [
  { id: "friend", name: "Hybreed Friend", kind: "star", level: 2, progress: 65, desc: "Earned for inviting friends to Hybreed. Level up by inviting more." },
  { id: "sport", name: "Sports Legend", kind: "trophy", level: 1, progress: 30, desc: "Earned for purchases in sports categories." },
  { id: "expert", name: "Expert", kind: "gift", level: 0, progress: 0, desc: "Earned for helpful product reviews." },
]

type ReviewItem = {
  id: string
  orderId: string
  title: string
  seller: string
  thumbnail: string | null
  deliveredAt: string
}

export const AccountMobile = ({
  name,
  phone,
  email,
  reviewItems,
}: {
  name: string
  phone: string
  email: string
  reviewItems: ReviewItem[]
}) => {
  const router = useRouter()
  const { locale } = useParams() as { locale?: string }
  const [items, setItems] = useState(reviewItems)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [sheet, setSheet] = useState<"menu" | "review" | "achievement" | null>(null)
  const [activeItem, setActiveItem] = useState<ReviewItem | null>(null)
  const [activeAchievement, setActiveAchievement] = useState<(typeof ACHIEVEMENTS)[number] | null>(null)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // Mobile-only page: bounce desktop to the profile page.
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      router.replace(`/${locale || "de"}/user`)
    }
  }, [router, locale])

  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push(`/${locale || "de"}/user`)
  }

  const openReview = (item: ReviewItem, stars = 0) => {
    setActiveItem(item)
    setRating(stars)
    setReviewText("")
    setSheet("review")
  }

  const visibleItems = items.filter((i) => !hidden.has(i.id))

  const submitReview = () => {
    // No reviews backend yet - this removes the card client-side only.
    if (activeItem) setHidden((s) => new Set(s).add(activeItem.id))
    setSheet(null)
    toast.success?.({ title: "Thanks for your review" } as never) ??
      toast({ title: "Thanks for your review" } as never)
  }

  const hideItem = () => {
    if (activeItem) setHidden((s) => new Set(s).add(activeItem.id))
    setSheet(null)
  }

  const delivered = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" })

  return (
    <div
      className="md:hidden min-h-screen"
      style={
        {
          "--page-bg": "#F5F5F7",
          "--card": "#FFFFFF",
          "--tile": "#F0F0F3",
          "--text": "#1F1F23",
          "--muted": "#8A8A96",
          "--track": "#E4E4EA",
          "--locked": "#D4D4DB",
          background: "var(--page-bg)",
          paddingBottom: "calc(56px + env(safe-area-inset-bottom, 0px) + 16px)",
        } as React.CSSProperties
      }
    >
      {/* A) PROFILE HEADER */}
      <div
        className="rounded-b-[28px] pb-4"
        style={{ background: "var(--card)", paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="h-11 px-2 flex items-center">
          <button
            aria-label="Back"
            onClick={goBack}
            className="w-11 h-11 -ml-1 flex items-center justify-center active:scale-95 transition-transform"
          >
            <BackChevron />
          </button>
        </div>

        <LocalizedClientLink href="/user/settings" className="flex justify-center mt-1" aria-label="Your details">
          <span className="w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden" style={{ background: "var(--tile)" }}>
            <UserSilhouette />
          </span>
        </LocalizedClientLink>

        <h1 className="mt-2.5 text-center text-2xl font-semibold max-w-[90%] mx-auto truncate" style={{ color: "var(--text)" }}>
          {name}
        </h1>
        <p className="mt-1 text-center text-base" style={{ color: "var(--muted)" }}>
          {phone || email}
        </p>

        {/* quick tiles */}
        <div className="mt-[18px] flex justify-center gap-[24px] min-[375px]:gap-[31px]">
          <LocalizedClientLink href="/user/settings" className="w-[94px] flex flex-col items-center active:scale-[0.96] transition-transform">
            <span className="w-[63px] h-[63px] rounded-[22px] flex items-center justify-center" style={{ background: "var(--tile)" }}>
              <span className="flex items-center gap-0.5">
                <HbMark h={22} />
                <span className="text-[20px] font-semibold leading-none" style={{ color: "var(--text)" }}>id</span>
              </span>
            </span>
            <span className="mt-2 text-[15px] font-medium" style={{ color: "var(--text)" }}>Your details</span>
          </LocalizedClientLink>
          <LocalizedClientLink href="/user/wallet" className="w-[94px] flex flex-col items-center active:scale-[0.96] transition-transform">
            <span className="w-[63px] h-[63px] rounded-[22px] flex items-center justify-center" style={{ background: "var(--tile)" }}>
              <CardIcon />
            </span>
            <span className="mt-2 text-[15px] font-medium" style={{ color: "var(--text)" }}>Finances</span>
          </LocalizedClientLink>
          <LocalizedClientLink href="/user/settings" className="w-[94px] flex flex-col items-center active:scale-[0.96] transition-transform">
            <span className="w-[63px] h-[63px] rounded-[22px] flex items-center justify-center" style={{ background: "var(--tile)" }}>
              <GearIcon />
            </span>
            <span className="mt-2 text-[15px] font-medium" style={{ color: "var(--text)" }}>Settings</span>
          </LocalizedClientLink>
        </div>
      </div>

      {/* B) ACHIEVEMENTS */}
      <section className="mt-2 rounded-[28px] py-4" style={{ background: "var(--card)" }}>
        <div className="h-6 px-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Achievements</h2>
          <LocalizedClientLink href="/user/my-hybreed" className="flex items-center gap-1 text-lg font-medium" style={{ color: "var(--muted)" }}>
            All <Chevron />
          </LocalizedClientLink>
        </div>
        <div
          className="mt-3 flex gap-2.5 px-4 overflow-x-auto"
          style={{ scrollSnapType: "x proximity", scrollbarWidth: "none" }}
        >
          {ACHIEVEMENTS.map((a) => {
            const locked = a.level === 0
            return (
              <button
                key={a.id}
                onClick={() => { setActiveAchievement(a); setSheet("achievement") }}
                className="w-[150px] h-[148px] shrink-0 rounded-[24px] px-2.5 pt-3.5 pb-3 flex flex-col items-center active:scale-[0.98] transition-transform"
                style={{ background: "var(--tile)", scrollSnapAlign: "start" }}
                aria-label={`${a.name}, level ${a.level}`}
              >
                <AchievementArt kind={a.kind} locked={locked} />
                <span className="relative w-full h-6 mt-1">
                  <span className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 rounded" style={{ background: "var(--track)" }}>
                    <span
                      className="block h-full rounded"
                      style={{ width: `${a.progress}%`, background: "#3B82F6" }}
                    />
                  </span>
                  <span
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-white text-[15px] font-semibold flex items-center justify-center"
                    style={{ background: locked ? "var(--track)" : "#3B82F6", boxShadow: "0 0 0 2px var(--tile)" }}
                  >
                    {a.level}
                  </span>
                </span>
                <span className="mt-0.5 text-lg max-w-full truncate" style={{ color: "var(--text)" }}>{a.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* C) REVIEWS AND QUESTIONS */}
      {visibleItems.length > 0 && (
        <section className="mt-2 rounded-[28px] py-4" style={{ background: "var(--card)" }}>
          <div className="h-6 px-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Reviews and Questions</h2>
            <LocalizedClientLink href="/user/orders" className="flex items-center gap-1 text-lg font-medium" style={{ color: "var(--muted)" }}>
              All <Chevron />
            </LocalizedClientLink>
          </div>
          <div
            className="mt-3 flex gap-[9px] px-4 overflow-x-auto"
            style={{ scrollSnapType: "x mandatory", scrollPaddingLeft: "16px", scrollbarWidth: "none" }}
          >
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 h-[132px] shrink-0 active:scale-[0.98] transition-transform"
                style={{ width: "calc(100vw - 40px)", scrollSnapAlign: "start" }}
                onClick={() => openReview(item)}
              >
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt="" loading="lazy" className="w-[99px] h-[132px] rounded-2xl object-cover bg-white" />
                ) : (
                  <div className="w-[99px] h-[132px] rounded-2xl" style={{ background: "var(--tile)" }} />
                )}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between">
                    <p className="text-lg truncate" style={{ color: "var(--text)" }}>{item.seller || "Seller"}</p>
                    <button
                      aria-label="Options"
                      className="w-11 h-11 -mt-2 -mr-3 flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); setActiveItem(item); setSheet("menu") }}
                    >
                      <DotsIcon />
                    </button>
                  </div>
                  <p
                    className="text-lg leading-5 whitespace-nowrap overflow-hidden"
                    style={{ color: "var(--text)", maskImage: "linear-gradient(90deg,#000 85%,transparent)", WebkitMaskImage: "linear-gradient(90deg,#000 85%,transparent)" }}
                  >
                    {item.title}
                  </p>
                  <p className="text-lg leading-5 text-[#16A34A]">Delivered on {delivered(item.deliveredAt)}</p>
                  <div className="mt-auto flex -ml-1" role="radiogroup" aria-label="Rate this product">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        aria-label={`Rate ${n} out of 5`}
                        className="w-11 h-11 flex items-center justify-center active:scale-90 transition-transform"
                        onClick={(e) => { e.stopPropagation(); openReview(item, n) }}
                      >
                        <Star />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- bottom sheets ---------- */}
      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSheet(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-white p-5"
            style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", animation: "sheetUp .25s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

            {sheet === "menu" && activeItem && (
              <div>
                <button className="w-full h-12 text-left text-lg" style={{ color: "var(--text)" }} onClick={hideItem}>
                  Don&apos;t ask about this item
                </button>
                <LocalizedClientLink href={`/user/orders/${activeItem.orderId}`} className="block h-12 leading-[48px] text-lg" style={{ color: "var(--text)" }}>
                  View order
                </LocalizedClientLink>
              </div>
            )}

            {sheet === "achievement" && activeAchievement && (
              <div className="text-center">
                <div className="flex justify-center"><AchievementArt kind={activeAchievement.kind} locked={activeAchievement.level === 0} /></div>
                <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--text)" }}>{activeAchievement.name}</h3>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  Level {activeAchievement.level} · {activeAchievement.progress}% to next
                </p>
                <p className="mt-2 text-base" style={{ color: "var(--text)" }}>{activeAchievement.desc}</p>
                <button
                  className="mt-4 h-12 w-full rounded-3xl bg-[#2563EB] text-white font-semibold"
                  onClick={() => setSheet(null)}
                >
                  Got it
                </button>
              </div>
            )}

            {sheet === "review" && activeItem && (
              <div>
                <div className="flex items-center gap-3">
                  {activeItem.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeItem.thumbnail} alt="" className="w-12 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-16 rounded-lg" style={{ background: "var(--tile)" }} />
                  )}
                  <p className="text-lg truncate" style={{ color: "var(--text)" }}>{activeItem.title}</p>
                </div>
                <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Choose rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} aria-label={`Rate ${n} out of 5`} className="w-11 h-11 flex items-center justify-center" onClick={() => setRating(n)}>
                      <Star filled={n <= rating} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What did you think?"
                  rows={4}
                  className="mt-2 w-full rounded-2xl p-3 text-base outline-none resize-none"
                  style={{ background: "var(--tile)", color: "var(--text)" }}
                />
                <input ref={fileRef} type="file" accept="image/*" multiple hidden />
                <button
                  className="mt-2 h-11 px-5 rounded-2xl text-base font-medium"
                  style={{ background: "var(--tile)", color: "var(--text)" }}
                  onClick={() => fileRef.current?.click()}
                >
                  Add photos
                </button>
                <button
                  className="mt-4 h-12 w-full rounded-3xl bg-[#2563EB] text-white font-semibold disabled:opacity-50"
                  disabled={rating === 0}
                  onClick={submitReview}
                >
                  Send review
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
