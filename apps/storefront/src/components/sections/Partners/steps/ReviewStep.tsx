"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { loadReg, saveReg, clearReg, submitRegistration, type RegData } from "../reg"
import { StepShell, useStepNav } from "../StepShell"

const METHOD_LABEL = { momo: "MTN Mobile Money", om: "Orange Money", bank: "Bank transfer" } as const

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="flex justify-between gap-4 py-2.5">
      <span className="text-[14px] text-[#8A8A96]">{label}</span>
      <span className="text-[14px] font-medium text-[#1F1F23] text-right">
        {value}
      </span>
    </div>
  ) : null

const Group = ({
  title,
  editTo,
  children,
}: {
  title: string
  editTo: string
  children: React.ReactNode
}) => (
  <div className="border-b border-[#EDEDF0] py-4 first:pt-0 last:border-b-0">
    <div className="flex items-center justify-between mb-1">
      <h2 className="text-[15px] font-semibold text-[#1F1F23]">{title}</h2>
      <LocalizedClientLink
        href={editTo}
        className="text-[13px] font-medium text-[#2563EB] hover:underline"
      >
        Edit
      </LocalizedClientLink>
    </div>
    <div className="divide-y divide-[#F3F3F5]">{children}</div>
  </div>
)

export const ReviewStep = () => {
  const go = useStepNav()
  const [reg, setReg] = useState<RegData>({})
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => setReg(loadReg()), [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agree || busy) return
    setBusy(true)
    setError("")
    try {
      await submitRegistration(reg)
      saveReg({})
      try {
        sessionStorage.setItem(
          "hybreed_seller_done",
          JSON.stringify({ shopName: reg.shopName, email: reg.email })
        )
      } catch {}
      clearReg()
      go("/partners/signup/done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setBusy(false)
    }
  }

  const phone = reg.phone ? `+237 ${reg.phone}` : undefined
  const payout =
    reg.payoutMethod === "bank"
      ? `${reg.bankName || "Bank"} · ${reg.payoutAccount}`
      : reg.payoutAccount
        ? `+237 ${reg.payoutAccount}`
        : undefined

  return (
    <StepShell
      step={5}
      title="Check your details"
      sub="Make sure everything is right - you can edit any section."
      back="/partners/signup/payout"
    >
      <form onSubmit={submit} className="flex flex-col">
        <Group title="Location" editTo="/partners/signup">
          <Row label="Country" value="Cameroon" />
          <Row label="City / town" value={reg.city} />
        </Group>
        <Group title="Contact" editTo="/partners/signup/contact">
          <Row label="Name" value={[reg.firstName, reg.lastName].filter(Boolean).join(" ")} />
          <Row label="WhatsApp" value={phone} />
          <Row label="Email" value={reg.email} />
        </Group>
        <Group title="Shop" editTo="/partners/signup/shop">
          <Row label="Shop name" value={reg.shopName} />
          <Row
            label="Type"
            value={reg.sellerType === "business" ? "Registered business" : "Individual"}
          />
          {reg.sellerType === "business" ? (
            <>
              <Row label="Business name" value={reg.companyName} />
              <Row label="Registration №" value={reg.regNumber} />
            </>
          ) : (
            <Row label="National ID" value={reg.idNumber} />
          )}
        </Group>
        <Group title="Payout" editTo="/partners/signup/payout">
          <Row
            label="Method"
            value={reg.payoutMethod ? METHOD_LABEL[reg.payoutMethod] : undefined}
          />
          <Row label="Account name" value={reg.payoutName} />
          <Row label="Account" value={payout} />
        </Group>

        <label className="mt-6 flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 w-[18px] h-[18px] rounded accent-[#1F1F23]"
          />
          <span className="text-[14px] leading-[20px] text-[#1F1F23]">
            I confirm my details are correct and I agree to the{" "}
            <a href={`${process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:9000/seller"}`} className="text-[#2563EB] hover:underline">
              Hybreed seller terms
            </a>
            .
          </span>
        </label>

        {error && (
          <p className="mt-4 text-[14px] leading-[20px] text-[#DC2626]">{error}</p>
        )}

        <button
          type="submit"
          disabled={!agree || busy}
          className="mt-5 w-full h-[46px] rounded-[10px] bg-[#1F1F23] text-white text-[16px] font-semibold hover:bg-[#34343c] active:scale-[0.99] transition disabled:opacity-40 disabled:hover:bg-[#1F1F23] disabled:cursor-not-allowed"
        >
          {busy ? "Creating your shop…" : "Create my shop"}
        </button>
      </form>
    </StepShell>
  )
}
