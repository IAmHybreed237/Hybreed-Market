"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { useCartContext } from "@/components/providers"

const strokeProps = {
  fill: "none",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

const HomeSearchIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...strokeProps} aria-hidden>
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <circle cx="12" cy="14" r="2.6" />
    <line x1="14" y1="16" x2="16" y2="18" />
  </svg>
)
const MenuIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" {...strokeProps} aria-hidden>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
)
const WalletIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" {...strokeProps} aria-hidden>
    <path d="M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2" />
    <path d="M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
    <circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)
const CartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" {...strokeProps} aria-hidden>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)
const ProfileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" {...strokeProps} aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </svg>
)

export const MobileBottomNav = () => {
  const pathname = usePathname()
  const { cart } = useCartContext()
  const cartCount =
    cart?.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0

  const path = pathname?.split("/").slice(2).join("/") || ""
  const active = (href: string) =>
    href === "/" ? path === "" : path.startsWith(href.slice(1))

  const items = [
    { href: "/", Icon: HomeSearchIcon, label: "Home", badge: 0 },
    { href: "/catalog", Icon: MenuIcon, label: "Catalog", badge: 0 },
    { href: "/user/wallet", Icon: WalletIcon, label: "Wallet", badge: 0 },
    { href: "/cart", Icon: CartIcon, label: "Cart", badge: cartCount },
    { href: "/user", Icon: ProfileIcon, label: "Profile", badge: 1 },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/[0.08]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}
      data-testid="mobile-bottom-nav"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-14">
        {items.map(({ href, Icon, label, badge }) => {
          const isActive = active(href)
          return (
            <LocalizedClientLink
              key={label}
              href={href}
              aria-label={label}
              className={`relative flex-1 min-w-[48px] flex items-center justify-center transition-transform duration-100 active:scale-[0.92] active:opacity-80 ${
                isActive ? "text-[#2563EB]" : "text-[#6B7280]"
              }`}
            >
              <span
                className="relative"
                style={
                  isActive ? { strokeWidth: 2.25 } : undefined
                }
              >
                <Icon />
                {badge > 0 && (
                  <span
                    className="absolute flex items-center justify-center rounded-full bg-[#EF4444] text-white text-[12px] font-semibold"
                    style={{
                      minWidth: 18,
                      height: 18,
                      top: 4,
                      right: "calc(50% - 22px)",
                      boxShadow: "0 0 0 2px #fff",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
            </LocalizedClientLink>
          )
        })}
      </div>
    </nav>
  )
}
