"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

/* ---------- icons ---------- */
const BackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="15 18 9 12 15 6" /></svg>
)
const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="13" y2="14" /></svg>
)
const Chevron = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
)
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
const MonitorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
)
const GiftBox = () => (
  <svg width="155" height="130" viewBox="0 0 155 130" fill="none" aria-hidden>
    <ellipse cx="78" cy="118" rx="55" ry="8" fill="#BFDBFE" opacity="0.6" />
    <path d="M35 60 L70 45 v10 l-30 12z" fill="#93C5FD" />
    <path d="M120 60 L85 45 v10 l30 12z" fill="#60A5FA" />
    <rect x="40" y="58" width="75" height="55" rx="6" fill="#DBEAFE" />
    <rect x="40" y="58" width="75" height="14" rx="6" fill="#BFDBFE" />
    <path d="M77.5 58 v55" stroke="#93C5FD" strokeWidth="3" />
    <rect x="68" y="34" width="20" height="20" rx="4" fill="#2563EB" />
    <path d="M78 34v20M68 44h20" stroke="#fff" strokeWidth="2" />
    <circle cx="55" cy="50" r="7" fill="#3B82F6" />
    <circle cx="102" cy="48" r="5" fill="#22D3EE" />
    <path d="M120 30l2.5 6.5L129 39l-6.5 2.5L120 48l-2.5-6.5L111 39l6.5-2.5z" fill="#3B82F6" />
    <path d="M40 28l1.8 4.7L46.5 34.5l-4.7 1.8L40 41l-1.8-4.7-4.7-1.8 4.7-1.8z" fill="#60A5FA" />
  </svg>
)

/* ---------- placeholder data (needs: real loyalty backend) ---------- */
const LEVEL = { n: 2, name: "A good start" }
const POINTS = 1600
const SPEND = { cur: 0, max: 5000 }
const XP = { cur: 253, max: 300 }
const WOW_OFFERS = 3
const STREAK_DAYS = [5, 8, 10, 15, 20, 25, 50]
const STREAK_DONE = 3
const TASK_CATS = ["All", "Earn more", "Discovery", "Partners", "Trust"]
const now = Date.now()
const TASKS = [
  { id: 1, cat: "Earn more", title: "Invite a friend to Hybreed", sub: "You both earn when they sign up", xp: 50, ends: now + 6 * 24 * 3600e3, done: false },
  { id: 2, cat: "Earn more", title: "Make your first order", sub: "Any item, protected by escrow", xp: 40, ends: now + 72 * 3600e3, done: false },
  { id: 3, cat: "Trust", title: "Leave a photo review", sub: "Help buyers trust what they see", xp: 25, ends: now + 48 * 3600e3, done: false },
  { id: 4, cat: "Partners", title: "Pre-order from MK's Gifts", sub: "Girlfriend's Day boxes, limited slots", xp: 25, ends: now + 48 * 3600e3, done: false },
  { id: 5, cat: "Discovery", title: "Share a find on WhatsApp", sub: "Send any listing to a friend or group", xp: 15, ends: now + 24 * 3600e3, done: false },
  { id: 6, cat: "Earn more", title: "Pay with Mobile Money", sub: "Complete an order via MTN or Orange", xp: 15, ends: now + 72 * 3600e3, done: false },
  { id: 7, cat: "Discovery", title: "Tour of Hybreed: Fashion", sub: "Browse the category", xp: 10, ends: now + 23 * 3600e3 + 53 * 60e3, done: false },
  { id: 8, cat: "Earn more", title: "List something to sell", sub: "Your first listing, new or used", xp: 30, ends: now + 7 * 24 * 3600e3, done: false },
  { id: 9, cat: "Trust", title: "Verify your phone number", sub: "Unlocks buyer protection perks", xp: 20, ends: now + 5 * 24 * 3600e3, done: false },
  { id: 10, cat: "Discovery", title: "Save 3 items to favorites", sub: "Build your wishlist", xp: 10, ends: now + 24 * 3600e3, done: false },
  { id: 11, cat: "Trust", title: "Complete your profile", sub: "Add a delivery address", xp: 20, ends: now - 60e3, done: true },
]

const fmtLeft = (ms: number) => {
  if (ms <= 0) return "Expired"
  const d = Math.floor(ms / 86400e3)
  const h = Math.floor((ms % 86400e3) / 3600e3)
  const m = Math.floor((ms % 3600e3) / 60e3)
  return d > 0 ? `${d} d ${h} h` : `${h} h ${m} m`
}

