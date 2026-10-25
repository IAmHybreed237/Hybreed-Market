import { retrieveCustomer } from "@/lib/data/customer"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { redirect } from "next/navigation"
import { MyHybreedClient } from "./MyHybreedClient"

const tabs = [
  { label: "Home", href: "/user" },
  { label: "My Hybreed", href: "/user/my-hybreed", active: true },
  { label: "Orders", href: "/user/orders" },
  { label: "Purchases", href: "/user/orders" },
  { label: "Hybreed Travel", href: "/user" },
  { label: "Favorites", href: "/user/favorites" },
  { label: "Hybreed Wallet", href: "/user/wallet" },
  { label: "Reviews & questions", href: "/user" },
  { label: "More", href: "/user" },
]

export default async function MyHybreedPage() {
  const user = await retrieveCustomer().catch(() => null)
  if (!user) redirect("/login")

  return (
    <main className="w-full max-w-[1400px] mx-auto px-[5px]">
      {/* desktop tab nav — My Hybreed active */}
      <nav className="hidden md:flex items-center justify-between h-16 mb-1" aria-label="Account sections">
        {tabs.map((t) => (
          <LocalizedClientLink
            key={t.label}
            href={t.href}
            className={`text-[15px] font-semibold transition-colors ${
              t.active ? "text-[#2563EB]" : "text-[#1F1F23] hover:text-[#2563EB]"
            }`}
            aria-current={t.active ? "page" : undefined}
          >
            {t.label}
          </LocalizedClientLink>
        ))}
      </nav>

      <MyHybreedClient />
    </main>
  )
}
