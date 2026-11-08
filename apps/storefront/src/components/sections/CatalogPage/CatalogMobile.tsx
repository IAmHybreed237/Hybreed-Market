"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { LocationSelector } from "@/components/molecules/LocationSelector/LocationSelector"
import { CATEGORIES, FEATURES, HERO, PARTNERS } from "./catalog.config"
import { DepartmentSheet, type Department } from "./DepartmentSheet"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

const SearchGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)
const CameraGlyph = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/images/icons/camera-search.png"
    alt=""
    aria-hidden
    draggable={false}
    className="h-[26px] w-auto object-contain shrink-0 select-none"
  />
)
const BellGlyph = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
)
const SwapGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
)
const CrossGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
  </svg>
)

const ArtImg = ({
  id,
  className,
  eager,
}: {
  id: string
  className?: string
  eager?: boolean
}) => {
  const [failed, setFailed] = useState(false)
  if (failed)
    return <div className={`${className} rounded-[14px] bg-[#E4E4EA]`} aria-hidden />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={id.includes(".") ? `/catalog/${id}` : `/catalog/${id}.svg`}
      alt=""
      aria-hidden
      width={120}
      height={120}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      onError={() => setFailed(true)}
      className={`${className} object-contain pointer-events-none select-none`}
    />
  )
}

const TileIcon = ({ icon }: { icon: { bg: string; border?: string; text?: string; glyph?: "swap" | "cross" } }) => (
  <span
    className="absolute left-[15px] bottom-[13px] w-[27px] h-[27px] rounded-[9px] flex items-center justify-center z-[2] text-white text-[11px] font-bold"
    style={{ background: icon.bg, boxShadow: icon.border ? `inset 0 0 0 2px ${icon.border}` : undefined }}
  >
    {icon.glyph === "swap" ? <SwapGlyph /> : icon.glyph === "cross" ? <CrossGlyph /> : icon.text}
  </span>
)

