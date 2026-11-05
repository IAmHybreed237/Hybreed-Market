"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export const BusinessSignupForm = () => {
  const [value, setValue] = useState("")
  const router = useRouter()
  const ready = value.trim().length > 0

  const submit = () => {
    if (!ready) return
    router.push(`/business/register?business=${encodeURIComponent(value.trim())}`)
  }

  return (
    <div className="relative z-[2] bg-white rounded-[24px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] px-4 md:px-5 pt-4 md:pt-5 pb-4 md:pb-5">
      <p className="text-[15px] md:text-[17px] font-medium text-[#1F1F23] leading-[22px]">
        Add your business
      </p>
      <div className="mt-3 flex items-center gap-2.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Enter your business name or taxpayer number"
          className="flex-1 min-w-0 h-10 rounded-2xl bg-transparent text-[15px] text-[#1F1F23] placeholder:text-[#8F8FA7] outline-none"
        />
        <button
          type="button"
          disabled={!ready}
          onClick={submit}
          aria-label="Continue"
          className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-white transition-colors ${
            ready ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "bg-[#C7C7D1] cursor-not-allowed"
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4.5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
