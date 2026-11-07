import { retrieveCustomer } from "@/lib/data/customer"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { TopUpButton } from "@/components/cells/TopUpSheet/TopUpSheet"
import { HbMark } from "@/components/atoms"
import { redirect } from "next/navigation"
import {
  OrderIcon,
  HeartIcon,
  CreditIcon,
  CartIcon,
  LocationIcon,
  SettingsIcon,
  InfoIcon,
  MessageIcon,
  ReviewIcon,
  AwardIcon,
  ProfileIcon,
  RefreshIcon,
  DashboardIcon,
  HomeIcon,
  ReturnIcon,
  NavigationIcon,
} from "@/icons"

const Chevron = ({ size = 18, cls = "text-[#8A8A96]" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
)
const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2" />
    <path d="M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
    <circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)
const CloverIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
    <circle cx="9" cy="9" r="3" /><circle cx="15" cy="9" r="3" />
    <circle cx="9" cy="15" r="3" /><circle cx="15" cy="15" r="3" />
  </svg>
)
const TicketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z" />
  </svg>
)

const navItems: { label: string; href: string; Icon: any }[] = [
  { label: "Home", href: "/user", Icon: HomeIcon },
  { label: "Orders", href: "/user/orders", Icon: OrderIcon },
  { label: "Purchases", href: "/user/orders", Icon: CartIcon },
  { label: "Favorites", href: "/user/favorites", Icon: HeartIcon },
  { label: "Reviews & questions", href: "/user", Icon: ReviewIcon },
  { label: "Returns", href: "/user/returns", Icon: ReturnIcon },
  { label: "Payment methods", href: "/user", Icon: CreditIcon },
  { label: "Details", href: "/user/settings", Icon: NavigationIcon },
]
const navExtras: { label: string; href: string; Icon: any }[] = [
  { label: "Chats", href: "/user/messages", Icon: MessageIcon },
  { label: "Addresses", href: "/user/addresses", Icon: LocationIcon },
  { label: "Support", href: "/user", Icon: InfoIcon },
  { label: "Settings", href: "/user/settings", Icon: SettingsIcon },
  { label: "Sell on Hybreed", href: "/partners", Icon: DashboardIcon },
]

const cardTitleStyle: React.CSSProperties = {
  fontFamily:
    '"Google Sans", "WB Currency", "Segoe UI", -apple-system, Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  fontSize: "19px",
  fontWeight: 600,
  lineHeight: "26px",
  color: "#1F1F23",
}

const cardCls =
  "rounded-[20px] bg-white transition-all duration-150 hover:bg-[#FAFAFB] active:scale-[0.99] cursor-pointer"

import { ProductShelf } from "@/components/sections"
import { MobileAccount } from "./MobileAccount"

