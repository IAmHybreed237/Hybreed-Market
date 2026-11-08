"use client"

import { useRouter } from "next/navigation"
import { GuestSignupForm } from "./GuestSignupForm"

export const CheckoutSignupGate = ({ locale }: { locale: string }) => {
  const router = useRouter()
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] p-5">
        <h1 className="text-[22px] font-semibold text-[#1F1F23] mb-1">One quick step before checkout</h1>
        <GuestSignupForm
          subtitle="We need a name and WhatsApp number for your order — that's it, no password."
          onDone={() => router.refresh()}
        />
      </div>
    </div>
  )
}
