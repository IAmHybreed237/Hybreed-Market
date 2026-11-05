"use client"

import { useEffect, useRef, useState } from "react"
import { getImageProps } from "next/image"
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons"

type GradientSlide = {
  heading: string
  sub: string
  cta: string
  href: string
  bg: string
}

type ImageSlide = {
  heading: string
  href: string
  desktop: string
  mobile: string
}

type Slide = GradientSlide | ImageSlide

const slides: Slide[] = [
  {
    heading: "Big sale — up to 50% off",
    href: "/categories",
    desktop: "/images/hero/banner-desktop-home.png",
    mobile: "/images/hero/banner-mobile.png",
  },
  {
    heading: "Your money stays protected",
    sub: "Pay now, we hold it safe — released to the seller only when you receive your item.",
    cta: "Shop with protection",
    href: "/categories",
    bg: "linear-gradient(120deg, #1d4ed8 0%, #2563eb 55%, #3b82f6 100%)",
  },
  {
    heading: "Sell where you already sell",
    sub: "Share your Hybreed shop link on WhatsApp and look trustworthy to every buyer.",
    cta: "Open your shop",
    href: "http://localhost:9000/seller/register",
    bg: "linear-gradient(120deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)",
  },
  {
    heading: "Pay small small",
    sub: "Can't pay at once? Reserve the item and pay in installments — no interest.",
    cta: "See how it works",
    href: "/categories",
    bg: "linear-gradient(120deg, #1e40af 0%, #3b82f6 55%, #60a5fa 100%)",
  },
  {
    heading: "Timed auctions are coming",
    sub: "Bid on phones, fashion and more — winning price set by real competition.",
    cta: "Browse listings",
    href: "/categories",
    bg: "linear-gradient(120deg, #172554 0%, #1e3a8a 55%, #1d4ed8 100%)",
  },
]

const SlideArt = () => (
  <svg
    viewBox="0 0 200 200"
    className="w-full h-full"
    fill="none"
    aria-hidden
  >
    <rect x="70" y="30" width="60" height="120" rx="12" fill="white" fillOpacity="0.15" />
    <rect x="78" y="45" width="44" height="70" rx="6" fill="white" fillOpacity="0.25" />
    <circle cx="100" cy="132" r="4" fill="white" fillOpacity="0.5" />
    <circle cx="55" cy="60" r="14" fill="#F4F51B" fillOpacity="0.9" />
    <path d="M48 60l5 5 9-10" stroke="#1d4ed8" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="130" y="90" width="40" height="28" rx="8" fill="white" fillOpacity="0.9" />
    <path d="M138 102h24M138 109h16" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
    <circle cx="150" cy="50" r="20" fill="white" fillOpacity="0.2" />
  </svg>
)

const BannerImage = ({ slide, eager }: { slide: ImageSlide; eager: boolean }) => {
  const common = { alt: slide.heading, sizes: "(min-width: 1400px) 1320px, 100vw", priority: eager }
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: slide.desktop, width: 2640, height: 600 })
  const {
    props: { srcSet: mobileSrcSet, ...rest },
  } = getImageProps({ ...common, src: slide.mobile, width: 750, height: 400 })

  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={desktopSrcSet} />
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img {...rest} srcSet={mobileSrcSet} className="w-full h-full object-cover" />
    </picture>
  )
}

export const HeroCarousel = () => {
  const [index, setIndex] = useState(0)
  const [noAnim, setNoAnim] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const touch = useRef<{ x: number; y: number; axis?: "x" | "y" } | null>(null)
  const didSwipe = useRef(false)
  const looped = slides.concat(slides[0])

  const prev = () => setIndex((i) => (i === 0 ? slides.length - 1 : i - 1))
  const next = () => setIndex((i) => i + 1)

  // restarts on every slide change, so manual navigation resets the timer
  useEffect(() => {
    if (dragging) return
    const t = setTimeout(next, 7000)
    return () => clearTimeout(t)
  }, [index, dragging])

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
    didSwipe.current = false
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const start = touch.current
    if (!start) return
    const t = e.touches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (!start.axis && Math.abs(dx) + Math.abs(dy) > 8) {
      start.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
    }
    if (start.axis !== "x") return
    setDragging(true)
    setDragX(dx)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touch.current?.axis === "x") {
      const width = e.currentTarget.clientWidth
      if (dragX < -width * 0.15) next()
      else if (dragX > width * 0.15) prev()
      didSwipe.current = Math.abs(dragX) > 8
    }
    touch.current = null
    setDragging(false)
    setDragX(0)
  }

  // after sliding into the clone, silently snap back to slide 0
  useEffect(() => {
    if (index !== slides.length) return
    const t = setTimeout(() => {
      setNoAnim(true)
      setIndex(0)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setNoAnim(false))
      )
    }, 750)
    return () => clearTimeout(t)
  }, [index])

  return (
    <section className="w-full px-0 lg:px-10 lg:-mb-6 group" data-testid="hero-carousel">
      <div className="relative max-w-[1400px] mx-auto">
      <div
        className="overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div
          className={`flex ${
            noAnim || dragging ? "" : "transition-transform duration-700 ease-in-out"
          }`}
          style={{ transform: `translateX(calc(-${index * 100}% + ${dragX}px))` }}
        >
          {looped.map((s, i) =>
            "desktop" in s ? (
              <a
                key={`${s.heading}-${i}`}
                href={s.href}
                aria-label={`Advertisement: ${s.heading}`}
                draggable={false}
                onClick={(e) => {
                  if (didSwipe.current) e.preventDefault()
                }}
                className="flex-[0_0_100%] aspect-[750/400] lg:aspect-[2640/600] block select-none px-1.5 lg:px-0"
              >
                <span className="relative block w-full h-full rounded-[16px] lg:rounded-[20px] overflow-hidden">
                  <BannerImage slide={s} eager={i === 0} />
                  <span
                    aria-hidden
                    className="absolute bottom-2 right-2.5 lg:bottom-3 lg:right-4 px-1.5 py-[3px] rounded-[5px] bg-black/35 backdrop-blur-sm text-white/90 text-[10px] lg:text-[11px] font-medium leading-none tracking-[0.02em] pointer-events-none"
                  >
                    Ad
                  </span>
                </span>
              </a>
            ) : (
            <div
              key={`${s.heading}-${i}`}
              className="flex-[0_0_100%] aspect-[750/400] lg:aspect-[2640/600] px-1.5 lg:px-0"
            >
              <div
                className="w-full h-full rounded-[16px] lg:rounded-[20px] flex items-center overflow-hidden"
                style={{ background: s.bg }}
              >
                <div className="px-5 lg:pl-12 max-w-[75%] lg:max-w-[55%] text-white">
                  <h2 className="text-2xl lg:text-4xl font-extrabold leading-tight">
                    {s.heading}
                  </h2>
                  <p className="mt-3 text-base text-white/80 hidden lg:block">
                    {s.sub}
                  </p>
                  <a
                    href={s.href}
                    className="hidden lg:inline-flex items-center gap-2 mt-5 bg-white text-action font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    {s.cta}
                    <ArrowRightIcon size={18} />
                  </a>
                </div>
                <div className="hidden lg:block flex-1 h-[73%] pr-8">
                  <SlideArt />
                </div>
              </div>
            </div>
            )
          )}
        </div>
      </div>

        <button
          aria-label="Previous slide"
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/25 hover:bg-white/50 text-white hidden lg:flex items-center justify-center backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <button
          aria-label="Next slide"
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/25 hover:bg-white/50 text-white hidden lg:flex items-center justify-center backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowRightIcon size={20} />
        </button>
      </div>
    </section>
  )
}
