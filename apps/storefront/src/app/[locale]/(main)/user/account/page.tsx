import { redirect } from "next/navigation"

import { retrieveCustomer } from "@/lib/data/customer"
import { listOrders } from "@/lib/data/orders"

import { AccountMobile } from "./AccountMobile"

export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect("/login")
  }

  // Items from delivered orders are candidates for "awaiting your review".
  // There is no reviews backend yet, so nothing can filter them further.
  const orders = (await listOrders(20)) || []

  const reviewItems = orders
    .filter((o: any) => o.fulfillment_status === "delivered")
    .flatMap((o: any) =>
      (o.items || []).map((item: any) => ({
        id: item.id,
        orderId: o.id,
        title: item.product_title || item.title || "Item",
        seller: o.seller?.name || "",
        thumbnail: item.thumbnail || item.product?.thumbnail || null,
        // Medusa orders carry no delivered_at timestamp; use updated_at as a proxy.
        deliveredAt: o.updated_at || o.created_at,
      }))
    )
    .slice(0, 10)

  return (
    <AccountMobile
      name={[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Account"}
      phone={customer.phone || ""}
      email={customer.email || ""}
      reviewItems={reviewItems}
    />
  )
}
