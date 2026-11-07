import { retrieveCustomer } from "@/lib/data/customer"
import { getWalletStatement } from "@/lib/data/wallet"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { TopUpButton } from "@/components/cells/TopUpSheet/TopUpSheet"
import { redirect } from "next/navigation"
import { WalletBalance } from "./WalletBalance"
import { WalletMobile } from "./WalletMobile"

const Chevron = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8A8A96]" aria-hidden><polyline points="9 18 15 12 9 6" /></svg>
)
const SparkIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 8l1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2z" /></svg>
)
const CloverIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden><circle cx="9" cy="9" r="3" /><circle cx="15" cy="9" r="3" /><circle cx="9" cy="15" r="3" /><circle cx="15" cy="15" r="3" /></svg>
)
const CoinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5h5M9.5 14.5h5" /></svg>
)
const TicketIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z" /></svg>
)
const GiftIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>
)
const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2" /><path d="M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" /><circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none" /></svg>
)
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
)
const HeadsetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
)
const ListIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
)

const card = "bg-white rounded-[20px]"
const tabs = [
  "Home", "My Hybreed", "Orders", "Purchases", "Hybreed Travel",
  "Favorites", "Hybreed Wallet", "Reviews & questions", "More sections",
]

const fmt = (n: number) =>
  `${Math.round(n).toLocaleString("en-US").replace(/,/g, " ")} XAF`

