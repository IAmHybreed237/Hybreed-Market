"use client"

import { useEffect } from "react"

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent)

/**
 * Locks page scroll while `active` is true. overflow:hidden alone is not
 * reliable on iOS Safari, so there the body is pinned and the scroll
 * position restored on unlock.
 */
export const useBodyScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active || typeof document === "undefined") return

    const body = document.body
    const scrollY = window.scrollY
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }

    body.style.overflow = "hidden"
    document.documentElement.style.overscrollBehavior = "none"

    if (isIOS()) {
      body.style.position = "fixed"
      body.style.top = `-${scrollY}px`
      body.style.width = "100%"
    }

    return () => {
      body.style.overflow = prev.overflow
      document.documentElement.style.overscrollBehavior = ""
      if (isIOS()) {
        body.style.position = prev.position
        body.style.top = prev.top
        body.style.width = prev.width
        window.scrollTo(0, scrollY)
      }
    }
  }, [active])
}
