"use client"

import { useEffect, useState } from "react"
import { loadReg, saveReg, type RegData } from "../reg"
import { Field, StepShell, useStepNav } from "../StepShell"

export const ContactStep = ({ initial }: { initial?: RegData }) => {
  const go = useStepNav()
  const [form, setForm] = useState<RegData>({})
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // saved answers win over the logged-in customer's profile data
    setForm({ ...initial, ...loadReg() })
  }, [initial])
  const set = (k: keyof RegData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const phoneDigits = (form.phone || "").replace(/[^\d]/g, "")
  const valid =
    (form.firstName || "").trim() &&
    (form.lastName || "").trim() &&
    phoneDigits.length === 9 &&
    /^\S+@\S+\.\S+$/.test(form.email || "") &&
    (form.password || "").length >= 8

  const next = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    saveReg({ ...form, phone: phoneDigits })
    go("/partners/signup/shop")
  }

  return (
    <StepShell
      step={2}
      title="Your contact details"
      sub={
        <>
          We'll use your WhatsApp number for verification
          <br />
          and buyer messages.
        </>
      }
      back="/partners/signup"
    >
      <form onSubmit={next} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="firstName"
            label="First name"
            autoComplete="given-name"
            value={form.firstName || ""}
            onChange={set("firstName")}
          />
          <Field
            id="lastName"
            label="Last name"
            autoComplete="family-name"
            value={form.lastName || ""}
            onChange={set("lastName")}
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-[14px] leading-[20px] text-[#1F1F23] mb-1.5"
          >
            WhatsApp phone number
          </label>
          <div className="relative">
            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[15px] text-[#6B6B75] font-medium select-none">
              +237
            </span>
            <input
              id="phone"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="6XX XX XX XX"
              className="w-full h-[46px] pl-[52px] pr-[14px] border border-[#D9D9E0] rounded-[10px] bg-white focus:border-[#1F1F23] focus:outline-none text-[15px] text-[#1F1F23] placeholder:text-[#8A8A96]"
              value={form.phone || ""}
              onChange={set("phone")}
            />
          </div>
          <p className="mt-1.5 text-[13px] leading-[18px] text-[#8A8A96]">
            9 digits, no leading zero - the number buyers and Hybreed will use.
          </p>
        </div>

        <Field
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email || ""}
          onChange={set("email")}
          hint="Used to sign in to your seller dashboard and for payout notifications."
        />

        <div>
          <label
            htmlFor="password"
            className="block text-[14px] leading-[20px] text-[#1F1F23] mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="w-full h-[46px] px-[14px] pr-[64px] border border-[#D9D9E0] rounded-[10px] bg-white focus:border-[#1F1F23] focus:outline-none text-[15px] text-[#1F1F23]"
              value={form.password || ""}
              onChange={set("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#2563EB]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mt-1.5 text-[13px] leading-[18px] text-[#8A8A96]">
            At least 8 characters.
          </p>
        </div>

        <button
          type="submit"
          disabled={!valid}
          className="mt-1 w-full h-[46px] rounded-[10px] bg-[#1F1F23] text-white text-[16px] font-semibold hover:bg-[#34343c] active:scale-[0.99] transition disabled:opacity-40 disabled:hover:bg-[#1F1F23] disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </form>
    </StepShell>
  )
}
