"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { MobileSearch } from "@/components/molecules/NavbarSearch/MobileSearch"
import { LocationSelector } from "@/components/molecules/LocationSelector/LocationSelector"

export const MobileHeader = ({
  savedLocation,
}: {
  savedLocation?: string | null
}) => {
  const [prog, setProg] = useState(0) // 0 = fully expanded, 1 = fully retracted
  const [searchActive, setSearchActive] = useState(false)
  const [anim, setAnim] = useState(false)
  const effectiveProg = searchActive ? 1 : prog

  // animate the retract/expand only when search mode toggles - scroll-driven
  // prog changes stay instant so they keep up with the scroll position
  useEffect(() => {
    setAnim(true)
    const t = setTimeout(() => setAnim(false), 400)
    return () => clearTimeout(t)
  }, [searchActive])
  const rowTransition = anim
    ? "max-height .35s ease, opacity .3s ease, padding-top .35s ease, padding-bottom .35s ease"
    : "none"

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        // collapse progress: starts almost immediately, done by ~170px
        const target = Math.min(Math.max((y - 8) / 150, 0), 1)
        setProg(target)
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const pathname = usePathname()
  const onUserPage =
    pathname?.includes("/user") || pathname?.includes("/search")

  // hide the whole header shell + its spacer below lg on /user and /search pages
  useEffect(() => {
    const el = document.querySelector('[data-testid="header"]')
    const spacer = document.querySelector(
      '[data-testid="mobile-header-spacer"]'
    )
    el?.classList.toggle("hidden", Boolean(onUserPage))
    el?.classList.toggle("lg:block", Boolean(onUserPage))
    spacer?.classList.toggle("hidden", Boolean(onUserPage))
  }, [onUserPage])

  if (onUserPage) return null

  return (
    <div className="lg:hidden">
      {/* Row 1 - location + bell: retracts on scroll down */}
      <div
        className="flex items-center justify-between px-3 overflow-hidden"
        style={{
          maxHeight: `${(1 - effectiveProg) * 44}px`,
          opacity: 1 - effectiveProg,
          paddingTop: `${(1 - effectiveProg) * 8}px`,
          transition: rowTransition,
        }}
      >
        <LocationSelector
          savedLocation={savedLocation}
          className="flex items-center gap-1.5 text-[15px] font-semibold text-white"
        />
        <LocalizedClientLink
          href="/user"
          aria-label="Notifications"
          className="relative text-white"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E83B55] text-[10px] font-bold text-white flex items-center justify-center">
            1
          </span>
        </LocalizedClientLink>
      </div>

      {/* Row 2 - search: always visible */}
      <div className="px-3 pt-2.5" data-testid="header-search-mobile">
        <MobileSearch onActiveChange={setSearchActive} />
      </div>

      {/* Row 3 - offers banner: retracts on scroll down */}
      <div
        className="flex items-center justify-between gap-3 px-3 overflow-hidden"
        style={{
          maxHeight: `${(1 - effectiveProg) * 88}px`,
          opacity: 1 - effectiveProg,
          paddingTop: `${(1 - effectiveProg) * 8}px`,
          paddingBottom: `${(1 - effectiveProg) * 10}px`,
          transition: rowTransition,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/offers/designer.png"
          alt="Offers"
          className="h-11 w-auto object-contain shrink-0"
        />
        <LocalizedClientLink
          href="/categories"
          className="shrink-0 bg-white text-[#2563EB] text-[13px] font-bold rounded-full px-4 py-1.5"
        >
          Offers
        </LocalizedClientLink>
      </div>
    </div>
  )
}