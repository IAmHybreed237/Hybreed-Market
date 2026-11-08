"use client"

import { useEffect, useState } from "react"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { GuestSignupForm } from "./GuestSignupForm"

type SignupDetail = { onDone?: () => void }

export const requestGuestSignup = (onDone?: () => void) => {
  window.dispatchEvent(new CustomEvent<SignupDetail>("hb:guest-signup", { detail: { onDone } }))
}

export const GuestSignupSheet = () => {
  const [open, setOpen] = useState(false)
  const [onDone, setOnDone] = useState<(() => void) | null>(null)
  useBodyScrollLock(open)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SignupDetail>).detail
      setOnDone(() => detail?.onDone ?? null)
      setOpen(true)
    }
    window.addEventListener("hb:guest-signup", handler)
    return () => window.removeEventListener("hb:guest-signup", handler)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[75]">
      <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] px-4 pt-3 max-h-[85vh] overflow-y-auto overscroll-contain md:max-w-[520px] md:mx-auto"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
      >
        <div className="flex justify-center pb-3">
          <div className="w-10 h-1.5 rounded-full bg-[#D4D4DC]" />
        </div>
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-[20px] font-semibold text-[#1F1F23]">Create your Hybreed account</h2>
          <button aria-label="Close" onClick={() => setOpen(false)} className="w-9 h-9 flex items-center justify-center text-[#6B6B76]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
          </button>
        </div>
        <GuestSignupForm
          onDone={() => {
            setOpen(false)
            onDone?.()
          }}
        />
      </div>
    </div>
  )
}
