import type { Metadata } from "next"
import { DoneStep } from "@/components/sections/Partners/steps/DoneStep"

export const metadata: Metadata = {
  title: "Application received — Hybreed Partners",
  robots: { index: false, follow: false },
}

export default function DonePage() {
  return (
    <main className="w-full bg-white min-h-[calc(100dvh-52px)] lg:min-h-[calc(100dvh-60px)]">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 pt-8 lg:pt-14 pb-10">
        <DoneStep />
      </div>
    </main>
  )
}
