"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { MessageIcon } from "@/icons"
import { VENDOR_URL } from "@/lib/vendor"

// white logo.png recoloured with the brand gradient via a CSS mask, so it
// reads on the white bar without distorting the artwork (523×133)
const PartnersLogo = () => (
  <LocalizedClientLink
    href="/partners"
    aria-label="Hybreed Partners home"
    className="flex items-end gap-1.5 shrink-0"
  >
    {/* negative margin = the "y" descender (30/133 of the height), so the
        logo's baseline sits on the flex end line */}
    <span
      aria-hidden
      className="block h-[24px] lg:h-[26px] -mb-[5.4px] lg:-mb-[5.9px] aspect-[523/133]"
      style={{
        background: "linear-gradient(90deg, #2563EB 0%, #7C3AED 100%)",
        WebkitMaskImage: "url(/images/logo.png)",
        maskImage: "url(/images/logo.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }}
    />
    <span className="text-[22px] lg:text-[24px] font-semibold leading-none -mb-[0.12em] tracking-[-0.02em] text-[#1F1F23]">
      partners
    </span>
  </LocalizedClientLink>
)

const navLinks = [
  { label: "Registration", href: "/partners", activeFor: ["/partners", "/partners/signup"] },
  { label: "Analytics", href: "/partners#tools", activeFor: [] },
  { label: "Seller courses", href: "/partners#tools", activeFor: [] },
]

export const PartnersHeader = () => {
  const pathname = usePathname()
  return (
  <header
    className="sticky top-0 z-40 bg-white"
    data-testid="partners-header"
  >
    <div className="max-w-[1440px] mx-auto h-[52px] lg:h-[60px] px-4 lg:px-6 flex items-center">
      <PartnersLogo />

      <nav
        aria-label="Partners"
        className="hidden md:flex items-center gap-8 ml-12"
      >
        {navLinks.map((l) => {
          const active = l.activeFor.some(
            (p) => pathname === p || pathname.endsWith(p)
          )
          return (
            <LocalizedClientLink
              key={l.label}
              href={l.href}
              className={`text-[16px] font-medium text-[#1F1F23] hover:text-[#2563EB] transition-colors px-3 py-1.5 rounded-[10px] ${
                active ? "bg-[#F0F0F3] hover:text-[#1F1F23]" : ""
              }`}
            >
              {l.label}
            </LocalizedClientLink>
          )
        })}
      </nav>

      <div className="hidden md:flex items-center gap-3 ml-auto">
        <a
          href="https://wa.me/"
          aria-label="Seller support"
          title="Seller support"
          className="w-9 h-9 rounded-[10px] bg-[#F0F0F3] text-[#1F1F23] flex items-center justify-center hover:bg-[#E6E6EA] transition-colors"
        >
          <MessageIcon size={18} />
        </a>
        <a
          href={`${VENDOR_URL}/login`}
          className="h-9 px-4 rounded-[10px] bg-[#F0F0F3] text-[16px] font-medium text-[#1F1F23] flex items-center hover:bg-[#E6E6EA] transition-colors"
        >
          Seller sign in
        </a>
      </div>
    </div>
  </header>
  )
}
