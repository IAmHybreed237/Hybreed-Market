"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/** Resets scroll to top on route change - the sticky header otherwise overlaps content after restored scroll. */
export const ScrollReset = () => {
  const pathname = usePathname()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
