"use client"

import { useEffect, useState } from "react"

/**
 * Hybreed launch splash - brand mark on the header gradient.
 * Only visible in standalone (home-screen / installed PWA) mode;
 * hidden in normal browser tabs and on desktop via CSS.
 * Shows on cold document load, holds ~1.2s, fades out, unmounts.
 */
export const SplashScreen = () => {
  // 0 = showing, 1 = fading, 2 = gone
  const [phase, setPhase] = useState(0)
  const [force, setForce] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.matchMedia?.("(display-mode: fullscreen)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true

    if (!standalone) {
      setPhase(2)
      return
    }

    // iOS Safari standalone doesn't always match the display-mode media
    // query, so force visibility once JS confirms we're in an app context.
    setForce(true)
    const fade = setTimeout(() => setPhase(1), 1200)
    const gone = setTimeout(() => setPhase(2), 2000)
    return () => {
      clearTimeout(fade)
      clearTimeout(gone)
    }
  }, [])

  if (phase === 2) return null

  return (
    <div
      className={`hybreed-splash header-gradient${force ? " hybreed-splash-on" : ""}`}
      style={{
        transform: phase === 1 ? "scale(1.6)" : undefined,
        opacity: phase === 1 ? 0 : 1,
        transition:
          "transform .7s cubic-bezier(.5,0,.75,.4), opacity .6s ease-in",
      }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/brand-mark.png"
        alt=""
        className="hybreed-splash-mark"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo.png"
        alt=""
        className="hybreed-splash-logo"
      />
    </div>
  )
}
