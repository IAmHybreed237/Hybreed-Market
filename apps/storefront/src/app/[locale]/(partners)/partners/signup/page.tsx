import type { Metadata } from "next"
import { CityStep } from "@/components/sections/Partners/CityStep"

export const metadata: Metadata = {
  title: "Sign up - Hybreed Partners",
  description:
    "Register as a seller on Hybreed, Cameroon's trusted marketplace.",
  robots: { index: false, follow: false },
}

export default function PartnersSignupPage() {
  return (
    <main className="w-full bg-white min-h-[calc(100dvh-52px)] lg:min-h-[calc(100dvh-60px)]">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 pt-8 lg:pt-14 pb-10">
        <CityStep />
      </div>
    </main>
  )
}
