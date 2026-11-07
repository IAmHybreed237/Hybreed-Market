"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { VENDOR_URL } from "@/lib/vendor"

const ClockGlyph = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#B45309"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const NextSteps = [
  {
    title: "Application under review",
    desc: "Our team verifies your details - usually within 24 hours.",
  },
  {
    title: "Verdict sent to you",
    desc: "We'll message you on WhatsApp and email you with our decision.",
  },
  {
    title: "Start selling",
    desc: "Once approved, your shop goes live and you can add products.",
  },
]

export const DoneStep = () => {
  const [info, setInfo] = useState<{ shopName?: string; email?: string }>({})

  useEffect(() => {
    try {
      setInfo(JSON.parse(sessionStorage.getItem("hybreed_seller_done") || "{}"))
    } catch {}
  }, [])

  return (
    <div className="w-full max-w-[520px] lg:mx-auto lg:text-center">
      <span className="inline-flex w-14 h-14 rounded-full bg-[#FEF3E2] items-center justify-center mb-6">
        <ClockGlyph />
      </span>
      <h1 className="text-[28px] leading-[34px] lg:text-[36px] lg:leading-[42px] font-extrabold tracking-[-0.02em] text-[#1F1F23]">
        Application submitted
      </h1>
      <p className="mt-3 text-[15px] lg:text-[16px] leading-[24px] text-[#1F1F23]">
        Thanks{info.shopName ? ` - we've received the application for` : " for applying"}
        {info.shopName && (
          <span className="font-semibold"> {info.shopName}</span>
        )}
        . Your shop stays inactive until we approve it.
      </p>

      {/* what happens next */}
      <div className="mt-8 rounded-[20px] border border-[#EDEDF0] bg-[#FAFAFB] px-5 py-4 text-left">
        {NextSteps.map((s, i) => (
          <div
            key={s.title}
            className={`flex gap-3.5 py-3.5 ${
              i < NextSteps.length - 1 ? "border-b border-[#EDEDF0]" : ""
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-[13px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-[20px] text-[#1F1F23]">
                {s.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-[18px] text-[#8A8A96]">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row lg:justify-center gap-3">
        <LocalizedClientLink
          href="/"
          className="inline-flex items-center justify-center h-[46px] px-6 rounded-[10px] bg-[#1F1F23] text-white text-[15px] font-semibold hover:bg-[#34343c] transition"
        >
          Back to the store
        </LocalizedClientLink>
        <a
          href={`${VENDOR_URL}/login`}
          className="inline-flex items-center justify-center h-[46px] px-6 rounded-[10px] border border-[#D9D9E0] text-[15px] font-semibold text-[#1F1F23] hover:border-[#8A8A96] transition"
        >
          Seller sign in
        </a>
      </div>

      <p className="mt-5 text-[13px] leading-[19px] text-[#8A8A96]">
        You can sign in anytime to check your application status.
        {info.email && (
          <>
            {" "}
            We'll use <span className="text-[#1F1F23] font-medium">{info.email}</span> and
            your WhatsApp number to reach you.
          </>
        )}{" "}
        Questions? <a href="https://wa.me/" className="text-[#2563EB] hover:underline">Message support</a>.
      </p>
    </div>
  )
}
