"use client"

import { useEffect } from "react"

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent)

// Multiple overlays can hold the lock at once (e.g. a drawer inside an
// open sheet). Each used to snapshot body styles independently, so the
// last cleanup could restore "hidden" and freeze the page. A module-level
// refcount makes only the first lock apply styles and only the last one
// release them.
let lockCount = 0
let saved: {
  overflow: string
  docOverflow: string
  position: string
  top: string
  width: string
  overscroll: string
  scrollY: number
  pinned: boolean
} | null = null

const acquire = (pin: boolean) => {
  if (lockCount === 0) {
    const body = document.body
    const docEl = document.documentElement
    saved = {
      overflow: body.style.overflow,
      docOverflow: docEl.style.overflow,
      overscroll: docEl.style.overscrollBehavior,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      scrollY: window.scrollY,
      pinned: pin && isIOS(),
    }
    body.style.overflow = "hidden"
    // iOS scrolls the documentElement, not body - hiding only body is not
    // enough when pin is off (e.g. overlays that must keep keyboard focus)
    docEl.style.overflow = "hidden"
    docEl.style.overscrollBehavior = "none"
    if (saved.pinned) {
      body.style.position = "fixed"
      body.style.top = `-${saved.scrollY}px`
      body.style.width = "100%"
    }
  }
  lockCount++
}

const release = () => {
  if (lockCount <= 0) return
  lockCount--
  if (lockCount > 0 || !saved) return
  const body = document.body
  const docEl = document.documentElement
  body.style.overflow = saved.overflow
  docEl.style.overflow = saved.docOverflow
  docEl.style.overscrollBehavior = saved.overscroll
  if (saved.pinned) {
    body.style.position = saved.position
    body.style.top = saved.top
    body.style.width = saved.width
    window.scrollTo(0, saved.scrollY)
  }
  saved = null
}

/**
 * Locks page scroll while `active` is true. Safe to use from multiple
 * components at once - the lock is released only when the last holder
 * deactivates.
 */
export const useBodyScrollLock = (
  active: boolean,
  opts?: { pin?: boolean }
) => {
  const pin = opts?.pin !== false
  useEffect(() => {
    if (!active || typeof document === "undefined") return
    acquire(pin)
    return release
    // pin is stable per call site; re-running on its change is unnecessary
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
