import { retrieveCustomer } from "@/lib/data/customer"
import { listOrders } from "@/lib/data/orders"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { redirect } from "next/navigation"

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const OrderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 2h12l2 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
    <path d="M4 6h16" /><path d="M9 10a3 3 0 0 0 6 0" />
  </svg>
)

const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  const yest = new Date(today)
  yest.setDate(today.getDate() - 1)
  if (same(d, today)) return "Today"
  if (same(d, yest)) return "Yesterday"
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  })
}

const fmt = (n: number, c = "xaf") =>
  `${n.toLocaleString("en-US").replace(/,/g, " ")} ${c.toUpperCase()}`

const statusLabel = (o: any) =>
  o.payment_status === "captured" ? "Paid"
  : o.status === "completed" ? "Completed"
  : o.status === "canceled" ? "Cancelled"
  : o.status || "Processing"

export default async function SpendingPage() {
  const customer = await retrieveCustomer()
  if (!customer) redirect("/user")

  const orders: any[] = (await listOrders(100)) || []

  const now = new Date()
  const monthOrders = orders.filter((o) => {
    const d = new Date(o.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthTotal = monthOrders.reduce((s, o) => s + (o.total || 0), 0)
  const cur = orders[0]?.currency_code || "xaf"
  const monthName = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  // group all orders by day, already sorted desc by API
  const groups = new Map<string, any[]>()
  for (const o of orders) {
    const k = dayLabel(o.created_at)
    groups.set(k, [...(groups.get(k) || []), o])
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] pb-24">
      <style>{`@media (max-width:767px){[data-testid="footer"]{display:none!important}}`}</style>
      <div className="max-w-[480px] mx-auto px-4 pt-4">
        {/* header */}
        <div className="h-11 flex items-center gap-1">
          <LocalizedClientLink
            href="/user/wallet"
            aria-label="Back"
            className="w-11 h-11 -ml-2 flex items-center justify-center text-[#1F1F23]"
          >
            <BackIcon />
          </LocalizedClientLink>
          <h1 className="text-[24px] font-semibold text-[#1F1F23]">
            Monthly spending
          </h1>
        </div>

        {/* month total card */}
        <div className="mt-4 bg-white rounded-[28px] p-4 flex items-center justify-between">
          <div>
            <p className="text-[15px] text-[#8A8A96]">{monthName}</p>
            <p className="text-[26px] font-semibold text-[#1F1F23] mt-0.5">
              {fmt(monthTotal, cur)}
            </p>
          </div>
          <span className="w-11 h-11 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
            <OrderIcon />
          </span>
        </div>
        <p className="mt-2 px-1 text-[13px] text-[#8A8A96]">
          {monthOrders.length} order{monthOrders.length === 1 ? "" : "s"} this
          month · {orders.length} all time
        </p>

        {/* history grouped by day */}
        {[...groups.entries()].map(([day, list]) => (
          <div key={day} className="mt-5">
            <p className="px-1 text-[15px] font-medium text-[#8A8A96]">{day}</p>
            <div className="mt-2 bg-white rounded-[28px] overflow-hidden">
              {list.map((o, i) => (
                <LocalizedClientLink
                  key={o.id}
                  href={`/user/orders/${o.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 active:scale-[0.99] transition-transform ${
                    i > 0 ? "border-t border-[#F0F0F3]" : ""
                  }`}
                >
                  <span className="w-10 h-10 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                    <OrderIcon />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium text-[#1F1F23] truncate">
                      Order #{o.display_id || o.id.slice(-6)}
                    </span>
                    <span className="block text-[13px] text-[#8A8A96] mt-0.5">
                      {new Date(o.created_at).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {statusLabel(o)}
                    </span>
                  </span>
                  <span className="text-[16px] font-semibold text-[#1F1F23] whitespace-nowrap">
                    −{fmt(o.total || 0, o.currency_code || cur)}
                  </span>
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        ))}

        {!orders.length && (
          <div className="mt-10 bg-white rounded-[28px] p-6 text-center">
            <p className="text-[17px] font-medium text-[#1F1F23]">
              No spending yet
            </p>
            <p className="text-[14px] text-[#8A8A96] mt-1">
              Your purchases will show up here with dates and totals.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
