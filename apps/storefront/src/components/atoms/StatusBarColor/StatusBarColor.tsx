"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

type RGBA = [number, number, number, number]

const parse = (c: string): RGBA | null => {
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const [r, g, b, a = "1"] = m[1].split(/[\s,/]+/).filter(Boolean)
  return [+r, +g, +b, +a]
}

// First reasonably opaque colour stop of a gradient (gradients start at the top/left edge).
const gradientColor = (img: string): RGBA | null => {
  for (const c of img.match(/rgba?\([^)]+\)/g) || []) {
    const p = parse(c)
    if (p && p[3] >= 0.5) return p
  }
  return null
}

const layerColor = (el: Element): RGBA | null => {
  const override = (el as HTMLElement).dataset?.statusColor
  if (override) {
    const probe = document.createElement("span")
    probe.style.color = override
    document.body.appendChild(probe)
    const p = parse(getComputedStyle(probe).color)
    probe.remove()
    return p
  }
  const s = getComputedStyle(el)
  const bg = parse(s.backgroundColor)
  if (bg && bg[3] > 0) return bg
  if (s.backgroundImage && s.backgroundImage !== "none") return gradientColor(s.backgroundImage)
  return null
}

// Composite the stack of elements under the top edge of the screen into one solid colour.
const colorAtTop = () => {
  const stack = document.elementsFromPoint(window.innerWidth / 2, 1)
  const layers: RGBA[] = []
  for (const el of stack) {
    const c = layerColor(el)
    if (!c) continue
    layers.push(c)
    if (c[3] >= 1) break
  }
  let out: [number, number, number] = [255, 255, 255]
  for (const [r, g, b, a] of layers.reverse()) {
    out = [r * a + out[0] * (1 - a), g * a + out[1] * (1 - a), b * a + out[2] * (1 - a)]
  }
  return `#${out.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`
}

// iPhones ignore the viewport zoom lock, so block the pinch gesture directly.
if (typeof document !== "undefined") {
  const block = (e: Event) => { if (window.innerWidth < 1024) e.preventDefault() }
  document.addEventListener("gesturestart", block, { passive: false })
  document.addEventListener("gesturechange", block, { passive: false })
  document.addEventListener(
    "touchmove",
    (e) => { if ((e as TouchEvent).touches.length > 1 && window.innerWidth < 1024) e.preventDefault() },
    { passive: false }
  )
}

/** Keeps the phone status bar (theme-color) matched to whatever sits at the top of the page. */
export const StatusBarColor = () => {
  const pathname = usePathname()

  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "theme-color"
      document.head.appendChild(meta)
    }
    let raf = 0
    const sync = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const c = colorAtTop()
        if (meta!.content !== c) meta!.content = c
      })
    }
    const timers = [0, 150, 600, 1500].map((t) => setTimeout(sync, t))
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener("scroll", sync, { passive: true })
    window.addEventListener("resize", sync)
    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener("scroll", sync)
      window.removeEventListener("resize", sync)
    }
  }, [pathname])

  return null
}
