"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import {
  SparkIcon,
  TruckIcon,
  CreditIcon,
  RefreshIcon,
  DashboardIcon,
  CartIcon,
  HeadphoneIcon,
  AwardIcon,
  OrderIcon,
  InfoIcon,
} from "@/icons"

const ThickBurgerIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    aria-hidden
  >
    <line x1="3" y1="5.5" x2="21" y2="5.5" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18.5" x2="21" y2="18.5" />
  </svg>
)

// Hybreed equivalents of WB's service menu — Cameroon market adaptation
const serviceLinks: {
  label: string
  href: string
  accent?: boolean
  icon: React.ReactNode
}[] = [
  { label: "Deals & promos", href: "/categories", accent: true, icon: <SparkIcon size={20} /> },
  { label: "Imported finds", href: "/categories", icon: <TruckIcon size={20} /> },
  { label: "Gift cards", href: "/categories", icon: <CreditIcon size={20} /> },
  { label: "Secondhand", href: "/categories", icon: <RefreshIcon size={20} /> },
  { label: "Sell on Hybreed", href: "http://localhost:9000/seller/register", icon: <DashboardIcon size={20} /> },
  { label: "Wholesale", href: "/categories", icon: <CartIcon size={20} /> },
  { label: "Services", href: "/categories", icon: <HeadphoneIcon size={20} /> },
  { label: "Brands", href: "/categories", icon: <AwardIcon size={20} /> },
  { label: "Track order", href: "/user/orders", icon: <OrderIcon size={20} /> },
  { label: "Help & support", href: "/categories", icon: <InfoIcon size={20} /> },
]

const tileColors = [
  "#E05A5A", "#5B8DEF", "#3A3A42", "#E8963C", "#8D5BD0",
  "#2FA36B", "#D94F8F", "#4A6FA5",
]

const CatTile = ({ name, index }: { name: string; index: number }) => (
  <span
    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
    style={{ backgroundColor: tileColors[index % tileColors.length] }}
    aria-hidden
  >
    {name.charAt(0)}
  </span>
)

export const CatalogDropdown = ({
  categories,
  parentCategories,
}: {
  categories: HttpTypes.StoreProductCategory[]
  parentCategories: HttpTypes.StoreProductCategory[]
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parent_category_id === parentId)

  const linkCls =
    "flex items-center gap-3 text-base font-semibold text-[#242424] hover:text-action transition-colors py-1.5"

  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="catalog-button"
        className="flex items-center justify-center border border-white bg-white/20 hover:bg-white/30 text-white rounded-[14px] w-[65px] h-[65px] transition-colors"
        aria-label="Catalog"
      >
        <ThickBurgerIcon />
      </button>
      {open &&
        createPortal(
          <>
            {/* backdrop below the header */}
            <div
              className="fixed left-0 right-0 top-[140px] bottom-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* left drawer — ~25% width, white, below header */}
          <div
            className="fixed left-0 top-[140px] bottom-0 w-[25vw] min-w-[300px] bg-white shadow-2xl z-50 overflow-y-auto"
            data-testid="catalog-panel"
          >
            <ul className="p-4">
              {serviceLinks.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("http") ? (
                    <a
                      href={l.href}
                      className={`${linkCls} ${
                        l.accent ? "text-[#E83B55] font-bold" : ""
                      }`}
                    >
                      <span className="text-action shrink-0">{l.icon}</span>
                      {l.label}
                    </a>
                  ) : (
                    <LocalizedClientLink
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`${linkCls} ${
                        l.accent ? "text-[#E83B55] font-bold" : ""
                      }`}
                    >
                      <span className="text-action shrink-0">{l.icon}</span>
                      {l.label}
                    </LocalizedClientLink>
                  )}
                </li>
              ))}
            </ul>

            <hr className="mx-4 border-t" />

            <ul className="p-4">
              {parentCategories.map((parent, i) => {
                const children = childrenOf(parent.id)
                return (
                  <li key={parent.id}>
                    <LocalizedClientLink
                      href={`/categories/${parent.handle}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 text-base font-bold text-[#242424] hover:text-action transition-colors py-1.5"
                    >
                      <CatTile name={parent.name} index={i} />
                      {parent.name}
                    </LocalizedClientLink>
                    {children.length > 0 && (
                      <ul>
                        {children.map((child) => (
                          <li key={child.id}>
                            <LocalizedClientLink
                              href={`/categories/${child.handle}`}
                              onClick={() => setOpen(false)}
                              className="block text-sm text-secondary hover:text-action transition-colors py-1.5 pl-10"
                            >
                              {child.name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          </>,
          document.body
        )}
    </div>
  )
}
