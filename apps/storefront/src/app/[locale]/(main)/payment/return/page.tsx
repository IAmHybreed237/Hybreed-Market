"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Container, Heading, Text } from "@medusajs/ui"
import { Button } from "@/components/atoms"

const ORDER_GROUP_KEY = "hybreed_pending_order_group"

const PaymentReturnContent = () => {
  const searchParams = useSearchParams()
  const [orderGroupId, setOrderGroupId] = useState<string | null>(null)

  const status = searchParams.get("status")
  const reference = searchParams.get("reference")
  const trxref = searchParams.get("trxref")

  useEffect(() => {
    setOrderGroupId(sessionStorage.getItem(ORDER_GROUP_KEY))
  }, [])

  const isComplete = status === "complete"
  const isFailed = ["failed", "canceled", "expired", "abandoned", "rejected"].includes(
    status ?? ""
  )

  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-y-4 py-16 text-center">
      <Heading level="h1" className="text-2xl-regular">
        {isComplete
          ? "Payment received"
          : isFailed
            ? "Payment not completed"
            : "Confirming your payment"}
      </Heading>
      <Text className="text-ui-fg-subtle max-w-md">
        {isComplete &&
          "Thank you! Your Mobile Money payment was received. Your order is being confirmed - this can take a few seconds."}
        {isFailed &&
          "Your payment could not be completed. No amount was charged. You can try again from your cart."}
        {!isComplete && !isFailed &&
          "We are waiting for confirmation from your Mobile Money provider. If you already approved the payment, your order will be confirmed automatically."}
      </Text>
      {reference && (
        <Text className="text-ui-fg-muted text-sm" data-testid="payment-reference">
          Reference: {reference}
          {trxref ? ` · ${trxref}` : ""}
        </Text>
      )}
      <div className="mt-4 flex gap-3">
        {orderGroupId && (
          <Link href={`/user/orders/${orderGroupId}`}>
            <Button variant="tonal">View my order</Button>
          </Link>
        )}
        <Link href="/cart">
          <Button variant="tonal">Back to cart</Button>
        </Link>
      </div>
    </Container>
  )
}

const PaymentReturnPage = () => {
  return (
    <Suspense>
      <PaymentReturnContent />
    </Suspense>
  )
}

export default PaymentReturnPage
