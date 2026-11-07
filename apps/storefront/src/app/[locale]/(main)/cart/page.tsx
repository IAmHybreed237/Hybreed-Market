import { Metadata } from "next"
import { getOrSetCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { getRegion } from "@/lib/data/regions"
import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import { CartClient } from "./CartClient"

export const metadata: Metadata = {
  title: "Cart",
  description: "My cart page",
  robots: { index: false, follow: false },
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const region = await getRegion(locale)
  const [cart, user] = await Promise.all([
    region ? getOrSetCart(locale) : Promise.resolve(null),
    retrieveCustomer().catch(() => null),
  ])

  const [shippingMethods, paymentMethods] = cart
    ? await Promise.all([
        listCartShippingMethods(cart.id, false),
        listCartPaymentMethods(cart.region?.id ?? region?.id ?? ""),
      ])
    : [null, null]

  return (
    <CartClient
      cart={cart as any}
      locale={locale}
      addresses={(user as any)?.addresses || []}
      currencyCode={region?.currency_code?.toUpperCase() || "XAF"}
      checkoutData={{
        customer: user,
        shippingMethods,
        paymentMethods,
      }}
    />
  )
}
