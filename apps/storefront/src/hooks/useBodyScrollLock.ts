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
export const useBodyScrollLock = (
  active: boolean,
  opts?: { pin?: boolean }
) => {
  const pin = opts?.pin !== false
  useEffect(() => {
    if (!active || typeof document === "undefined") return

    const body = document.body
    const docEl = document.documentElement
    const scrollY = window.scrollY
    const prev = {
      overflow: body.style.overflow,
      docOverflow: docEl.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }

    body.style.overflow = "hidden"
    // iOS scrolls the documentElement, not body - hiding only body is not
    // enough when pin is off (e.g. overlays that must keep keyboard focus)
    docEl.style.overflow = "hidden"
    docEl.style.overscrollBehavior = "none"

    if (pin && isIOS()) {
      body.style.position = "fixed"
      body.style.top = `-${scrollY}px`
      body.style.width = "100%"
    }

    return () => {
      body.style.overflow = prev.overflow
      docEl.style.overflow = prev.docOverflow
      docEl.style.overscrollBehavior = ""
      if (pin && isIOS()) {
        body.style.position = prev.position
        body.style.top = prev.top
        body.style.width = prev.width
        window.scrollTo(0, scrollY)
      }
    }
  }, [active])
}
