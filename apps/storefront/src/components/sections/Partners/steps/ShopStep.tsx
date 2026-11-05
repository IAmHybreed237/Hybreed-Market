"use client"

import { useEffect, useState } from "react"
import { loadReg, saveReg, type RegData, type SellerType } from "../reg"
import { Field, StepShell, useStepNav } from "../StepShell"

const TypeCard = ({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean
  title: string
  desc: string
  onClick: () => void
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    className={`flex-1 min-w-[160px] text-left rounded-[14px] border p-4 transition ${
      active
        ? "border-[#1F1F23] ring-1 ring-[#1F1F23] bg-[#FAFAFB]"
        : "border-[#D9D9E0] bg-white hover:border-[#8A8A96]"
    }`}
  >
    <span className="flex items-center gap-2">
      <span
        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
          active ? "border-[#1F1F23]" : "border-[#B9B9C0]"
        }`}
      >
        {active && <span className="w-2 h-2 rounded-full bg-[#1F1F23]" />}
      </span>
      <span className="text-[15px] font-semibold text-[#1F1F23]">{title}</span>
    </span>
    <span className="block mt-1.5 text-[13px] leading-[18px] text-[#8A8A96]">
      {desc}
    </span>
  </button>
)

export const ShopStep = () => {
  const go = useStepNav()
  const [form, setForm] = useState<RegData>({ sellerType: "individual" })

  useEffect(() => {
    const saved = loadReg()
    setForm({ sellerType: "individual", ...saved })
  }, [])
  const set = (k: keyof RegData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const setType = (sellerType: SellerType) => setForm((f) => ({ ...f, sellerType }))

  const valid =
    (form.shopName || "").trim().length >= 2 &&
    (form.sellerType === "individual"
      ? (form.idNumber || "").trim().length >= 4
      : (form.companyName || "").trim() && (form.regNumber || "").trim())

  const next = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    saveReg(form)
    go("/partners/signup/payout")
  }

  return (
    <StepShell
      step={3}
      title="Your shop"
      sub="This is the name buyers will see on Hybreed."
      back="/partners/signup/contact"
    >
      <form onSubmit={next} className="flex flex-col gap-5">
        <Field
          id="shopName"
          label="Shop name"
          placeholder="e.g. Gaya Shopping"
          value={form.shopName || ""}
          onChange={set("shopName")}
        />

        <div>
          <span className="block text-[14px] leading-[20px] text-[#1F1F23] mb-1.5">
            What are you selling as?
          </span>
          <div className="flex flex-col sm:flex-row gap-3" role="radiogroup">
            <TypeCard
              active={form.sellerType === "individual"}
              title="Individual"
              desc="You sell as a private person. You'll need your national ID card."
              onClick={() => setType("individual")}
            />
            <TypeCard
              active={form.sellerType === "business"}
              title="Registered business"
              desc="A company with an RCCM or NIU registration number."
              onClick={() => setType("business")}
            />
          </div>
        </div>

        {form.sellerType === "individual" ? (
          <Field
            id="idNumber"
            label="National ID (CNI) number"
            placeholder="e.g. 100XXXXXX"
            value={form.idNumber || ""}
            onChange={set("idNumber")}
            hint="Required by Cameroonian law for marketplace sellers. It stays private."
          />
        ) : (
          <>
            <Field
              id="companyName"
              label="Registered business name"
              value={form.companyName || ""}
              onChange={set("companyName")}
            />
            <Field
              id="regNumber"
              label="Registration number (RCCM or NIU)"
              value={form.regNumber || ""}
              onChange={set("regNumber")}
            />
          </>
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
