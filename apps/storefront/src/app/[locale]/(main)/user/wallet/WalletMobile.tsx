"use client"

import { useEffect, useRef, useState } from "react"
import { useTopUpSheet } from "@/components/cells/TopUpSheet/TopUpSheet"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { HbMark } from "@/components/atoms"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

/* ---------- icons ---------- */
const I = ({ d, s = 20, c = "currentColor" }: { d: string; s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
)
const ic = {
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  dots: "M12 5h.01M12 12h.01M12 19h.01",
  qr: "M3 7V4h3M17 4h3v3M21 17v3h-3M7 20H4v-3M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z",
  pie: "M21.2 15.9A10 10 0 1 1 8 2.8M22 12A10 10 0 0 0 12 2v10z",
  wallet: "M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2",
  swap: "M17 3l4 4-4 4M21 7H9M7 21l-4-4 4-4M3 17h12",
  plus: "M12 5v14M5 12h14",
  card: "M2 8.5A2.5 2.5 0 0 1 4.5 6h15A2.5 2.5 0 0 1 22 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5zM2 10h20",
  chest: "M3 9l7-5 7 5v11H3zM7 9v6a5 5 0 0 0 10 0V9",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  clover: "M9 9a3 3 0 1 1 0-.01M15 9a3 3 0 1 0 0 .01M9 15a3 3 0 1 0 0 .01M15 15a3 3 0 1 1 0-.01",
  ticket: "M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z",
  loan: "M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z",
}
const Chevron = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
)
const GiftBag = ({ w = 76, h = 55 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 76 55" fill="none" aria-hidden>
    <rect x="8" y="14" width="58" height="41" rx="8" fill="#2563EB" />
    <path d="M28 14v-4a10 10 0 0 1 20 0v4" stroke="#1D4ED8" strokeWidth="4" fill="none" />
    <path d="M50 8l1.6 4.4L56 14l-4.4 1.6L50 20l-1.6-4.4L44 14l4.4-1.6z" fill="#BFDBFE" />
  </svg>
)

const sheetRows = [
  { label: "Transaction history", icon: ic.wallet },
  { label: "Hide balance", icon: ic.pie },
  { label: "Wallet settings", icon: ic.card },
  { label: "Help", icon: ic.dots },
]
const allProducts = [
  { label: "Hybreed Cash", icon: ic.wallet },
  { label: "Savings", icon: ic.chest },
  { label: "Loans", icon: ic.loan },
  { label: "Pay Small Small", icon: ic.clover },
  { label: "Hybreed bonus points", icon: ic.pie },
  { label: "Certificates", icon: ic.ticket },
]
const promos = [
  { t: "Savings account", s: "Open one and earn 13% a year on your daily balance", bg: "#FFF3E0", fg: "#3A2A12" },
  { t: "Up to 14.7% on deposits", s: "Open a deposit and earn interest", bg: "#DCF3E6", fg: "#0F3D26" },
  { t: "Hybreed+ membership", s: "Extra cashback and free delivery", bg: "#DBEAFE", fg: "#1E3A8A" },
]

export const WalletMobile = ({ balance = 0, points = 0 }: { balance?: number; points?: number }) => {
  const fmt = (n: number) => `${Math.round(n).toLocaleString("en-US").replace(/,/g, " ")} XAF`
  const topUp = useTopUpSheet()
  const [scrolled, setScrolled] = useState(false)
  const [tick, setTick] = useState(0)
  const [sheet, setSheet] = useState<"none" | "more" | "soon" | "all">("none")
  useBodyScrollLock(sheet !== "none")
  const sentinel = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // cycle the discount-tile messages every 1.2s
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 3000)
    return () => clearInterval(t)
  }, [])

  // auto-scroll promo carousel every 4s, looping
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const t = setInterval(() => {
      const slideW = el.clientWidth - 48
      const next = el.scrollLeft + slideW + 9
      const max = el.scrollWidth - el.clientWidth
      el.scrollTo({
        left: next > max - 10 ? 0 : next,
        behavior: "smooth",
      })
    }, 4000)
    return () => clearInterval(t)
  }, [])

  const Sheet = ({ title, rows }: { title: string; rows?: { label: string; icon: string }[] }) => (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSheet("none")} />
      <div
        className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-[24px] pt-4 px-4 pb-8"
        style={{ animation: "wmUp .28s ease-out" }}
      >
        <style>{`@keyframes wmUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-[#1F1F23]">{title}</h3>
          <button aria-label="Close" onClick={() => setSheet("none")} className="w-10 h-10 flex items-center justify-center text-[#6B6B76]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
          </button>
        </div>
        {rows ? (
          <ul>
            {rows.map((r) => (
              <li key={r.label} className="flex items-center gap-3.5 h-14 text-[15px] text-[#1F1F23]">
                <span className="text-[#6B6B76]"><I d={r.icon} s={22} /></span>
                {r.label}
                <span className="ml-auto text-[#8A8A96]"><Chevron /></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-[#8A8A96] py-4">Coming soon</p>
        )}
      </div>
    </>
  )

  const tile = "bg-white rounded-[24px] transition-transform duration-100 active:scale-[0.98]"

  return (
    <div
      className="md:hidden"
      style={
        {
          "--page-bg": "#F5F5F7",
          "--panel": "#E6EDFB",
          "--card": "#FFFFFF",
          "--tile": "#FFFFFF",
          "--text": "#1F1F23",
          "--muted": "#8A8A96",
          "--brand": "#2563EB",
          "--brand-tint": "#DBEAFE",
          "--green": "#16A34A",
          background: "var(--page-bg)",
          margin: "0 -5px",
        } as React.CSSProperties
      }
    >
      {/* hide the footer on mobile for this page */}
      <style>{`@media (max-width:767.98px){[data-testid="footer"]{display:none}}`}</style>
      {/* A - sticky header */}
      <div ref={sentinel} className="absolute top-0 h-px w-full" />
      <header
        className="sticky top-0 z-40 transition-all duration-150"
        style={{
          background: scrolled ? "var(--page-bg)" : "transparent",
          borderRadius: scrolled ? "0 0 20px 20px" : "0",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="flex items-center h-11 pl-4 pr-1.5">
          <div className="flex items-center gap-1.5">
            <HbMark h={24} />
            <span className="text-[24px] font-semibold leading-none" style={{ color: "var(--text)" }}>Wallet</span>
            <LocalizedClientLink href="/user" className="ml-2 h-[24px] px-2.5 bg-white border border-black/[0.06] rounded-full flex items-center gap-0.5 text-[13px] font-semibold uppercase" style={{ color: "var(--text)" }}>
              Start
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </LocalizedClientLink>
          </div>
          <div className="ml-auto flex items-center">
            <button aria-label="Notifications" className="relative w-11 h-11 flex items-center justify-center" style={{ color: "var(--text)" }}>
              <I d={ic.bell} s={28} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#EF4444]" />
            </button>
            <button aria-label="More" onClick={() => setSheet("more")} className="w-11 h-11 flex items-center justify-center" style={{ color: "var(--text)" }}>
              <I d={ic.dots} s={28} />
            </button>
          </div>
        </div>
      </header>

      {/* B - hero panel */}
      <section
        className="-mt-11 pt-[52px] px-4 overflow-hidden"
        style={{ background: "var(--panel)", borderRadius: "0 0 44px 44px" }}
      >
        {/* B1 bento */}
        <div className="grid grid-cols-2 gap-2">
          {/* left column */}
          <div className="flex flex-col gap-2">
            <div className={`${tile} h-[194px] flex flex-col px-3 pt-2`}>
              <p className="text-[14px]" style={{ color: "var(--text)", fontWeight: 450 }}>
                Your discount: 3%
              </p>
              <div className="mt-1.5 rounded-[22px] h-[127px] relative overflow-hidden -mx-3" style={{ background: "#1E3A8A url('/images/carbon-texture.png') center/cover no-repeat" }}>
                <style>{`
                  @keyframes wmOut { from { transform: translateY(0); opacity: 1 } to { transform: translateY(100%); opacity: 0 } }
                  @keyframes wmIn { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
                `}</style>
                {(tick === 0 ? [tick] : [tick - 1, tick]).map((t, k, arr) => {
                  const v = [
                    { l1: "Increase", l2: "up to", pill: "7%" },
                    { l1: "Earn", l2: "HB", pill: "points" },
                    { l1: "Boost", l2: "your", pill: "perks" },
                  ][((t % 3) + 3) % 3]
                  return (
                    <div
                      key={t}
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{
                        animation:
                          arr.length === 1
                            ? "none"
                            : `${k === 0 ? "wmOut" : "wmIn"} .5s ease-in-out forwards`,
                        zIndex: k,
                      }}
                    >
                      <span className="text-[20px] font-medium" style={{ color: "#BFDBFE" }}>{v.l1}</span>
                      <span className="text-[20px] font-medium flex items-center gap-2" style={{ color: "#BFDBFE" }}>
                        {v.l2}
                        <span className="bg-[#3B82F6] text-white text-[30px] font-semibold px-3.5 rounded-full">{v.pill}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
              <LocalizedClientLink href="/user" className="h-10 flex items-center justify-between mt-auto">
                <span className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>How to increase discount</span>
                <Chevron />
              </LocalizedClientLink>
            </div>
            <div className={`${tile} h-[31px] rounded-full flex items-center justify-center gap-1.5`}>
              <span className="text-base font-medium" style={{ color: "var(--brand)" }}>Get 1,000</span>
              <HbMark h={18} />
            </div>
          </div>

          {/* right column */}
          <div className="flex flex-col gap-2">
            <LocalizedClientLink href="/user/spending" className={`${tile} h-[69px] px-4 py-3 flex flex-col justify-center`}>
              <p className="text-[13px] whitespace-nowrap -mt-1 font-[450]" style={{ color: "var(--muted)" }}>Monthly spending</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[15px] font-medium" style={{ color: "var(--text)" }}>0 XAF</p>
                <div className="flex items-center -space-x-2">
                  <span className="w-[27px] h-[27px] rounded-full bg-[#3B82F6] flex items-center justify-center"><I d={ic.qr} s={13} c="#fff" /></span>
                  <span className="w-[27px] h-[27px] rounded-full bg-[#1D4ED8] flex items-center justify-center"><I d={ic.pie} s={13} c="#fff" /></span>
                  <span className="w-[27px] h-[27px] rounded-full bg-[#93C5FD] flex items-center justify-center z-10"><I d={ic.wallet} s={13} c="#fff" /></span>
                </div>
              </div>
            </LocalizedClientLink>
            <div className="grid grid-cols-2 gap-2">
              <button className={`${tile} h-[77px] flex flex-col items-center justify-center gap-1 p-1.5 relative`}>
                <I d={ic.qr} s={28} c="var(--text)" />
                <span className="text-[13px] leading-[1.3] text-center" style={{ color: "var(--muted)" }}>Pay with QR Code</span>
              </button>
              <button className={`${tile} h-[77px] flex flex-col items-center justify-center gap-1 p-1.5 relative`}>
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#22C55E]" />
                <I d={ic.swap} s={28} c="var(--text)" />
                <span className="text-[13px] leading-[1.15] text-center" style={{ color: "var(--muted)" }}>Transfers and Payments</span>
              </button>
            </div>
            <button onClick={() => topUp.open()} className={`${tile} h-[69px] flex flex-col items-center justify-center gap-0.5`}>
              <I d={ic.plus} s={28} c="var(--text)" />
              <span className="text-base font-medium" style={{ color: "var(--text)" }}>Top up Wallet</span>
            </button>
          </div>
        </div>

        {/* Pay-in-Parts outstanding balance notice */}
        {balance < 0 && (
          <div className="mx-4 mt-4 rounded-[20px] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3">
            <p className="text-[15px] font-semibold text-[#B91C1C]">
              Pay Small Small balance due: {fmt(Math.abs(balance))}
            </p>
            <p className="text-[13px] text-[#7F1D1D]/80 mt-0.5">
              Top up your wallet to clear your Pay Small Small balance.
            </p>
            <button
              onClick={() => topUp.open()}
              className="mt-2 h-9 px-4 rounded-full bg-[#DC2626] text-white text-[13px] font-semibold"
            >
              Top up now
            </button>
          </div>
        )}

        {/* B2 balance card */}
        <div
          className="mt-8 mx-4 h-[130px] px-4 pt-2.5 pb-3.5 relative"
          style={{
            background:
              "radial-gradient(circle at 85% 20%, rgba(255,255,255,0.14) 0%, transparent 45%), radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(160deg,#22C55E 0%,#16A34A 55%,#14532D 100%)",
            backgroundSize: "auto, 14px 14px, auto",
            borderRadius: "28px 28px 0 0",
          }}
        >
          <p className="text-[20px] font-medium text-white">{fmt(balance)}</p>
          <p className="text-base text-white/70">Wallet balance</p>
          {/* glowing rotating border */}
          <div className="absolute bottom-3.5 left-4 right-4 h-[43px] rounded-2xl overflow-hidden p-[1.5px]">
            <div
              className="absolute inset-[-60%] animate-[spin_3s_linear_infinite]"
              style={{
                background:
                  "conic-gradient(transparent 0%, transparent 65%, rgba(255,255,255,0.95) 80%, transparent 100%)",
              }}
            />
            <button
              onClick={() => setSheet("soon")}
              className="relative w-full h-full rounded-2xl flex items-center justify-between px-4"
              style={{ background: "#166534" }}
            >
              <span className="text-[15px] font-medium text-white truncate">
                Get a card with up to 5% cashback
              </span>
              <I d={ic.card} s={24} c="#fff" />
            </button>
          </div>
        </div>
      </section>

      {/* C - promo carousel */}
      <div
        ref={carouselRef}
        className="mt-8 flex gap-2 overflow-x-auto px-6 scrollbar-hide"
        style={{ scrollSnapType: "x mandatory", scrollPadding: "0 24px" }}
      >
        {promos.map((p) => (
          <button
            key={p.t}
            onClick={() => setSheet("soon")}
            className="relative shrink-0 text-left rounded-[24px] h-[83px] px-5 py-4 overflow-hidden"
            style={{
              width: "calc(100vw - 48px)",
              scrollSnapAlign: "center",
              background: p.bg,
            }}
          >
            <p className="text-xl font-semibold truncate" style={{ color: p.fg }}>{p.t}</p>
            <p className="text-[15px] leading-snug mt-0.5 w-[70%]" style={{ color: p.fg, opacity: 0.9 }}>{p.s}</p>
            <span className="absolute -bottom-3 -right-2 opacity-80"><GiftBag w={70} h={50} /></span>
          </button>
        ))}
      </div>

      {/* D - product cards */}
      <div className="px-4 mt-8 flex flex-col gap-2 pb-[100px]">
        {[
          { t: "Hybreed Cash", v: "+100 000 XAF", sub: null, icon: null, apply: true, bag: true },
          { t: "Savings", v: "0 XAF", sub: "Accounts, deposits, and investments", icon: ic.chest, green: true },
          { t: "Loans", v: null, sub: "For any purpose", icon: ic.loan },
          { t: "Pay Small Small", v: "100 000 XAF", sub: "Buy now, pay small small over time", icon: ic.clover },
          { t: "Hybreed bonus points", v: `${Math.round(points).toLocaleString("en-US")} HB`, sub: "Cashback on your purchases", icon: null, hbPill: true },
          { t: "Certificates", v: null, sub: "To shop on Hybreed", icon: ic.ticket },
        ].map((c) => (
          <button
            key={c.t}
            onClick={() => setSheet("soon")}
            className="relative bg-white rounded-[28px] px-4 pt-4 pb-4 text-left transition-transform duration-100 active:scale-[0.98] overflow-hidden"
            style={{ minHeight: 140 }}
          >
            <div className="flex items-start justify-between">
              <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>{c.t}</p>
              {c.icon && (
                <span style={{ color: c.green ? "var(--green)" : "#3B82F6" }}>
                  <I d={c.icon} s={20} />
                </span>
              )}
            </div>
            {c.sub && (
              <p className="text-[15px] mt-0.5 truncate" style={{ color: "var(--text)", opacity: 0.8 }}>{c.sub}</p>
            )}
            <div className="mt-auto pt-6 flex items-baseline gap-1.5">
              {c.v && <span className="text-[26px]" style={{ color: "var(--text)" }}>{c.v}</span>}
              {c.hbPill && <HbMark h={20} />}
            </div>
            {c.apply && (
              <span className="inline-block mt-2 h-[37px] px-5 rounded-[14px] bg-[#F0F0F3] text-[17px] font-medium flex items-center w-fit" style={{ color: "var(--text)" }}>
                Apply
              </span>
            )}
            {c.bag && <span className="absolute -bottom-1 -right-1"><GiftBag /></span>}
          </button>
        ))}
      </div>

      {/* E - floating All Products */}
      <button
        onClick={() => setSheet("all")}
        className="fixed left-4 right-4 z-40 h-[51px] bg-white rounded-3xl text-xl font-semibold text-[#1F1F23] active:scale-[0.98] transition-transform md:hidden"
        style={{
          bottom: "calc(56px + env(safe-area-inset-bottom, 0px) + 20px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}
      >
        All Products
      </button>

      {/* sheets */}
      {sheet === "more" && <Sheet title="Wallet" rows={sheetRows} />}
      {sheet === "all" && <Sheet title="All products" rows={allProducts} />}
      {sheet === "soon" && <Sheet title="Coming soon" />}
    </div>
  )
}
