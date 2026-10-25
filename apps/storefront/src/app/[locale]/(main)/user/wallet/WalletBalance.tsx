"use client"

import { useEffect, useState } from "react"

const EyeOff = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9.9 9.9a3 3 0 0 0 4.24 4.24" />
  </svg>
)
const Eye = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const WalletBalance = () => {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      setHidden(localStorage.getItem("hb_wallet_hidden") === "1")
    } catch {}
  }, [])

  const toggle = () => {
    setHidden((v) => {
      try {
        localStorage.setItem("hb_wallet_hidden", v ? "0" : "1")
      } catch {}
      return !v
    })
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <p className="text-[44px] leading-[1.1] font-medium text-[#1F1F23]">
        {hidden ? "••••" : "0 XAF"}
      </p>
      <button
        type="button"
        aria-label={hidden ? "Show balance" : "Hide balance"}
        onClick={toggle}
        className="text-[#1F1F23] hover:opacity-70 transition-opacity"
      >
        {hidden ? <Eye /> : <EyeOff />}
      </button>
    </div>
  )
}
