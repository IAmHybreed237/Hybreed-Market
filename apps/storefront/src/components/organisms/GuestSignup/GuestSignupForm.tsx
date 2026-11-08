"use client"

import { useState } from "react"
import { signupWithPhone } from "@/lib/data/customer"

const carrierOf = (local: string): string | null => {
  if (/^6(7\d|5[0-4]\d|8[0-4]\d)/.test(local)) return "MTN"
  if (/^6(9\d|5[5-9]\d|8[5-9]\d)/.test(local)) return "Orange"
  if (/^66\d/.test(local)) return "Nexttel"
  return null
}

const fmtPhone = (local: string) =>
  local.length === 9 ? `+237 ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}` : `+237 ${local}`

export const GuestSignupForm = ({
  onDone,
  subtitle = "Save your details to check out faster — no password needed.",
}: {
  onDone: () => void
  subtitle?: string
}) => {
  const [step, setStep] = useState<"form" | "confirm">("form")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const local = phone.replace(/\D/g, "").replace(/^237/, "").slice(0, 9)
  const valid = /^6\d{8}$/.test(local)
  const carrier = valid ? carrierOf(local) : null

  const submit = async () => {
    if (!name.trim() || !valid || busy) return
    setBusy(true)
    setError(null)
    const res = await signupWithPhone({ name: name.trim(), phone: local })
    setBusy(false)
    if (typeof res === "string") {
      setError(res)
      return
    }
    onDone()
  }

  return (
    <div>
      {step === "form" ? (
        <>
          <p className="text-[14px] text-[#8A8A96] -mt-1 mb-4">{subtitle}</p>
          <label className="block mb-3">
            <span className="text-[13px] font-medium text-[#6B6B76]">What should we call you?</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="given-name"
              className="mt-1 w-full h-12 rounded-[14px] bg-[#F0F0F3] px-4 text-[16px] text-[#1F1F23] outline-none focus:ring-2 focus:ring-[#2563EB]/40"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-[#6B6B76]">WhatsApp number</span>
            <span className="mt-1 flex items-center h-12 rounded-[14px] bg-[#F0F0F3] overflow-hidden">
              <span className="pl-4 pr-2 text-[16px] text-[#8A8A96] shrink-0">+237</span>
              <input
                value={local}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="6XX XXX XXX"
                inputMode="tel"
                autoComplete="tel-national"
                className="flex-1 h-full bg-transparent px-1 text-[16px] text-[#1F1F23] outline-none"
              />
              {carrier && (
                <span className="mr-3 text-[12px] font-semibold text-[#2563EB] bg-[#DBEAFE] rounded-full px-2.5 py-1 shrink-0">
                  {carrier}
                </span>
              )}
            </span>
            <span className="block text-[12px] text-[#8A8A96] mt-1.5">
              We'll send order updates here. No password needed.
            </span>
          </label>
          {error && <p className="text-[13px] text-[#DC2626] mt-2">{error}</p>}
          <button
            disabled={!name.trim() || !valid}
            onClick={() => setStep("confirm")}
            className="mt-5 w-full h-12 rounded-full bg-[#2563EB] text-white text-[16px] font-semibold disabled:opacity-40"
          >
            Continue
          </button>
        </>
      ) : (
        <>
          <p className="text-[14px] text-[#8A8A96] -mt-1 mb-4">Double-check your WhatsApp number — order updates go here.</p>
          <div className="rounded-[18px] bg-[#F0F0F3] px-4 py-4 mb-4">
            <p className="text-[13px] text-[#8A8A96]">Name</p>
            <p className="text-[18px] font-semibold text-[#1F1F23]">{name.trim()}</p>
            <p className="text-[13px] text-[#8A8A96] mt-3">WhatsApp</p>
            <p className="text-[18px] font-semibold text-[#1F1F23]">{fmtPhone(local)}</p>
          </div>
          {error && <p className="text-[13px] text-[#DC2626] mb-2">{error}</p>}
          <button
            disabled={busy}
            onClick={submit}
            className="w-full h-12 rounded-full bg-[#2563EB] text-white text-[16px] font-semibold disabled:opacity-50"
          >
            {busy ? "Creating account…" : "Yes, that's me"}
          </button>
          <button
            onClick={() => { setStep("form"); setError(null) }}
            className="mt-2 w-full h-11 text-[15px] font-medium text-[#2563EB]"
          >
            Edit details
          </button>
        </>
      )}
    </div>
  )
}
