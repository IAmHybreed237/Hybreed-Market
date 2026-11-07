import { HttpTypes } from "@medusajs/types"
const CMFlag = () => (
  <svg
    width="18"
    height="13"
    viewBox="0 0 18 13"
    className="rounded-[2px] overflow-hidden shrink-0"
    aria-hidden
  >
    <rect width="6" height="13" fill="#009e60" />
    <rect x="6" width="6" height="13" fill="#ce1126" />
    <rect x="12" width="6" height="13" fill="#fcd116" />
    <path
      d="M9 3.9l.8 2.3h2.4l-1.9 1.5.7 2.3L9 8.6l-1.9 1.4.7-2.3-1.9-1.5h2.4z"
      fill="#fcd116"
    />
  </svg>
)

const WalletIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
)

import { CartDropdown } from "@/components/cells"
import { UserDropdown } from "@/components/cells/UserDropdown/UserDropdown"
import { CatalogDropdown } from "@/components/molecules/CatalogDropdown/CatalogDropdown"
import { NavbarSearch } from "@/components/molecules/NavbarSearch/NavbarSearch"
import { LocationSelector } from "@/components/molecules/LocationSelector/LocationSelector"
import { MobileHeader } from "@/components/organisms/Header/MobileHeader"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { HbMark } from "@/components/atoms"
import {
  LocationIcon,
  OrderIcon,
  HeartIcon,
  SparkIcon,
  ArrowDownIcon,
} from "@/icons"
import { listCategories } from "@/lib/data/categories"
import { listRegions } from "@/lib/data/regions"
import { retrieveCustomer } from "@/lib/data/customer"

const stripLink =
  "text-[14px] font-bold text-white hover:text-white/80 transition-colors"

const HeaderNavItem = ({
  href,
  icon,
  label,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  badge?: boolean
}) => (
  <LocalizedClientLink
    href={href}
    className="relative flex flex-col items-center justify-center gap-1 px-1 h-full text-white hover:text-white/80 transition-colors"
  >
    <span className="relative">
      {icon}
      {badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E83B55] text-[10px] font-bold text-white flex items-center justify-center">
          1
        </span>
      )}
    </span>
    <span className="text-[14px] leading-4 hidden sm:block">{label}</span>
  </LocalizedClientLink>
)

export const Header = async ({ locale }: { locale: string }) => {
  const user = await retrieveCustomer().catch(() => null)
  const isLoggedIn = Boolean(user)

  const regions = await listRegions()

  const { categories, parentCategories } = (await listCategories({
    query: { include_ancestors_tree: true },
  })) as {
    categories: HttpTypes.StoreProductCategory[]
    parentCategories: HttpTypes.StoreProductCategory[]
  }

  const vendorUrl =
    process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:9000/seller"

  return (
    <>
    <header
      className="header-gradient fixed lg:sticky top-0 left-0 right-0 z-40 rounded-b-[28px] lg:rounded-none"
      data-testid="header"
      data-status-color="#2563EB"
    >
      <div className="max-w-[1400px] mx-auto px-[5px] lg:px-10 pt-3 pb-6">
        {/* Row 1 - utility strip (desktop only) */}
        <div className="hidden lg:flex items-center justify-between mb-5 relative">
          <LocationSelector
            savedLocation={(user as any)?.addresses?.[0]?.city}
            className={`${stripLink} flex items-center gap-1`}
          />
          <nav
            className="absolute left-[calc(44%-277px)] flex items-center gap-6"
            aria-label="Services"
          >
            <a href={`${vendorUrl}/register`} className={stripLink}>
              Sell on Hybreed
            </a>
            <LocalizedClientLink href="/categories" className={stripLink}>
              Secondhand
            </LocalizedClientLink>
            <LocalizedClientLink href="/categories" className={stripLink}>
              Deals
            </LocalizedClientLink>
            <LocalizedClientLink href="/auctions" className={stripLink}>
              Auctions
            </LocalizedClientLink>
            <LocalizedClientLink href="/categories" className={stripLink}>
              Wanted
            </LocalizedClientLink>
            <a href={`${vendorUrl}/register`} className={stripLink}>
              Partner with us
            </a>
            <LocalizedClientLink href="/user/orders" className={stripLink}>
              Track order
            </LocalizedClientLink>
            <button type="button" className={`${stripLink} flex items-center gap-1`}>
              More
              <ArrowDownIcon size={12} />
            </button>
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            <LocalizedClientLink
              href="/user"
              className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 h-[24px] text-[12px] font-medium text-white hover:bg-white/30 transition-colors"
              data-testid="header-wallet"
            >
              <WalletIcon /> 0 XAF
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/user"
              className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 h-[24px] text-[12px] font-medium text-white hover:bg-white/30 transition-colors"
            >
              <HbMark h={13} /> 0 pts
            </LocalizedClientLink>
            <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 h-[24px] text-[12px] font-medium text-white">
              <CMFlag />
              CM · XAF
            </span>
          </div>
        </div>

        {/* Row 2 - main bar (desktop) */}
        <div
          className="hidden lg:flex items-center gap-4 relative"
          data-testid="header-top"
        >
          <LocalizedClientLink
            href="/"
            className="flex items-center h-12 shrink-0"
            data-testid="header-logo-link"
            aria-label="Hybreed home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Hybreed"
              width={523}
              height={133}
              className="w-[clamp(173px,calc(44vw-401px),213px)] h-auto max-w-none"
            />
          </LocalizedClientLink>
          <div className="absolute left-[44%] -translate-x-1/2 flex items-center gap-2 w-full max-w-[700px]">
            <CatalogDropdown
              categories={categories}
              parentCategories={parentCategories}
            />
            <NavbarSearch placeholder="Search Hybreed" />
          </div>
          <div
            className="absolute right-[calc((56%-350px)*0.04)] top-1/2 -translate-y-1/2 w-[calc((56%-350px)*0.92)] h-[65px] flex items-center justify-between"
            data-testid="header-actions"
          >
            <HeaderNavItem
              href="/categories"
              icon={<SparkIcon size={26} />}
              label="Assistant"
            />
            <HeaderNavItem
              href="/user/orders"
              icon={<OrderIcon size={26} />}
              label="Orders"
            />
            <HeaderNavItem
              href="/user/favorites"
              icon={<HeartIcon size={26} />}
              label="Favorites"
            />
            <div className="relative flex flex-col items-center justify-center gap-1 h-full text-white">
              <span className="relative">
                <UserDropdown
                  isLoggedIn={isLoggedIn}
                  userName={
                    [user?.first_name, user?.last_name]
                      .filter(Boolean)
                      .join(" ") || user?.email || undefined
                  }
                />
                {isLoggedIn && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E83B55] text-[10px] font-bold text-white flex items-center justify-center pointer-events-none">
                    1
                  </span>
                )}
              </span>
              <span className="text-[13px] leading-4 hidden sm:block">
                Profile
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 h-full text-white">
              <CartDropdown />
              <span className="text-[13px] leading-4 hidden sm:block">
                Cart
              </span>
            </div>

          </div>
        </div>

        <MobileHeader
          savedLocation={(user as any)?.addresses?.[0]?.city}
        />
      </div>
    </header>
    {/* spacer reserves the expanded header height on mobile - must sit outside the fixed header */}
    <div aria-hidden data-testid="mobile-header-spacer" className="lg:hidden h-[210px]" />
    </>
  )
}
