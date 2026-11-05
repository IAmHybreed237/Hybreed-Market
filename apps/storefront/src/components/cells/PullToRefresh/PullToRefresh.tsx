"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Pull-to-refresh for mobile pages — pull down from the top reveals a loader
 * strip that stretches in-flow, release triggers a soft router.refresh().
 */
export const PullToRefresh = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStart = useRef<number | null>(null)

  const onPullStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !refreshing)
      pullStart.current = e.touches[0].clientY
  }
  const onPullMove = (e: React.TouchEvent) => {
    if (pullStart.current == null) return
    const dy = e.touches[0].clientY - pullStart.current
    if (dy > 0) setPullY(Math.min(dy * 0.5, 90))
    else {
      pullStart.current = null
      setPullY(0)
    }
  }
  const onPullEnd = () => {
    if (pullStart.current == null) return
    pullStart.current = null
    if (pullY >= 56) {
      setRefreshing(true)
      router.refresh()
      setTimeout(() => {
        setRefreshing(false)
        setPullY(0)
      }, 900)
    } else setPullY(0)
  }

  return (
    <div
      onTouchStart={onPullStart}
      onTouchMove={onPullMove}
      onTouchEnd={onPullEnd}
      onTouchCancel={onPullEnd}
    >
      {/* loader strip — stretches in-flow at the top, mobile only */}
      <div
        aria-hidden={!(pullY > 0 || refreshing)}
        className="lg:hidden flex items-center justify-center overflow-hidden"
        style={{
          height: refreshing ? 44 : pullY,
          transition:
            pullY === 0 || refreshing
              ? "height .3s cubic-bezier(.2,.8,.3,1)"
              : "none",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={refreshing ? "animate-spin" : ""}
          style={{
            opacity: refreshing ? 1 : Math.min(pullY / 56, 1),
            transform: refreshing ? undefined : `rotate(${pullY * 4}deg)`,
          }}
        >
          <circle cx="12" cy="12" r="9" stroke="#2563EB" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      {children}
    </div>
  )
}
