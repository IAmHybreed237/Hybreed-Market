"use client"

import { usePathname } from "next/navigation"

/** Hides the footer on mobile for product pages - keeps it everywhere else. */
export const ConditionalFooter = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const pathname = usePathname()
  const isProductPage = /\/products\//.test(pathname)
  const isCartPage = /\/cart\/?$/.test(pathname)
  return (
    <div className={isProductPage || isCartPage ? "hidden md:block" : ""}>{children}</div>
  )
}
