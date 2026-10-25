"use client"

import { useEffect, useState } from "react"
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons"

type Slide = {
  heading: string
  sub: string
  cta: string
  href: string
  bg: string
}

const slides: Slide[] = [
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

export const HeroCarousel = () => {
  const [index, setIndex] = useState(0)
  const [noAnim, setNoAnim] = useState(false)
  const looped = slides.concat(slides[0])

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => i + 1), 7000)
    return () => clearInterval(t)
  }, [])

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
    <section className="w-full px-[5px] group" data-testid="hero-carousel">
      <div className="max-w-[1400px] mx-auto overflow-hidden">
        <div
          className={`flex ${
            noAnim ? "" : "transition-transform duration-700 ease-in-out"
          }`}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {looped.map((s, i) => (
            <div
              key={`${s.heading}-${i}`}
              className="flex-[0_0_100%] h-[200px] lg:h-[300px] rounded-[20px] flex items-center overflow-hidden"
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
              <div className="hidden lg:block flex-1 h-[220px] pr-8">
                <SlideArt />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative max-w-[1400px] mx-auto">
        <button
          aria-label="Previous slide"
          onClick={() =>
            setIndex((i) =>
              i === 0 ? slides.length - 1 : i - 1
            )
          }
          className="absolute left-4 -top-[180px] w-10 h-10 rounded-full bg-white/25 hover:bg-white/50 text-white flex items-center justify-center backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <button
          aria-label="Next slide"
          onClick={() => setIndex((i) => i + 1)}
          className="absolute right-4 -top-[180px] w-10 h-10 rounded-full bg-white/25 hover:bg-white/50 text-white flex items-center justify-center backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowRightIcon size={20} />
        </button>
      </div>
    </section>
  )
}