export const CatalogMobile = ({
  remainingCategories = 20,
  departments = [],
}: {
  remainingCategories?: number
  departments?: Department[]
}) => {
  const router = useRouter()
  const [sheet, setSheet] = useState<string | null>(null)
  const [dept, setDept] = useState<Department | null>(null)
  useBodyScrollLock(!!sheet || !!dept)

  // desktop gets the normal site chrome + home page instead
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      const locale = window.location.pathname.split("/")[1] || ""
      router.replace(`/${locale}`)
    }
  }, [router])

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "")
  const findDept = (label: string) => {
    const needle = norm(label)
    if (!needle) return undefined
    const exact = departments.find(
      (d) => norm(d.name) === needle || norm(d.handle) === needle
    )
    if (exact) return exact
    return departments.find(
      (d) =>
        norm(d.name).startsWith(needle) ||
        needle.startsWith(norm(d.name)) ||
        norm(d.handle).startsWith(needle)
    )
  }

  const open = (href?: string, soon?: boolean, name?: string, label?: string) => {
    const match = label ? findDept(label) : undefined
    if (match) {
      setDept(match)
      return
    }
    if (href) {
      const locale = window.location.pathname.split("/")[1] || ""
      router.push(`/${locale}${href}`)
    } else if (soon) setSheet(name || "this section")
  }

  return (
    <div
      className="md:hidden bg-[#F5F5F7] min-h-[100dvh] text-[#1F1F23]"
      style={{ paddingBottom: "calc(56px + 16px + env(safe-area-inset-bottom,0px))" }}
    >
      {/* product pages pattern: this page supplies its own mobile top block */}
      <style>{`
        @media (max-width: 767.98px) {
          [data-testid="header"], [data-testid="mobile-header-spacer"], [data-testid="footer"] { display: none !important }
        }
      `}</style>

      {/* A. sticky top block */}
      <div
        className="sticky top-0 z-30 bg-[#F5F5F7] px-4 pb-[17px]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="h-11 flex items-center justify-between">
          <LocationSelector
            savedLocation="Buea"
            className="flex items-center gap-1.5 text-[18px] font-medium text-[#1F1F23]"
          />
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setSheet("Hybreed+")}
              className="relative h-[25px] min-w-[56px] px-2.5 rounded-[13px] bg-[#0F172A] text-white text-[13px] font-bold"
            >
              Hybreed+
              <span
                aria-hidden
                className="absolute -bottom-1 left-2 right-2 h-1.5 rounded-full blur-[5px]"
                style={{ background: "linear-gradient(90deg,#60A5FA,#2563EB)" }}
              />
            </button>
            <LocalizedClientLink
              href="/user"
              aria-label="Notifications"
              className="relative w-11 h-11 flex items-center justify-center text-[#2563EB]"
            >
              <BellGlyph />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#EF4444]" />
            </LocalizedClientLink>
          </div>
        </div>
        <LocalizedClientLink
          href="/categories"
          className="mt-[9px] h-[54px] w-full rounded-[20px] bg-[#F0F0F3] px-3.5 flex items-center gap-2.5 text-[#8A8A96]"
        >
          <SearchGlyph />
          <span className="flex-1 text-left text-[18px] truncate">Search</span>
          <CameraGlyph />
        </LocalizedClientLink>
      </div>

      <div className="px-4 flex flex-col gap-[9px]">
        {/* B. hero banner */}
        <LocalizedClientLink
          href={HERO.href}
          className="relative block w-full h-[142px] rounded-[32px] overflow-hidden shrink-0"
          style={{ background: HERO.bg }}
        >
          <p
            className="absolute left-[17px] top-[22px] max-w-[50%] text-[31px] font-extrabold leading-[0.85] tracking-tight"
            style={{ color: HERO.titleColor }}
          >
            {HERO.title[0]}
            <br />
            {HERO.title[1]}
          </p>
          <ArtImg
            id={HERO.img}
            eager
            className="absolute bottom-0 right-[6%] w-[56%] h-auto"
          />
        </LocalizedClientLink>

        {/* C. feature tiles */}
        <div className="grid grid-cols-2 gap-[9px]">
          {FEATURES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => open(t.href, t.soon, t.label, t.label)}
              className="relative h-[123px] rounded-[28px] bg-white overflow-hidden text-left transition-transform duration-100 active:scale-[0.97]"
            >
              <span className="absolute left-4 top-3.5 z-[2] max-w-[62%]">
                <span className="block text-[17px] min-[390px]:text-[18px] font-semibold leading-[1.1] tracking-[-0.3px] whitespace-pre-line text-[#1F1F23]">
                  {t.label}
                </span>
                {t.subtitle && (
                  <span className="block mt-1.5 text-[14px] leading-[15px] text-[#8A8A96] line-clamp-2">
                    {t.subtitle}
                  </span>
                )}
              </span>
              {t.icon && <TileIcon icon={t.icon} />}
              {t.img && <ArtImg id={t.img} className={`absolute z-[1] h-auto ${t.artClass}`} />}
            </button>
          ))}
        </div>

        {/* D. partner tiles */}
        <div className="grid grid-cols-2 gap-[9px]">
          {PARTNERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => open(t.href, t.soon, t.label, t.label)}
              className="relative h-[86px] rounded-[28px] bg-white overflow-hidden text-left transition-transform duration-100 active:scale-[0.97]"
            >
              <span className="absolute left-4 top-3.5 z-[2] max-w-[62%] text-[17px] min-[390px]:text-[18px] font-semibold text-[#1F1F23] whitespace-pre-line leading-[1.1] tracking-[-0.3px]">
                {t.label}
              </span>
              {t.icon && <TileIcon icon={t.icon} />}
              {t.img && <ArtImg id={t.img} className={`absolute z-[1] h-auto ${t.artClass}`} />}
            </button>
          ))}
        </div>

        {/* E. category grid */}
        <div className="grid grid-cols-4 gap-x-[9px]">
          {CATEGORIES.map((c) => {
            const inner =
              c.id === "catalog" ? (
                <div className="w-full h-full grid grid-cols-2 gap-[2px] p-[3px]">
                  {["mini-blocks", "mini-backpack", "mini-roller"].map((m) => (
                    <span key={m} className="rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                      <ArtImg id={m} className="w-[24px] h-[24px]" />
                    </span>
                  ))}
                  <span className="rounded-[14px] bg-white flex items-center justify-center text-[14px] text-[#8A8A96]">
                    +{remainingCategories}
                  </span>
                </div>
              ) : c.img ? (
                <ArtImg id={c.img} className="h-[59px] w-auto" />
              ) : null

            const cls =
              "block h-[63px] rounded-[22px] bg-white overflow-hidden flex items-center justify-center transition-transform duration-100 active:scale-[0.96]"
            const label = (
              <span className="block mt-1 h-[22px] text-[12px] min-[380px]:text-[13px] font-medium text-[#1F1F23] text-center truncate">
                {c.label}
              </span>
            )

            return (
              <div key={c.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => open(c.href, c.soon, c.label, c.label)}
                  className={`${cls} w-full`}
                >
                  {inner}
                </button>
                {label}
              </div>
            )
          })}
        </div>
      </div>

      {/* department slide-over */}
      <DepartmentSheet dept={dept} onClose={() => setDept(null)} />

      {/* coming soon sheet */}
      {sheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setSheet(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-[56] bg-[#F5F5F7] rounded-t-[24px] p-5 pb-8">
            <div className="w-10 h-1.5 rounded-full bg-[#D4D4DC] mx-auto mb-4" />
            <h3 className="text-[20px] font-semibold text-[#1F1F23] mb-2 capitalize">{sheet}</h3>
            <p className="text-[15px] text-[#1F1F23]/80 leading-[22px]">
              This section isn&apos;t live yet - we&apos;re working on it.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
