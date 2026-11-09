"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { HbMark } from "@/components/atoms"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

/* ---------- icons ---------- */
const BackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="15 18 9 12 15 6" /></svg>
)
const Chevron = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
)
const MonitorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
)
/* ---------- loyalty config ---------- */
const LEVELS = [
  { n: 1, name: "New to Hybreed", xp: 300 },
  { n: 2, name: "Hybreed Regular", xp: 1500 },
  { n: 3, name: "Hybreed VIP", xp: 5000 },
]
const STREAK_DAYS = [5, 8, 10, 15, 20, 25, 50]

type MyHybreedData = {
  xpTotal: number
  points: number
  spendCur: number
  spendMax: number
  streakDone: number
  claimedToday: boolean
  claimedTasks?: number[]
  hasAddress: boolean
  hasPhone: boolean
  hasOrders: boolean
}
const TASK_CATS = ["All", "Earn more", "Discovery", "Partners", "Trust"]
type Task = {
  id: number
  cat: string
  title: string
  sub: string
  xp: number
  href?: string
  share?: boolean
}
const TASKS: Task[] = [
  { id: 1, cat: "Earn more", title: "Invite a friend to Hybreed", sub: "You both earn when they sign up", xp: 50, share: true },
  { id: 2, cat: "Earn more", title: "Make your first order", sub: "Any item, protected by escrow", xp: 40, href: "/categories" },
  { id: 3, cat: "Trust", title: "Leave a photo review", sub: "Help buyers trust what they see", xp: 25, href: "/user/orders" },
  { id: 4, cat: "Partners", title: "Pre-order from MK's Gifts", sub: "Girlfriend's Day boxes, limited slots", xp: 25, href: "/categories/gifts" },
  { id: 5, cat: "Discovery", title: "Share a find on WhatsApp", sub: "Send any listing to a friend or group", xp: 15, share: true },
  { id: 6, cat: "Earn more", title: "Pay with Mobile Money", sub: "Complete an order via MTN or Orange", xp: 15, href: "/user/wallet" },
  { id: 7, cat: "Discovery", title: "Tour of Hybreed: Fashion", sub: "Browse the category", xp: 10, href: "/categories" },
  { id: 8, cat: "Earn more", title: "List something to sell", sub: "Your first listing, new or used", xp: 30, href: "/sell" },
  { id: 9, cat: "Trust", title: "Verify your phone number", sub: "Unlocks buyer protection perks", xp: 20, href: "/user/account" },
  { id: 10, cat: "Discovery", title: "Save 3 items to favorites", sub: "Build your wishlist", xp: 10, href: "/user/favorites" },
  { id: 11, cat: "Trust", title: "Complete your profile", sub: "Add a delivery address", xp: 20, href: "/user/account" },
]