export const MyHybreedClient = () => {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [cat, setCat] = useState("All")
  const [, setMinute] = useState(0)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    const iv = setInterval(() => setMinute((v) => v + 1), 60e3)
    return () => {
      cancelAnimationFrame(t)
      clearInterval(iv)
    }
  }, [])

  const tasks = useMemo(
    () => TASKS.filter((t) => cat === "All" || t.cat === cat),
    [cat]
  )
  const nowMs = Date.now()

  const tile = "bg-white rounded-[24px] transition-transform duration-100 active:scale-[0.98]"

  return (
    <div
      className="md:max-w-[600px] md:mx-auto md:flex md:flex-col md:gap-3"
      style={
        {
          "--page-bg": "#F5F5F7",
          "--card": "#FFFFFF",
          "--chip": "#F0F0F3",
          "--text": "#1F1F23",
          "--muted": "#8A8A96",
          "--brand": "#2563EB",
          "--brand-dark": "#1D4ED8",
          "--brand-tint": "#DBEAFE",
          "--xp": "#F97316",
          "--xp-soft": "#FDBA74",
        } as React.CSSProperties
      }
    >
      {/* ===== 1) HERO ===== */}
      <div
        className="rounded-b-[44px] md:rounded-[28px] overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#BFDBFE 0%,#DBEAFE 55%,#EFF6FF 100%)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {/* header row */}
        <div className="h-11 px-3.5 flex items-center">
          <button
            aria-label="Back"
            onClick={() => router.back()}
            className="w-11 h-11 -ml-2 flex items-center justify-center text-[#2563EB]"
          >
            <BackIcon />
          </button>
          <div className="mx-auto flex items-center gap-2">
            <span className="text-xl font-semibold" style={{ color: "var(--text)" }}>my</span>
            <span className="h-[26px] px-2.5 rounded-[13px] bg-[#2563EB] text-white text-[15px] font-semibold flex items-center">HB</span>
          </div>
          <button aria-label="Support chat" className="w-11 h-11 -mr-2 flex items-center justify-center" style={{ color: "var(--text)" }}>
            <ChatIcon />
          </button>
        </div>

        {/* level text */}
        <div className="text-center mt-3">
          <p className="text-[15px] leading-tight" style={{ color: "var(--muted)" }}>
            You're at level {LEVEL.n}
          </p>
          <h1 className="text-[30px] max-[360px]:text-[26px] font-semibold leading-tight truncate" style={{ color: "var(--text)" }}>
            {LEVEL.name}
          </h1>
        </div>

        {/* body row */}
        <div className="mt-4 px-3.5 md:px-0 pb-5 flex gap-3 md:gap-6 md:justify-center items-start">
          <div className="w-[165px] h-[125px] md:w-[175px] md:h-[145px] shrink-0 -ml-2 md:ml-0 self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/myhb-hero.png"
              alt=""
              aria-hidden
              className="h-full w-auto max-w-none object-contain ml-1 md:ml-0"
              style={{ transform: "scale(1.25)", transformOrigin: "left center" }}
            />
          </div>
          <div className="w-[170px] md:w-[180px] flex flex-col ml-auto">
            <LocalizedClientLink href="/user" className={`${tile} px-3.5 py-2.5 flex flex-col gap-1`} style={{ background: "rgba(255,255,255,0.7)" }}>
              <span className="flex items-center justify-between text-[15px]" style={{ color: "var(--muted)" }}>
                Benefits <Chevron />
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[20px] font-medium leading-none" style={{ color: "var(--text)" }}>1 600</span>
                <span className="flex -space-x-2"><span className="h-6 px-1.5 rounded-full bg-[#2563EB] text-white text-[13px] font-semibold flex items-center">HB</span><span className="h-6 px-1.5 rounded-full bg-[#1D4ED8] text-white text-[13px] font-semibold flex items-center">Wow</span></span>
              </span>
            </LocalizedClientLink>

            <LocalizedClientLink href="/user" className="mt-3.5 flex items-center justify-between text-[15px]" style={{ color: "var(--muted)" }}>
              Next level <Chevron />
            </LocalizedClientLink>

            {/* progress bars */}
            <div className="mt-2 flex flex-col gap-[3px]">
              <div className="h-[22px] rounded-full bg-[#BFDBFE] relative overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#3B82F6] transition-[width] duration-[600ms] ease-out"
                  style={{ width: mounted ? `${(SPEND.cur / SPEND.max) * 100}%` : "0%", minWidth: mounted && SPEND.cur ? undefined : 0 }}
                />
                <span className="absolute inset-0 px-2.5 flex items-center justify-between text-[15px] font-medium text-white" style={{ textShadow: "0 0 3px rgba(37,99,235,0.5)" }}>
                  <span>0 XAF</span><span>5 000 XAF</span>
                </span>
              </div>
              <div className="h-[22px] rounded-full relative overflow-hidden" style={{ background: "var(--xp-soft)" }}>
                <div
                  className="h-full rounded-full transition-[width] duration-[600ms] ease-out"
                  style={{ width: mounted ? `${(XP.cur / XP.max) * 100}%` : "0%", background: "var(--xp)" }}
                />
                <span className="absolute inset-0 px-2.5 flex items-center justify-between text-[15px] font-medium text-white" style={{ textShadow: "0 0 3px rgba(249,115,22,0.5)" }}>
                  <span>253 XP</span><span>300 XP</span>
                </span>
              </div>
            </div>

            <LocalizedClientLink href="/user" className="mt-2.5 flex items-center gap-1 text-base font-medium text-[#2563EB]">
              Level benefits <Chevron />
            </LocalizedClientLink>
          </div>
        </div>
      </div>

      {/* ===== 2) FEATURE TILES ===== */}
      <div className="grid grid-cols-[0.82fr_1fr] md:grid-cols-2 gap-1.5 md:gap-2.5 px-2.5 md:px-0 mt-2 md:mt-0">
        {/* Hybreed Wow */}
        <button className={`${tile} h-[67px] px-3.5 py-2.5 flex flex-col justify-between text-left`}>
          <div className="flex items-center gap-1.5">
            <span className="h-[22px] md:h-[26px] px-2 md:px-2.5 rounded-full bg-[#2563EB] text-white text-[13px] md:text-base font-semibold flex items-center">Wow</span>
            <span className="text-[14px] md:text-lg font-medium truncate" style={{ color: "var(--text)" }}>Hybreed Wow</span>
          </div>
          <div className="flex items-center -space-x-1.5">
            {["#2563EB", "#3B82F6", "#93C5FD"].map((c, i) => (
              <span key={i} className="w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white" style={{ background: c }} />
            ))}
            <span className="ml-auto flex items-center gap-0.5 text-[14px] md:text-lg shrink-0" style={{ color: "var(--muted)" }}>
              3 <Chevron />
            </span>
          </div>
        </button>

        {/* Daily XP */}
        <button className={`${tile} h-[67px] px-3.5 py-2.5 flex flex-col justify-between text-left`}>
          <div className="flex items-center gap-2">
            <span className="h-[22px] md:h-[26px] px-2 md:px-2.5 rounded-full bg-[#F97316] text-white text-[13px] md:text-base font-semibold flex items-center">XP</span>
            <span className="text-[15px] md:text-lg font-medium" style={{ color: "var(--text)" }}>Daily XP!</span>
            <span className="ml-auto" style={{ color: "var(--muted)" }}><Chevron /></span>
          </div>
          <div className="flex gap-[3px] md:gap-1">
            {STREAK_DAYS.map((d, i) => (
              <span
                key={d}
                className="w-[20px] h-[20px] md:w-7 md:h-7 rounded-full flex items-center justify-center text-[9px] md:text-[13px] font-semibold"
                style={{
                  background: i < STREAK_DONE ? "var(--xp)" : "var(--chip)",
                  color: i < STREAK_DONE ? "#fff" : "var(--muted)",
                  outline: i === STREAK_DONE ? "2px solid var(--xp)" : "none",
                  outlineOffset: -2,
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </button>
      </div>

      {/* ===== 3) TASKS ===== */}
      <div className="bg-white rounded-t-[36px] md:rounded-[28px] mt-2 md:mt-0 pt-5 pb-[calc(72px+env(safe-area-inset-bottom,0px))] md:pb-6">
        <LocalizedClientLink href="/user" className="px-4 flex items-center gap-1.5">
          <span className="text-[26px] font-semibold" style={{ color: "var(--text)" }}>Tasks</span>
          <Chevron s={22} />
        </LocalizedClientLink>

        {/* filter chips */}
        <div className="mt-4 flex gap-[5px] overflow-x-auto px-2.5 scrollbar-hide" style={{ scrollSnapType: "x proximity" }}>
          {TASK_CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="h-[31px] px-3.5 rounded-[14px] text-base font-medium shrink-0 transition-colors"
              style={{
                scrollSnapAlign: "start",
                background: cat === c ? "#DBEAFE" : "var(--chip)",
                color: cat === c ? "#2563EB" : "var(--text)",
                border: cat === c ? "2px solid #2563EB" : "2px solid transparent",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* task cards */}
        <div className="mt-3 px-2.5 flex flex-col gap-[5px]">
          {tasks.map((t) => {
            const left = t.ends - nowMs
            const expired = !t.done && left <= 0
            return (
              <button
                key={t.id}
                className="min-h-[105px] rounded-[28px] px-3.5 py-3 flex gap-3 text-left transition-all duration-100 active:scale-[0.98]"
                style={{ background: "#F7F7FA", opacity: t.done ? 0.6 : 1 }}
              >
                <span className="w-11 h-11 rounded-[14px] bg-white flex items-center justify-center shrink-0">
                  <MonitorIcon />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xl font-semibold leading-tight line-clamp-2" style={{ color: "var(--text)" }}>
                    {t.title}
                  </span>
                  <span className="block text-base mt-0.5 truncate" style={{ color: "var(--text)", opacity: 0.85 }}>
                    {t.sub}
                  </span>
                  <span className="flex items-center gap-1.5 mt-1.5 text-[17px] font-medium" style={{ color: "var(--muted)" }}>
                    <ClockIcon />
                    {t.done ? "Completed" : expired ? "Expired" : fmtLeft(left)}
                  </span>
                </span>
                {t.done ? (
                  <span className="h-[30px] w-[30px] rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0 self-start">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                ) : (
                  <span className="h-[30px] pl-3 pr-1.5 rounded-full bg-black/[0.05] flex items-center gap-1 shrink-0 self-start">
                    <span className="text-xl font-medium" style={{ color: "var(--text)" }}>+{t.xp}</span>
                    <span className="h-[22px] px-2 rounded-full bg-[#F97316] text-white text-[15px] font-semibold flex items-center">XP</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
