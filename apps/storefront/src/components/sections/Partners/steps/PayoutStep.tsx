"use client"

import { useEffect, useState } from "react"
import { loadReg, saveReg, type PayoutMethod, type RegData } from "../reg"
import { Field, StepShell, useStepNav } from "../StepShell"

const BankGlyph = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9.5L12 4l9 5.5" />
    <path d="M5 9.5V19M9.5 9.5V19M14.5 9.5V19M19 9.5V19" />
    <path d="M3 19h18M3 21.5h18" />
  </svg>
)

const METHODS: { id: PayoutMethod; label: string; img?: string }[] = [
  { id: "momo", label: "MTN MoMo", img: "/images/payments/mtn-momo.png" },
  { id: "om", label: "Orange Money", img: "/images/payments/orange-money.png" },
  { id: "bank", label: "Bank transfer" },
]

const PhoneField = ({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-[14px] leading-[20px] text-[#1F1F23] mb-1.5"
    >
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[15px] text-[#6B6B75] font-medium select-none">
        +237
      </span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="6XX XX XX XX"
        className="w-full h-[46px] pl-[52px] pr-[14px] border border-[#D9D9E0] rounded-[10px] bg-white focus:border-[#1F1F23] focus:outline-none text-[15px] text-[#1F1F23] placeholder:text-[#8A8A96]"
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
)

export const PayoutStep = () => {
  const go = useStepNav()
  const [form, setForm] = useState<RegData>({ payoutMethod: "momo" })

  useEffect(() => {
    setForm({ payoutMethod: "momo", ...loadReg() })
  }, [])
  const set = (k: keyof RegData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const accountDigits = (form.payoutAccount || "").replace(/[^\d]/g, "")
  const isBank = form.payoutMethod === "bank"
  const valid =
    (form.payoutName || "").trim() &&
    (isBank
      ? (form.bankName || "").trim() && (form.payoutAccount || "").trim().length >= 6
      : accountDigits.length === 9)

  const next = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    saveReg({ ...form, payoutAccount: isBank ? form.payoutAccount : accountDigits })
    go("/partners/signup/review")
  }

  return (
    <StepShell
      step={4}
      title="How you'll get paid"
      sub="Escrow releases your money to this account after the buyer confirms delivery."
      back="/partners/signup/shop"
    >
      <form onSubmit={next} className="flex flex-col gap-5">
        <div>
          <span className="block text-[14px] leading-[20px] text-[#1F1F23] mb-1.5">
            Payout method
          </span>
          <div className="grid grid-cols-3 gap-3" role="radiogroup">
            {METHODS.map((m) => {
              const active = form.payoutMethod === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() =>
                    setForm((f) => ({ ...f, payoutMethod: m.id }))
                  }
                  className={`flex flex-col items-center gap-2 rounded-[14px] border p-3.5 transition ${
                    active
                      ? "border-[#1F1F23] ring-1 ring-[#1F1F23] bg-[#FAFAFB]"
                      : "border-[#D9D9E0] bg-white hover:border-[#8A8A96]"
                  }`}
                >
                  <span className="h-[34px] flex items-center justify-center">
                    {m.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.img}
                        alt=""
                        aria-hidden
                        draggable={false}
                        className="h-full w-auto object-contain"
                      />
                    ) : (
                      <BankGlyph />
                    )}
                  </span>
                  <span className="text-[13px] font-semibold text-[#1F1F23] text-center leading-[16px]">
                    {m.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <Field
          id="payoutName"
          label="Name on the account"
          placeholder="As registered with the provider"
          value={form.payoutName || ""}
          onChange={set("payoutName")}
        />

        {isBank ? (
          <>
            <Field
              id="bankName"
              label="Bank name"
              placeholder="e.g. Afriland, UBA, Ecobank"
              value={form.bankName || ""}
              onChange={set("bankName")}
            />
            <Field
              id="payoutAccount"
              label="Account number"
              value={form.payoutAccount || ""}
              onChange={set("payoutAccount")}
            />
          </>
        ) : (
          <PhoneField
            id="payoutAccount"
            label={
              form.payoutMethod === "momo"
                ? "MTN MoMo number"
                : "Orange Money number"
            }
            value={form.payoutAccount || ""}
            onChange={set("payoutAccount")}
          />
        )}

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