const DayTile = ({
  day,
  xp,
  claimed,
  today,
  quarter,
}: {
  day: number
  xp: number
  claimed: boolean
  today: boolean
  quarter?: boolean
}) => (
  <div
    className={`${quarter ? "shrink-0" : "flex-1"} rounded-[20px] bg-white px-2 pt-2.5 pb-2 flex flex-col`}
    style={{
      border: today ? "2px solid var(--xp)" : "1.5px solid #E4E4EA",
      ...(quarter ? { width: "calc((100% - 30px) / 4)" } : {}),
    }}
  >
    <span className="text-[14px] font-semibold text-center" style={{ color: "var(--muted)" }}>
      Day {day}
    </span>
    <span
      className="mt-2 rounded-[16px] py-2.5 flex items-center justify-center gap-1 relative"
      style={{ border: "2px dashed var(--xp-soft)" }}
    >
      <span className="text-[22px] leading-none font-bold" style={{ color: "var(--text)" }}>
        {xp}
      </span>
      <span className="h-[18px] px-1.5 rounded-full bg-[#F97316] text-white text-[11px] font-semibold flex items-center">
        XP
      </span>
      {claimed && (
        <span className="absolute inset-0 rounded-[14px] bg-[#F97316]/50 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </span>
  </div>
)

export const MyHybreedClient = ({ data }: { data: MyHybreedData }) => {
  const router = useRouter()
  const locale = (useParams() as { locale?: string })?.locale || "en"
  const [mounted, setMounted] = useState(false)
  const [cat, setCat] = useState("All")
  const [, setMinute] = useState(0)
  const [loy, setLoy] = useState({
    xp: data.xpTotal,
    points: data.points,
    streakDone: data.streakDone,
    claimedToday: data.claimedToday,
    claimedTasks: data.claimedTasks ?? [],
  })

  // derived live values
  let li = LEVELS.findIndex((l) => loy.xp < l.xp)
  if (li < 0) li = LEVELS.length - 1
  const prevXp = li > 0 ? LEVELS[li - 1].xp : 0
  const LEVEL = LEVELS[li]
  const XP = { cur: loy.xp - prevXp, max: LEVELS[li].xp - prevXp }
  const SPEND = { cur: data.spendCur, max: data.spendMax }
  const POINTS = loy.points
  const streakDone = loy.streakDone
  const todayIdx = loy.claimedToday ? loy.streakDone - 1 : loy.streakDone

  const taskDone = (t: Task) =>
    loy.claimedTasks.includes(t.id) ||
    (t.id === 2 && data.hasOrders) ||
    (t.id === 9 && data.hasPhone) ||
    (t.id === 11 && data.hasAddress)

  const onTask = async (t: Task) => {
    if (taskDone(t)) return
    try {
      const r = await fetch("/api/loyalty/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      })
      const j = r.ok ? await r.json() : null
      if (j && typeof j.xp === "number")
        setLoy({
          xp: j.xp,
          points: j.points,
          streakDone: j.streakDone,
          claimedToday: j.claimedToday,
          claimedTasks: j.claimedTasks ?? loy.claimedTasks,
        })
    } catch {
      /* XP claim is best-effort; navigation still happens */
    }
    if (t.share) {
      const shareData = { title: "Hybreed", url: window.location.origin }
      if (navigator.share) {
        navigator.share(shareData).catch(() => {})
      } else {
        navigator.clipboard?.writeText(shareData.url).catch(() => {})
      }
      return
    }
    if (t.href) router.push(`/${locale}${t.href}`)
  }

  // claim today's daily XP on visit (idempotent - safe to re-fire)
  useEffect(() => {
    fetch("/api/loyalty/daily-xp", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.xp === "number")
          setLoy({
            xp: j.xp,
            points: j.points,
            streakDone: j.streakDone,
            claimedToday: j.claimedToday,
            claimedTasks: j.claimedTasks ?? data.claimedTasks ?? [],
          })
      })
      .catch(() => {})
  }, [])
  const [pullY, setPullY] = useState(0)
  const [pullEdge, setPullEdge] = useState<"top" | "bottom">("top")
  const [refreshing, setRefreshing] = useState(false)
  const [dailyOpen, setDailyOpen] = useState(false)

  useBodyScrollLock(dailyOpen)
  const pullStart = useRef<{ y: number; edge: "top" | "bottom" } | null>(null)

  const onPullStart = (e: React.TouchEvent) => {
    if (refreshing) return
    const doc = document.documentElement
    const atTop = window.scrollY <= 0
    const atBottom =
      window.scrollY + window.innerHeight >= doc.scrollHeight - 2
    if (atTop || atBottom) {
      const edge = atTop ? ("top" as const) : ("bottom" as const)
      pullStart.current = { y: e.touches[0].clientY, edge }
      setPullEdge(edge)
    }
  }
  const onPullMove = (e: React.TouchEvent) => {
    const s = pullStart.current
    if (!s) return
    const dy = e.touches[0].clientY - s.y
    const amt = s.edge === "top" ? dy : -dy
    if (amt > 0) setPullY(Math.min(amt * 0.5, 90))
    else {
      pullStart.current = null
      setPullY(0)
    }
  }
  const onPullEnd = () => {
    if (pullStart.current == null) return
    pullStart.current = null
    if (pullY >= 56) {
      setRefreshing(true)
      router.refresh()
      setTimeout(() => {
        setRefreshing(false)
        setPullY(0)
      }, 900)
    } else setPullY(0)
  }

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    const iv = setInterval(() => setMinute((v) => v + 1), 60e3)
    // match overscroll/status-bar area to the hero and stop rubber-band gap
    const html = document.documentElement
    const prev = {
      obH: html.style.overscrollBehaviorY,
      obB: document.body.style.overscrollBehaviorY,
      bgH: html.style.backgroundColor,
      bgB: document.body.style.backgroundColor,
    }
    html.style.overscrollBehaviorY = "none"
    document.body.style.overscrollBehaviorY = "none"
    html.style.backgroundColor = "#BFDBFE"
    document.body.style.backgroundColor = "#BFDBFE"
    return () => {
      cancelAnimationFrame(t)
      clearInterval(iv)
      html.style.overscrollBehaviorY = prev.obH
      document.body.style.overscrollBehaviorY = prev.obB
      html.style.backgroundColor = prev.bgH
      document.body.style.backgroundColor = prev.bgB
    }
  }, [])

  const tasks = useMemo(
    () => TASKS.filter((t) => cat === "All" || t.cat === cat),
    [cat]
  )

  const tile = "bg-white rounded-[24px] transition-transform duration-100 active:scale-[0.98]"

  return (
    <div
      className="md:max-w-[1100px] md:mx-auto md:flex md:flex-col md:gap-4"
      onTouchStart={onPullStart}
      onTouchMove={onPullMove}
      onTouchEnd={onPullEnd}
      onTouchCancel={onPullEnd}
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
      {/* sticky header - matches hero's top colour so it blends seamlessly */}
      <div
        className="sticky top-0 z-40 bg-[#BFDBFE] md:hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="h-11 px-3.5 flex items-center">
          <button
            aria-label="Back"
            onClick={() => router.back()}
            className="w-11 h-11 -ml-2 flex items-center justify-center text-[#2563EB]"
          >
            <BackIcon />
          </button>
          <div className="mx-auto flex items-center gap-1">
            <span
              className="leading-none"
              style={{
                fontFamily: '"Funnel Display", sans-serif',
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              my
            </span>
            <HbMark h={24} />
          </div>
          <span className="w-11" aria-hidden />
        </div>
      </div>
      {/* pull-to-refresh loader - stretches in-flow between header and hero */}
      <div
        className="bg-[#BFDBFE] flex items-center justify-center overflow-hidden"
        style={{
          height:
            pullEdge === "top" ? (refreshing ? 44 : pullY) : 0,
          transition:
            pullY === 0 || refreshing ? "height .3s cubic-bezier(.2,.8,.3,1)" : "none",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={refreshing ? "animate-spin" : ""}
          style={{
            opacity: refreshing ? 1 : Math.min(pullY / 56, 1),
            transform: refreshing ? undefined : `rotate(${pullY * 4}deg)`,
          }}
        >
          <circle cx="12" cy="12" r="9" stroke="#2563EB" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      {/* desktop: hero left, feature tiles stacked right */}
      <div className="md:grid md:grid-cols-[1.5fr_1fr] md:gap-4">
      <div
        className="rounded-b-[44px] md:rounded-[28px] overflow-hidden"
        style={{
          background: "linear-gradient(#BFDBFE 0%,#DBEAFE 55%,#EFF6FF 100%)",
        }}
      >

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
        <div className="mt-4 px-3.5 md:px-0 pb-5 flex gap-3 md:gap-20 md:justify-center items-start">
          <div className="w-[150px] h-[100px] min-[420px]:w-[165px] min-[420px]:h-[125px] md:w-[175px] md:h-[145px] shrink-0 -ml-2 md:ml-6 self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LEVEL.n === 1 ? "/images/myhb-hero-l1.png" : "/images/myhb-hero.png"}
              alt=""
              aria-hidden
              className="h-full w-auto max-w-none object-contain ml-1 md:ml-0 scale-[1.5] md:scale-125 origin-left"
            />
          </div>
          <div className="w-[160px] min-[420px]:w-[170px] md:w-[180px] flex flex-col ml-auto md:ml-0 md:mr-6">
            <LocalizedClientLink href="/user/wallet" className={`${tile} px-3.5 py-2.5 flex flex-col gap-1`} style={{ background: "rgba(255,255,255,0.7)" }}>
              <span className="flex items-center justify-between text-[15px]" style={{ color: "var(--muted)" }}>
                Benefits <Chevron />
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[20px] font-medium leading-none" style={{ color: "var(--text)" }}>{POINTS.toLocaleString("fr-FR")}</span>
                <span className="flex -space-x-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/pill-1.png" alt="" className="h-[22px] w-auto object-contain" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/pill-2.png" alt="" className="h-[22px] w-auto object-contain" />
                </span>
              </span>
            </LocalizedClientLink>

            {/* progress bars */}
            <div className="mt-2 flex flex-col gap-[3px]">
              <div className="h-[22px] rounded-full bg-[#BFDBFE] relative overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#3B82F6] transition-[width] duration-[600ms] ease-out"
                  style={{ width: mounted ? `${(SPEND.cur / SPEND.max) * 100}%` : "0%", minWidth: mounted && SPEND.cur ? undefined : 0 }}
                />
                <span className="absolute inset-0 px-2.5 flex items-center justify-between text-[15px] font-medium text-white" style={{ textShadow: "0 0 3px rgba(37,99,235,0.5)" }}>
                  <span>{Math.round(SPEND.cur).toLocaleString("fr-FR")} XAF</span><span>{SPEND.max.toLocaleString("fr-FR")} XAF</span>
                </span>
              </div>
              <div className="h-[22px] rounded-full relative overflow-hidden" style={{ background: "var(--xp-soft)" }}>
                <div
                  className="h-full rounded-full transition-[width] duration-[600ms] ease-out"
                  style={{ width: mounted ? `${(XP.cur / XP.max) * 100}%` : "0%", background: "var(--xp)" }}
                />
                <span className="absolute inset-0 px-2.5 flex items-center justify-between text-[15px] font-medium text-white" style={{ textShadow: "0 0 3px rgba(249,115,22,0.5)" }}>
                  <span>{XP.cur} XP</span><span>{XP.max} XP</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ===== 2) FEATURE TILES ===== */}
      <div className="grid grid-cols-[0.82fr_1fr] md:flex md:flex-col gap-1.5 md:gap-2.5 px-2.5 md:px-0 mt-2 md:mt-0">
        {/* Hybreed Wow */}
        <LocalizedClientLink href="/categories" className={`${tile} h-[67px] md:h-auto md:flex-1 px-3.5 py-2.5 md:px-5 md:py-4 flex flex-col justify-between text-left`}>
          <div className="flex items-center gap-1.5">
            <span className="h-[22px] md:h-[26px] px-2 md:px-2.5 rounded-full bg-[#2563EB] text-white text-[13px] md:text-base font-semibold flex items-center">Wow</span>
            <span className="text-[14px] md:text-lg font-medium truncate" style={{ color: "var(--text)" }}>Hybreed Wow</span>
          </div>
          <div className="flex items-center">
            <span className="flex -space-x-1.5">
              {["#2563EB", "#3B82F6", "#93C5FD"].map((c, i) => (
                <span key={i} className="w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white" style={{ background: c }} />
              ))}
            </span>
            <span className="ml-auto flex items-center text-[14px] md:text-lg shrink-0" style={{ color: "var(--muted)" }}>
              <Chevron />
            </span>
          </div>
        </LocalizedClientLink>

        {/* Daily XP */}
        <button onClick={() => setDailyOpen(true)} className={`${tile} h-[67px] md:h-auto md:flex-1 px-3.5 py-2.5 md:px-5 md:py-4 flex flex-col justify-between text-left`}>
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
                  background: i < streakDone ? "var(--xp)" : "var(--chip)",
                  color: i < streakDone ? "#fff" : "var(--muted)",
                  outline: i === todayIdx ? "2px solid var(--xp)" : "none",
                  outlineOffset: -2,
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </button>
      </div>

      </div>
      {/* ===== 3) TASKS ===== */}
      <div className="bg-white rounded-t-[36px] md:rounded-[28px] mt-2 md:mt-0 pt-5 pb-[calc(72px+env(safe-area-inset-bottom,0px))] md:pb-6 px-2.5 md:px-6">
        <div className="pl-1.5 md:pl-0 flex items-center gap-1.5">
          <span className="text-[26px] font-semibold" style={{ color: "var(--text)" }}>Tasks</span>
        </div>

        {/* filter chips */}
        <div className="mt-4 -mx-2.5 pl-5 pr-2.5 md:mx-0 md:px-0 flex gap-[5px] overflow-x-auto scrollbar-hide" style={{ scrollSnapType: "x proximity" }}>
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
        <div className="mt-3 flex flex-col gap-[5px] md:grid md:grid-cols-2 md:gap-2.5">
          {tasks.map((t) => {
            const done = taskDone(t)
            return (
              <button
                key={t.id}
                onClick={() => onTask(t)}
                className="min-h-[105px] rounded-[28px] px-3.5 py-3 flex gap-3 text-left transition-all duration-100 active:scale-[0.98]"
                style={{ background: "#F7F7FA", opacity: done ? 0.6 : 1 }}
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
                  <span className="flex items-center gap-1 mt-1.5 text-[15px] font-medium" style={{ color: "var(--muted)" }}>
                    {done ? "Completed" : t.cat}
                  </span>
                </span>
                {done ? (
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

      {/* ===== DAILY XP SHEET ===== */}
      {dailyOpen && (
        <>
          <style>{`@keyframes xpUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes xpFade{from{opacity:0}to{opacity:1}}`}</style>
          <div
            className="fixed inset-0 z-[60] bg-black/45"
            style={{ animation: "xpFade .2s ease" }}
            onClick={() => setDailyOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Daily XP"
            className="fixed bottom-0 left-0 right-0 z-[61] md:w-[560px] md:mx-auto bg-[#F5F5F7] rounded-t-[28px] overflow-hidden"
            style={{
              animation: "xpUp .28s cubic-bezier(.2,.8,.3,1)",
              paddingBottom: "calc(20px + env(safe-area-inset-bottom,0px))",
            }}
          >
            {/* close */}
            <button
              aria-label="Close"
              onClick={() => setDailyOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/[0.06] flex items-center justify-center text-[#8A8A96]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            </button>

            {/* day tiles */}
            <div className="px-4 pt-12 flex flex-col gap-2.5">
              <div className="flex gap-2.5 justify-center">
                {STREAK_DAYS.slice(0, 3).map((d, i) => (
                  <DayTile key={d} day={i + 1} xp={d} claimed={i < streakDone} today={i === todayIdx} quarter />
                ))}
              </div>
              <div className="flex gap-2.5">
                {STREAK_DAYS.slice(3).map((d, i) => (
                  <DayTile key={d} day={i + 4} xp={d} claimed={i + 3 < streakDone} today={i + 3 === todayIdx} />
                ))}
              </div>
            </div>

            {/* copy */}
            <div className="px-5 mt-6">
              <h2 className="text-[26px] leading-[30px] font-bold" style={{ color: "var(--text)" }}>
                Free XP every day
              </h2>
              <p className="mt-2 text-[16px] leading-[21px]" style={{ color: "var(--muted)" }}>
                Just open My Hybreed each day - we add more XP every day. After 7 days the streak starts over.
              </p>
            </div>

            <button
              onClick={() => setDailyOpen(false)}
              className="mx-5 mt-6 w-[calc(100%-40px)] h-[54px] rounded-[18px] bg-[#2563EB] text-white text-[17px] font-semibold active:scale-[0.98] transition-transform"
            >
              Sounds great
            </button>
          </div>
        </>
      )}

      {/* bottom pull loader - stretches in-flow at the end of the page */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          background: "var(--page-bg)",
          height:
            pullEdge === "bottom" ? (refreshing ? 44 : pullY) : 0,
          transition:
            pullY === 0 || refreshing ? "height .3s cubic-bezier(.2,.8,.3,1)" : "none",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={refreshing ? "animate-spin" : ""}
          style={{
            opacity: refreshing ? 1 : Math.min(pullY / 56, 1),
            transform: refreshing ? undefined : `rotate(${pullY * 4}deg)`,
          }}
        >
          <circle cx="12" cy="12" r="9" stroke="#2563EB" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
