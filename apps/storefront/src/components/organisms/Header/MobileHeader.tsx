"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { NavbarSearch } from "@/components/molecules/NavbarSearch/NavbarSearch"
import { LocationSelector } from "@/components/molecules/LocationSelector/LocationSelector"

const ads = [
  { label: "Sneaker deals", img: "sneakers", href: "/categories/sneakers" },
  { label: "Beauty week", img: "hair-beauty", href: "/categories/beauty" },
  { label: "Phones fest", img: "phones", href: "/categories/phones" },
  { label: "Fresh fashion", img: "shirt", href: "/categories/shirt" },
  { label: "Sport picks", img: "sport", href: "/categories/sport" },
  { label: "Accessories", img: "accessories", href: "/categories/accessories" },
]

export const MobileHeader = ({
  savedLocation,
}: {
  savedLocation?: string | null
}) => {
  const [prog, setProg] = useState(0) // 0 = fully expanded, 1 = fully retracted

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
  const onUserPage = pathname?.includes("/user")

  // hide the whole header shell below lg on /user pages
  useEffect(() => {
    const el = document.querySelector('[data-testid="header"]')
    if (!el) return
    el.classList.toggle("hidden", Boolean(onUserPage))
    el.classList.toggle("lg:block", Boolean(onUserPage))
  }, [onUserPage])

  if (onUserPage) return null

  return (
    <div className="lg:hidden">
      {/* Row 1 - location + bell: retracts on scroll down */}
      <div
        className="flex items-center justify-between px-3 overflow-hidden"
        style={{
          maxHeight: `${(1 - prog) * 44}px`,
          opacity: 1 - prog,
          paddingTop: `${(1 - prog) * 8}px`,
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
        <NavbarSearch />
      </div>

      {/* Row 3 - ads: retracts on scroll down */}
      <div
        className="flex gap-5 px-3 scrollbar-hide overflow-hidden"
        style={{
          maxHeight: `${(1 - prog) * 88}px`,
          opacity: 1 - prog,
          paddingTop: `${(1 - prog) * 12}px`,
          paddingBottom: `${(1 - prog) * 20}px`,
        }}
      >
        {ads.map((ad) => (
          <LocalizedClientLink
            key={ad.label}
            href={ad.href}
            className="flex items-center gap-2 shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/images/categories/${ad.img}.png`}
              alt={ad.label}
              className="w-11 h-11 object-contain"
              loading="lazy"
            />
            <span className="text-[13px] font-semibold text-white leading-tight max-w-[80px]">
              {ad.label}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}