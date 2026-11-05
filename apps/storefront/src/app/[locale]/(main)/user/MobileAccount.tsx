"use client"

import { useEffect, useRef, useState } from "react"
import { useTopUpSheet } from "@/components/cells/TopUpSheet/TopUpSheet"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { HbMark } from "@/components/atoms"

/* ---------- icons ---------- */
const Chevron = ({ size = 16, cls = "text-[#8A8A96]" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
)
const BellIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
)
const BurgerIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
)
const TicketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z" /></svg>
)
const OutlineIcon = ({ path }: { path: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={path} /></svg>
)
const paths = {
  home: "M3 10.5L12 3l9 7.5M5 9.5V21h14V9.5",
  orders: "M6 2h12l2 6v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8l2-6zM6 8h12M9 12h6",
  cart: "M6 2 3 7v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7l-3-5M3 7h18M9 11v5M15 11v5",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z",
  star: "M12 2l3 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l7-1z",
  back: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  card: "M2 8.5A2.5 2.5 0 0 1 4.5 6h15A2.5 2.5 0 0 1 22 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5zM2 10h20M6 15h4",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  shop: "M4.5 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0M4 8.5L6 3.5h12l2 5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5M9.5 21v-5.5h5V21",
}

const drawerGroups = [
  [{ label: "Achievements", href: "/user", icon: paths.star }],
  [
    { label: "Orders", href: "/user/orders", icon: paths.orders },
    { label: "History", href: "/user/orders", icon: paths.back },
    { label: "Favorites", href: "/user/favorites", icon: paths.heart },
    { label: "Waitlist", href: "/user/favorites", icon: paths.card },
    { label: "Favorite brands & sellers", href: "/user/favorites", icon: paths.star },
  ],
  [
    { label: "Reviews & questions", href: "/user", icon: paths.star },
    { label: "Returns", href: "/user/returns", icon: paths.back },
    { label: "Chats", href: "/user/messages", icon: paths.card },
    { label: "About Hybreed Market", href: "/about", icon: paths.user },
    { label: "Push test", href: "/user/push-test", icon: paths.star },
  ],
  [
    { label: "Shop as a business", href: "/business", icon: paths.cart },
    { label: "Open a pickup point", href: "/categories", icon: paths.home },
    { label: "Open fulfillment center", href: "/categories", icon: paths.orders },
    { label: "Jobs at Hybreed", href: "/categories", icon: paths.user },
  ],
]

const services = [
  { label: "Sell on Hybreed", href: "/partners", bg: "#1D4ED8", icon: paths.shop },
  { label: "Secondhand", href: "/categories", bg: "#14B8A6", icon: paths.back },
  { label: "Auctions", href: "/categories", bg: "#F59E0B", icon: paths.orders },
  { label: "Wanted", href: "/categories", bg: "#2563EB", icon: paths.star },
  { label: "Deals", href: "/categories", bg: "#EF4444", icon: paths.cart },
  { label: "Track order", href: "/user/orders", bg: "#0EA5E9", icon: paths.home },
]

const card =
  "bg-white rounded-[24px] transition-transform duration-100 active:scale-[0.98]"

export const MobileAccount = ({ name }: { name: string }) => {
  const topUp = useTopUpSheet()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [dragY, setDragY] = useState(0)
  const dragStart = useRef<number | null>(null)

  const close = () => {
    if (closing) return
    setDragY(0)
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 260)
  }

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const onDragStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientY
  }
  const onDragMove = (e: React.TouchEvent) => {
    if (dragStart.current == null) return
    setDragY(Math.max(0, e.touches[0].clientY - dragStart.current))
  }
  const onDragEnd = () => {
    if (dragY > 80) close()
    else setDragY(0)
    dragStart.current = null
  }

  return (
    <div
      className="md:hidden pb-6"
      style={
        {
          "--page-bg": "#F5F5F7",
          "--card-bg": "#fff",
          "--muted": "#8A8A96",
          "--brand": "#2563EB",
          "--brand-tint": "#DBEAFE",
        } as React.CSSProperties
      }
    >
      {/* 1) TOP BAR */}
      <div className="bg-white rounded-b-[24px] h-16 flex items-center gap-3 px-3 -mx-2">
        <LocalizedClientLink
          href="/user/account"
          className="flex items-center gap-1 min-w-0 shrink"
        >
          <span
            className="text-[22px] font-bold text-[#1F1F23] whitespace-nowrap overflow-hidden max-w-[110px]"
            style={{
              maskImage:
                "linear-gradient(90deg,#000 75%,transparent)",
              WebkitMaskImage: "linear-gradient(90deg,#000 75%,transparent)",
            }}
          >
            {name}
          </span>
          <Chevron size={16} />
        </LocalizedClientLink>
        <span className="hidden xs:inline-flex bg-[#F0F0F3] text-[15px] text-[#1F1F23] px-3.5 py-2 rounded-[14px] shrink-0">
          Up to 40%
        </span>
        <span className="relative shrink-0 bg-[#2563EB] text-white text-[16px] font-bold px-3 py-1.5 rounded-2xl">
          Hybreed+
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center px-0.5">1</span>
        </span>
        <span className="relative shrink-0 text-[#2563EB] ml-auto">
          <BellIcon />
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center px-0.5">1</span>
        </span>
        <button
          aria-label="Menu"
          onClick={() => setOpen(true)}
          className="text-[#2563EB] shrink-0"
        >
          <BurgerIcon />
        </button>
      </div>

      {/* bottom-sheet menu */}
      {open && (
        <>
          <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeOut{from{opacity:1}to{opacity:0}}`}</style>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            style={{
              touchAction: "none",
              animation: closing
                ? "fadeOut .26s ease forwards"
                : "fadeIn .26s ease",
            }}
            onClick={close}
          />
          <aside
            className="fixed bottom-0 left-0 right-0 bg-[#F5F5F7] z-50 rounded-t-[24px] pt-1 px-2 pb-8 max-h-[85vh] overflow-y-auto overscroll-contain"
            style={{
              animation: closing ? undefined : "sheetUp .28s ease-out",
              transform: closing
                ? "translateY(100%)"
                : dragY
                  ? `translateY(${dragY}px)`
                  : undefined,
              transition: closing
                ? "transform .26s ease-in"
                : dragStart.current == null
                  ? "transform .2s ease-out"
                  : undefined,
            }}
          >
            <div
              className="pt-2"
              style={{ touchAction: "none" }}
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}
              onTouchCancel={onDragEnd}
            >
              <div className="flex justify-center pb-2">
                <span className="w-10 h-1.5 rounded-full bg-[#D4D4DC]" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-extrabold text-[#1F1F23] pl-[18px]">Menu</h2>
                <button
                  aria-label="Close menu"
                  onClick={close}
                  className="w-10 h-10 flex items-center justify-center text-[#6B6B76]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {drawerGroups.map((group, gi) => (
                <ul key={gi} className="bg-white rounded-[20px] pl-1 pr-1 py-1">
                  {group.map((i) => (
                    <li key={i.label}>
                      <LocalizedClientLink
                        href={i.href}
                        className="flex items-center gap-3.5 h-12 px-3.5 text-[15px] font-semibold text-[#1F1F23]"
                        onClick={close}
                      >
                        <span className="text-[#6B6B76]">
                          <OutlineIcon path={i.icon} />
                        </span>
                        {i.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </aside>
        </>
      )}

      <div className="px-2 space-y-2 mt-2">
        {/* 2) WALLET + INSTALLMENTS */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`${card} h-[130px] p-4 flex flex-col`}>
            <LocalizedClientLink href="/user/wallet" className="flex items-start justify-between">
              <p className="text-[18px] font-medium text-[#1F1F23] leading-none">0 XAF</p>
              <Chevron />
            </LocalizedClientLink>
            <p className="text-[15px] -mt-0.5" style={{ color: "var(--muted)" }}>
              Hybreed Wallet
            </p>
            <button onClick={() => topUp.open()} className="mt-auto h-12 w-full rounded-2xl bg-[#2563EB] text-white text-[20px] font-normal">
              Top up
            </button>
          </div>
          <LocalizedClientLink
            href="/user/wallet"
            className={`${card} h-[130px] p-4 flex flex-col`}
          >
            <div className="flex items-start justify-between">
              <p className="text-[18px] font-medium text-[#1F1F23] leading-none">
                100 000
              </p>
              <Chevron />
            </div>
            <p className="text-[15px] -mt-0.5" style={{ color: "var(--muted)" }}>
              XAF instalment limit
            </p>
            <p className="text-base text-[#1F1F23] mt-auto">No active orders</p>
          </LocalizedClientLink>
        </div>

        {/* 3) CASHBACK BANNER */}
        <LocalizedClientLink
          href="/user/my-hybreed"
          className={`${card} relative overflow-hidden h-[140px] p-4 block`}
          style={{ background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)" }}
        >
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <span
              className="text-[#1F1F23] leading-none"
              style={{ fontFamily: '"Funnel Display", sans-serif', fontSize: "20px", fontWeight: 700 }}
            >
              my
            </span>
            <HbMark h={20} />
          </div>
          <div className="flex flex-col justify-center h-full w-[62%]">
            <span className="bg-white rounded-full px-3 py-1 self-start inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[18px] leading-none font-medium text-[#1F1F23]">1 600</span>
              <span className="flex -space-x-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/pill-1.png" alt="" className="h-[22px] w-auto object-contain" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/pill-2.png" alt="" className="h-[22px] w-auto object-contain" />
              </span>
            </span>
            <p className="text-[14px] text-[#1F1F23]/80 mt-2 leading-snug font-[350]">
              Cashback points and
              <br />
              other perks
            </p>
            <span className="mt-2 h-9 w-24 rounded-[14px] bg-white text-[#2563EB] text-[14px] font-semibold inline-flex items-center justify-center">
              View
            </span>
          </div>
          {/* cashback mascot image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/categories/cashback-image.png"
            alt=""
            aria-hidden
            className="absolute bottom-0 right-3 h-[120px] object-contain" style={{transform:"scaleX(-1)"}}
          />
        </LocalizedClientLink>

        {/* 4) GIVEAWAY */}
        <div className={`${card} px-4 py-3`}>
          <LocalizedClientLink href="/categories" className="flex items-center gap-1 text-[18px] font-bold text-[#1F1F23]">
            Big giveaway <Chevron size={16} />
          </LocalizedClientLink>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-[#F0F0F3] rounded-[14px] px-3 py-1.5 flex items-center gap-1.5 shrink-0">
              <span className="text-[18px] font-semibold text-[#1F1F23]">0</span>
              <span className="text-[#2563EB]"><TicketIcon /></span>
            </span>
            <p className="text-[14px] text-[#1F1F23] leading-tight flex-1">
              Draw ended, results coming soon
            </p>
            <button className="h-9 px-5 rounded-2xl font-semibold text-[#2563EB] shrink-0" style={{ background: "var(--brand-tint)" }}>
              View
            </button>
          </div>
        </div>

        {/* 5) SERVICES */}
        <div className="bg-white rounded-[24px] p-4 pr-0">
          <h3 className="text-[22px] font-bold text-[#1F1F23]">Services</h3>
          <div
            className="flex gap-3 overflow-x-auto overscroll-x-contain mt-3 pb-1 pr-4"
            style={{
              scrollSnapType: "x proximity",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              touchAction: "pan-x pan-y",
            }}
          >
            {services.map((s) => (
              <LocalizedClientLink
                key={s.label}
                href={s.href}
                className="flex flex-col items-center w-[66px] shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <span
                  className="w-[66px] h-[66px] rounded-[18px] flex items-center justify-center text-white"
                  style={{ backgroundColor: s.bg }}
                >
                  <OutlineIcon path={s.icon} />
                </span>
                <span className="text-sm text-[#1F1F23] mt-1.5 truncate w-full text-center">
                  {s.label}
                </span>
              </LocalizedClientLink>
            ))}
          </div>
        </div>

        {/* 6) PROMO BANNER */}
        <div
          className="rounded-[24px] h-[150px] relative overflow-hidden"
          style={{ background: "linear-gradient(120deg,#2563EB,#60A5FA)" }}
        >
          <div className="absolute left-5 top-5">
            <p className="text-white text-xl font-extrabold leading-tight">
              Fresh deals<br />every day
            </p>
          </div>
          <span className="absolute bottom-2 right-3 text-[11px] text-white/70 bg-black/20 rounded px-1.5 py-0.5">
            Ad
          </span>
        </div>

        {/* 7) SHORTCUTS */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Favorites", sub: "0 items", href: "/user/favorites", icon: paths.heart },
            { label: "Purchases", sub: "View", href: "/user/orders", icon: paths.cart },
          ].map((t) => (
            <LocalizedClientLink
              key={t.label}
              href={t.href}
              className={`${card} h-[88px] p-4 flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[#2563EB]"><OutlineIcon path={t.icon} /></span>
                <div>
                  <p className="text-base font-semibold text-[#1F1F23]">{t.label}</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>{t.sub}</p>
                </div>
              </div>
              <Chevron />
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </div>
  )
}
