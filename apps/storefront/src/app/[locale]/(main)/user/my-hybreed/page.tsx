import { retrieveCustomer } from "@/lib/data/customer"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { redirect } from "next/navigation"
import { MyHybreedClient } from "./MyHybreedClient"

const tabs = [
  { label: "Home", href: "/user" },
  { label: "My Hybreed", href: "/user/my-hybreed", active: true },
  { label: "Orders", href: "/user/orders" },
  { label: "Purchases", href: "/user/orders" },
  { label: "Favorites", href: "/user/favorites" },
  { label: "Hybreed Wallet", href: "/user/wallet" },
  { label: "Reviews & questions", href: "/user" },
  { label: "More", href: "/user" },
]

export default async function MyHybreedPage() {
  const user = await retrieveCustomer().catch(() => null)
  if (!user) redirect("/login")

  // loyalty state stored in customer metadata
  const loyalty = {
    xp: 0,
    points: 0,
    streakDay: 0,
    lastClaim: "",
    ...(((user.metadata as any)?.loyalty as any) || {}),
  }
  const today = new Date().toISOString().slice(0, 10)
  const yest = new Date(Date.now() - 86400e3).toISOString().slice(0, 10)
  const claimedToday = loyalty.lastClaim === today
  const streakDone = claimedToday
    ? loyalty.streakDay
    : loyalty.lastClaim === yest
      ? loyalty.streakDay
      : 0

  // real spend total from orders
  const orders = (user.orders as any[]) || []
  const spend = orders
    .filter((o) => o.status !== "canceled" && !o.canceled_at)
    .reduce((s, o) => s + (Number(o.total) || 0), 0)

  const data = {
    xpTotal: loyalty.xp,
    spendCur: spend,
    spendMax: 5000,
    points: loyalty.points || loyalty.xp,
    streakDone,
    claimedToday,
    hasAddress: !!(user.addresses as any)?.length,
    hasPhone: !!user.phone,
    hasOrders: orders.length > 0,
  }

  return (
    <main className="w-full max-w-[1400px] mx-auto px-0 md:px-[5px]">
      {/* desktop tab nav - My Hybreed active */}
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

      <MyHybreedClient data={data} />
    </main>
  )
}
