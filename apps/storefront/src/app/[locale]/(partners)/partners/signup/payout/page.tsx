import type { Metadata } from "next"
import { PayoutStep } from "@/components/sections/Partners/steps/PayoutStep"

export const metadata: Metadata = {
  title: "Getting paid - Hybreed Partners",
  robots: { index: false, follow: false },
}

export default function PayoutPage() {
  return (
    <main className="w-full bg-white min-h-[calc(100dvh-52px)] lg:min-h-[calc(100dvh-60px)]">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 pt-6 lg:pt-12 pb-10">
        <PayoutStep />
      </div>
    </main>
  )
}