export default async function WalletPage() {
  const user = await retrieveCustomer().catch(() => null)
  if (!user) redirect("/login")

  const wallet = await getWalletStatement().catch(() => null)
  const balance = wallet?.balance ?? 0
  const points = wallet?.points ?? 0
  const balances = [
    { value: fmt(balance), label: "Hybreed Wallet", href: "/user/wallet", tint: "#fff", icon: <SparkIcon />, active: true },
    { value: "100,000 XAF", label: "Pay in installments", href: "/user", tint: "#DBEAFE", icon: <CloverIcon /> },
    { value: `${Math.round(points).toLocaleString("en-US")} HB`, label: "Cashback", href: "/user", tint: "#E0F2FE", icon: <CoinIcon /> },
    { value: "0 XAF", label: "Certificates", href: "/user", tint: "#E0E7FF", icon: <TicketIcon /> },
    { value: "0 XAF", label: "Gift funds", href: "/user", tint: "#DBEAFE", icon: <GiftIcon /> },
  ]

  return (
    <main
      className="w-full max-w-[1400px] mx-auto px-[5px] pb-10"
      style={
        {
          "--page-bg": "#F5F5F7",
          "--card-bg": "#FFFFFF",
          "--muted": "#8A8A96",
          "--brand": "#2563EB",
          "--brand-tint": "#DBEAFE",
        } as React.CSSProperties
      }
    >
      {/* ===== MOBILE (<768px) ===== */}
      <WalletMobile balance={balance} points={points} />

      {/* ===== TABLET (768-1023) ===== */}
      <div className="hidden md:block lg:hidden">
        <div className={`${card} mt-3 p-5`}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#1F1F23]">HB Wallet</h1>
            <Chevron size={18} />
          </div>
          <div className="flex items-baseline gap-3 mt-3 flex-wrap">
            <p className="text-4xl font-extrabold text-[#1F1F23]">{fmt(balance)}</p>
            <p className="text-sm text-[#8A8A96]">
              Installments up to <span className="font-semibold text-[#1F1F23]">100,000 XAF</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { title: "1,600", sub: "HB points · cashback", tint: "#DBEAFE", iconColor: "#2563EB" },
            { title: "Gift cards", sub: "Buy & redeem", tint: "#E0E7FF", iconColor: "#1D4ED8" },
            { title: "Gift funds", sub: "Group gifts", tint: "#DBEAFE", iconColor: "#2563EB" },
          ].map((t) => (
            <LocalizedClientLink key={t.title} href="/user" className={`${card} p-4 flex flex-col items-start`}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: t.tint, color: t.iconColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
              </span>
              <p className="text-[15px] font-semibold text-[#1F1F23] truncate w-full">{t.title}</p>
              <p className="text-xs text-[#8A8A96] mt-0.5 truncate w-full">{t.sub}</p>
            </LocalizedClientLink>
          ))}
        </div>
      </div>

      {/* ===== DESKTOP (1024+) ===== */}
      <div className="hidden lg:block">
        {/* 1) top tab nav */}
        <nav className="flex items-center justify-between h-11 mb-1" aria-label="Account sections">
          {tabs.map((t) => (
            <LocalizedClientLink
              key={t}
              href="/user"
              className={`text-[15px] font-semibold transition-colors ${
                t === "Hybreed Wallet" ? "text-[#2563EB]" : "text-[#1F1F23] hover:text-[#2563EB]"
              }`}
            >
              {t}
            </LocalizedClientLink>
          ))}
        </nav>

        {/* 2) three-column grid */}
        <div className="grid grid-cols-[290px_minmax(0,1fr)_330px] items-start" style={{ columnGap: 40 }}>
          {/* 3) left - balances */}
          <div className="flex flex-col h-[350px]">
            {balances.map((b) => (
              <LocalizedClientLink
                key={b.label}
                href={b.href}
                aria-current={b.active ? "page" : undefined}
                className={`flex items-center gap-3.5 p-3 w-full flex-1 rounded-2xl transition-colors ${
                  b.active ? "bg-white" : "hover:bg-white/60"
                }`}
              >
                <span
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[#2563EB] shrink-0"
                  style={{ background: b.tint, border: b.active ? "1px solid #E5E7EB" : "none" }}
                >
                  {b.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-[20px] font-semibold text-[#242424] truncate">{b.value}</span>
                  <span className="block text-[16px]" style={{ color: "var(--muted)" }}>{b.label}</span>
                </span>
              </LocalizedClientLink>
            ))}
          </div>

          {/* 4) centre */}
          <div className="min-w-0">
            {/* 4a. main wallet card */}
            <div
              className="rounded-[24px] p-[22px] max-w-[650px] min-h-[330px] flex flex-col mx-auto border-[3px] border-white"
              style={{ background: "linear-gradient(180deg,#BFDBFE 0%,#DBEAFE 100%)" }}
            >
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-medium text-[#1F1F23]">Hybreed Wallet</h1>
                <LocalizedClientLink href="/user/my-hybreed" className="flex items-center">
                  <span className="text-[11px] uppercase font-semibold text-[#2563EB] bg-white/70 px-2.5 py-[3px] rounded-xl">
                    Start
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#1F1F23]"><polyline points="9 18 15 12 9 6" /></svg>
                </LocalizedClientLink>
              </div>
              <WalletBalance balance={balance} />
              <p className="text-sm mt-1" style={{ color: "#5B6B8A" }}>
                Total for purchases
              </p>
              {/* inner card */}
              <div className="mt-3.5 rounded-2xl h-[75px] px-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.7)" }}>
                <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#2563EB] shrink-0">
                  <WalletIcon />
                </span>
                <span>
                  <span className="block text-[15px] font-medium text-[#1F1F23]">{fmt(balance)}</span>
                  <span className="block text-[16px]" style={{ color: "var(--muted)" }}>Main funds</span>
                </span>
              </div>
              {/* top up button */}
              <TopUpButton className="mt-auto w-full h-[75px] bg-white rounded-2xl flex flex-col items-center justify-center gap-1 text-[#2563EB] hover:bg-[#F8FAFF] transition-all active:scale-[0.99]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span className="text-base font-semibold">Top up</span>
              </TopUpButton>
            </div>

            {/* 4b. upgrade card */}
            <div className={`${card} mt-4 p-[18px] min-h-[145px] flex items-center max-w-[650px] mx-auto`}>
              <div className="max-w-[62%]">
                <h2 className="text-[20px] font-semibold text-[#1F1F23]">
                  Increase your discount to 7%
                </h2>
                <p className="text-base mt-2 leading-snug" style={{ color: "var(--muted)" }}>
                  Get the most from Hybreed Wallet: a higher discount and no limits
                </p>
                <button className="mt-3 h-9 px-3.5 rounded-[10px] bg-[#2563EB] text-white text-[20px] font-semibold">
                  Upgrade for free
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/categories/upgrade-wallet.png"
                alt=""
                aria-hidden
                className="ml-auto w-[90px] h-[90px] object-contain pr-1"
              />
            </div>

            {/* 4c. pending top-ups */}
            {(wallet?.topups ?? []).some((t) => t.status === "pending") && (
              <div className={`${card} mt-4 p-[18px] max-w-[650px] mx-auto`}>
                <h2 className="text-xl font-semibold text-[#1F1F23]">Pending top-ups</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {wallet!.topups
                    .filter((t) => t.status === "pending")
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-[15px]">
                        <span className="text-[#1F1F23]">
                          Top-up · {new Date(t.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <span className="font-semibold text-[#F59E0B]">
                          +{Math.round(Number((t.amount as any)?.numeric ?? t.amount)).toLocaleString("en-US").replace(/,/g, " ")} XAF · pending
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 4d. transaction history */}
            <div className={`${card} mt-4 p-[18px] max-w-[650px] mx-auto`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#1F1F23]">Transaction history</h2>
                <LocalizedClientLink href="/user" className="flex items-center gap-0.5 text-[15px]" style={{ color: "var(--muted)" }}>
                  All <Chevron />
                </LocalizedClientLink>
              </div>
              {(wallet?.entries ?? []).length === 0 ? (
                <div className="py-6 flex flex-col items-center gap-2" style={{ color: "var(--muted)" }}>
                  <ListIcon />
                  <p className="text-[15px]">No transactions yet</p>
                </div>
              ) : (
                <div className="mt-3 flex flex-col">
                  {wallet!.entries.map((e) => {
                    const v = Number((e.amount as any)?.numeric ?? e.amount)
                    const credit = v >= 0
                    const isPoints = e.type === "points_earn" || e.type === "points_redeem"
                    const pts = Number((e.metadata as any)?.points ?? Math.abs(Math.round(v)))
                    return (
                      <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-[#F0F0F3] last:border-0">
                        <div className="min-w-0">
                          <p className="text-[15px] font-medium text-[#1F1F23] truncate">
                            {e.description ||
                              (e.type === "points_earn"
                                ? "HB points earned"
                                : e.type === "topup"
                                  ? "Wallet top-up"
                                  : e.type === "purchase"
                                    ? "Order payment"
                                    : e.type === "refund"
                                      ? "Refund"
                                      : e.type)}
                          </p>
                          <p className="text-[13px] text-[#8A8A96]">
                            {new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <span className={`text-[15px] font-semibold shrink-0 ml-3 ${credit ? "text-[#16A34A]" : "text-[#1F1F23]"}`}>
                          {isPoints
                            ? `${credit ? "+" : "−"}${pts.toLocaleString("en-US")} HB`
                            : `${credit ? "+" : "−"}${Math.abs(Math.round(v)).toLocaleString("en-US").replace(/,/g, " ")} XAF`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 5) right column */}
          <div className="hidden min-[1100px]:flex flex-col gap-2">
            {[
              { label: "Questions & answers", icon: <InfoIcon /> },
              { label: "Chat with support", icon: <HeadsetIcon /> },
            ].map((c) => (
              <LocalizedClientLink
                key={c.label}
                href="/user"
                className={`${card} h-[57px] px-3.5 flex items-center gap-3 text-base font-semibold text-[#1F1F23] hover:bg-[#FAFAFB] transition-colors`}
              >
                <span style={{ color: "var(--muted)" }}>{c.icon}</span>
                {c.label}
              </LocalizedClientLink>
            ))}
            <LocalizedClientLink
              href="/user/wallet"
              className={`${card} h-[72px] px-4 mt-1 flex items-center gap-4 hover:bg-[#FAFAFB] transition-colors`}
            >
              <span className="text-[#2563EB]"><WalletIcon /></span>
              <span className="text-[15px] font-semibold text-[#1F1F23]">Manage your finances</span>
              <span className="ml-auto"><Chevron size={18} /></span>
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </main>
  )
}