export default async function UserPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await retrieveCustomer().catch(() => null)
  if (!user) redirect("/login")

  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email

  return (
    <main
      className="w-full mx-auto px-[5px] pb-12"
      style={
        {
          maxWidth: 1400,
          "--page-bg": "#F5F5F7",
          "--card-bg": "#FFFFFF",
          "--muted": "#8A8A96",
          "--brand": "#2563EB",
          "--brand-tint": "#DBEAFE",
          background: "transparent",
        } as React.CSSProperties
      }
    >
      {/* ===== MOBILE ACCOUNT (below 768px) ===== */}
      <MobileAccount name={name} />

      {/* ===== DESKTOP ===== */}
      <div
        className="hidden md:grid grid-cols-[340px_1fr] mt-4"
        style={{ gap: 24 }}
      >
        {/* ===== SIDEBAR ===== */}
        <aside className="min-w-0 bg-white rounded-[20px] p-5 self-start">
          {/* name row */}
          <div className="flex items-center gap-2">
            <LocalizedClientLink
              href="/user/settings"
              className="flex items-center gap-1.5 text-[22px] font-bold text-[#1F1F23] truncate"
            >
              {name}
              <Chevron size={18} />
            </LocalizedClientLink>
            <span className="ml-auto relative shrink-0 text-[#6B6B76]">
              <BellIcon />
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center"
              >
                1
              </span>
            </span>
          </div>

          {/* details + pills */}
          <div className="flex items-center gap-2 mt-1">
            <LocalizedClientLink
              href="/user/settings"
              className="text-[13px] text-[#8A8A96] hover:text-[#2563EB]"
            >
              Your details
            </LocalizedClientLink>
            <span className="text-[11px] font-semibold bg-[#EDEDF0] text-[#6B6B76] px-1.5 py-0.5 rounded-md">
              HB ID
            </span>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#DBEAFE", color: "#1D4ED8" }}
            >
              Hybreed+
            </span>
          </div>

          {/* info chips */}
          <div className="mt-4 space-y-2">
            <div className="bg-[#EDEDF0] rounded-[14px] px-3.5 py-2 text-sm text-[#1F1F23]">
              Personal discount <span className="font-semibold">up to 40%</span>
            </div>
            <div className="bg-[#EDEDF0] rounded-[14px] px-3.5 py-2 text-sm text-[#1F1F23]">
              Pay on delivery <span className="font-semibold">up to 35,000 XAF</span>
            </div>
          </div>

          {/* nav list */}
          <ul className="mt-4">
            {navItems.map(({ label, href, Icon }, i) => (
              <li key={label}>
                <LocalizedClientLink
                  href={href}
                  className={`flex items-center gap-3.5 h-10 text-[15px] ${
                    i === 0
                      ? "text-[#2563EB]"
                      : "text-[#1F1F23] hover:text-[#2563EB]"
                  } transition-colors`}
                >
                  <span
                    className={i === 0 ? "text-[#2563EB]" : "text-[#6B6B76]"}
                  >
                    <Icon size={24} />
                  </span>
                  {label}
                </LocalizedClientLink>
              </li>
            ))}
            <li className="my-2 border-t border-black/[0.06]" />
            {navExtras.map(({ label, href, Icon }) => (
              <li key={label}>
                {href.startsWith("http") ? (
                  <a
                    href={href}
                    className="flex items-center gap-3.5 h-10 text-[15px] text-[#1F1F23] hover:text-[#2563EB] transition-colors"
                  >
                    <span className="text-[#6B6B76]"><Icon size={24} /></span>
                    {label}
                  </a>
                ) : (
                  <LocalizedClientLink
                    href={href}
                    className="flex items-center gap-3.5 h-10 text-[15px] text-[#1F1F23] hover:text-[#2563EB] transition-colors"
                  >
                    <span className="text-[#6B6B76]"><Icon size={24} /></span>
                    {label}
                  </LocalizedClientLink>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* ===== MAIN COLUMN ===== */}
        <section className="min-w-0 space-y-3">
          {/* wallet card */}
          <div className={`${cardCls} p-5 h-[100px] flex items-center justify-between`}>
            <div>
              <div className="flex items-center gap-2.5 text-[#2563EB]">
                <WalletIcon />
                <p className="text-[22px] font-semibold text-[#1F1F23]">0 XAF</p>
              </div>
              <p className="text-[17px] font-[350] mt-1" style={{ color: "var(--muted)" }}>
                Hybreed Wallet
              </p>
            </div>
            <TopUpButton className="h-11 px-7 rounded-[14px] bg-[#2563EB] text-white text-base font-semibold hover:bg-[#1D4ED8] transition-colors" />
          </div>

          {/* installments card */}
          <LocalizedClientLink
            href="/user"
            className={`${cardCls} p-5 h-[96px] flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/installments.png" alt="" className="w-8 h-8 object-contain" />
              <div>
                <p style={cardTitleStyle}>Installments</p>
                <p className="text-[17px] font-[350]" style={{ color: "var(--muted)" }}>
                  Nothing here yet
                </p>
              </div>
            </div>
            <Chevron size={20} />
          </LocalizedClientLink>

          {/* cashback banner - My Hybreed */}
          <div
            className="relative overflow-hidden rounded-[20px] h-[100px] flex items-center justify-between pl-6 pr-5"
            style={{
              background: "linear-gradient(90deg, #DBEAFE, #E0E7FF)",
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[22px] font-bold text-[#1F1F23]">my</span>
                <HbMark h={22} />
                <span className="bg-white text-[#1F1F23] font-bold px-3 py-1 rounded-full text-[15px] inline-flex items-center whitespace-nowrap">
                  1 600
                  <span className="flex -space-x-2 ml-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/pill-1.png" alt="" className="h-[20px] w-auto object-contain" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/pill-2.png" alt="" className="h-[20px] w-auto object-contain" />
                  </span>
                </span>
              </div>
              <p className="text-[17px] text-[#1F1F23]/70 mt-1.5 font-[350]">
                Cashback points and other perks
              </p>
            </div>
            {/* cashback mascot image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/categories/cashback-image.png"
              alt=""
              aria-hidden
              className="absolute bottom-0 right-28 h-[90px] object-contain hidden md:block"
            />
            <LocalizedClientLink
              href="/user/my-hybreed"
              className="h-11 px-7 rounded-[14px] bg-white text-[#2563EB] text-base font-semibold flex items-center shrink-0"
            >
              View
            </LocalizedClientLink>
          </div>

          {/* shortcut cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Favorites", count: "0 items", href: "/user/favorites", Icon: HeartIcon },
              { label: "Purchases", count: "View", href: "/user/orders", Icon: CartIcon },
            ].map(({ label, count, href, Icon }) => (
              <LocalizedClientLink
                key={label}
                href={href}
                className={`${cardCls} p-5 h-[96px] flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#2563EB]"><Icon size={24} /></span>
                  <div>
                    <p style={cardTitleStyle}>{label}</p>
                    <p className="text-[17px] font-[350]" style={{ color: "var(--muted)" }}>{count}</p>
                  </div>
                </div>
                <Chevron size={20} />
              </LocalizedClientLink>
            ))}
          </div>

          {/* awaiting review */}
          <LocalizedClientLink
            href="/user"
            className={`${cardCls} p-5 h-[96px] flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <span className="text-[#2563EB]"><ReviewIcon size={24} /></span>
              <div>
                <p style={cardTitleStyle}>Awaiting review</p>
                <p className="text-[17px] font-[350]" style={{ color: "var(--muted)" }}>3 items</p>
              </div>
            </div>
            <Chevron size={20} />
          </LocalizedClientLink>

          {/* promo / giveaway banner - same size as the card above */}
          <LocalizedClientLink
            href="/categories"
            className={`${cardCls} p-0 h-[130px] flex items-center overflow-hidden`}
          >
            <div
              className="h-full w-[220px] shrink-0 flex items-end p-4"
              style={{
                background:
                  "linear-gradient(135deg, #2563EB 0%, #60A5FA 60%, #93C5FD 100%)",
                borderRadius: "0 14px 14px 0",
              }}
            >
              <span className="text-white text-sm font-bold leading-tight">
                Weekly<br />giveaway
              </span>
            </div>
            <div className="flex items-center gap-4 px-5 flex-1 min-w-0">
              <span className="bg-[#F3F4F6] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shrink-0">
                <span className="text-[#2563EB]"><TicketIcon /></span>
                <span className="font-bold text-[#1F1F23]">0</span>
              </span>
              <p className="text-sm text-[#1F1F23] truncate">
                Draw ended: results coming soon
              </p>
            </div>
            <span
              className="h-11 px-7 rounded-[14px] text-[#2563EB] text-base font-semibold flex items-center mr-5 shrink-0"
              style={{ background: "var(--brand-tint)" }}
            >
              View
            </span>
          </LocalizedClientLink>
        </section>
      </div>

      {/* products - full width, 5 per row */}
      <div className="mt-6">
        <ProductShelf
          heading="Recommended for you"
          locale={locale}
          limit={5}
          perRow={5}
        />
      </div>
    </main>
  )
}
