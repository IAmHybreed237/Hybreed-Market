import type { Metadata } from "next"
import { ContactStep } from "@/components/sections/Partners/steps/ContactStep"
import { retrieveCustomer } from "@/lib/data/customer"

export const metadata: Metadata = {
  title: "Contact details — Hybreed Partners",
  robots: { index: false, follow: false },
}

export default async function ContactPage() {
  // existing customers get their details prefilled — the seller member
  // account is a separate actor type, so their email can be reused
  const user = await retrieveCustomer().catch(() => null)
  const initial = user
    ? {
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        email: user.email || undefined,
        phone: user.phone?.replace(/^\+?237\s?/, "") || undefined,
      }
    : undefined

  return (
    <main className="w-full bg-white min-h-[calc(100dvh-52px)] lg:min-h-[calc(100dvh-60px)]">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 pt-6 lg:pt-12 pb-10">
        <ContactStep initial={initial} />
      </div>
    </main>
  )
}
