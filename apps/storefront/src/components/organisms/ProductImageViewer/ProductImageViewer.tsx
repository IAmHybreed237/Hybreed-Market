"use client"

import { useEffect, useRef, useState } from "react"

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

/**
 * Fullscreen product photo viewer. On mobile it renders as a bottom sheet
 * that rises from the screen edge; on desktop a centered modal. Header
 * shows the photo counter and a close button; images swipe horizontally.
 */
export const ProductImageViewer = ({
  images,
  index = 0,
  onClose,
}: {
  images: string[]
  index?: number
  onClose: () => void
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(index)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const el = trackRef.current
    if (el) el.scrollLeft = index * el.clientWidth
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useBodyScrollLock(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!images.length) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end md:items-center md:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Product photos"
    >
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />
      <div
        className={`relative flex flex-col w-full md:max-w-6xl bg-black rounded-t-[28px] md:rounded-[28px] overflow-hidden h-[92dvh] md:h-[85vh] transition-all duration-300 ease-out ${
          entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
        }`}
      >
        {/* header: counter + close */}
        <div className="header-gradient md:bg-none flex items-center justify-between px-4 h-14 shrink-0">
          <span className="text-[15px] font-medium text-white/80 tabular-nums">
            {idx + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            aria-label="Close photos"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* swipeable track */}
        <div
          ref={trackRef}
          className="flex-1 min-h-0 flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
          onScroll={(e) => {
            const el = e.currentTarget
            const i = Math.round(el.scrollLeft / el.clientWidth)
            if (i !== idx && i >= 0 && i < images.length) setIdx(i)
          }}
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              className="w-full h-full shrink-0 snap-start snap-always flex items-center justify-center p-3 md:p-8"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                draggable={false}
                className="max-w-full max-h-full object-contain select-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
