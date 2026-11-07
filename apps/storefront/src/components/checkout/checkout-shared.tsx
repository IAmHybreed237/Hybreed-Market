"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  applyPromotions,
  deletePromotionCode,
  initiatePaymentSession,
  placeOrder,
  updateCart,
} from "@/lib/data/cart"
import { isNotchPay, isWallet, WALLET_PROVIDER_ID } from "@/lib/constants"

/** Instant discount applied automatically when paying with Hybreed Balance. */
export const WALLET_PROMO_CODE = "WALLET3"

export const WB_FONT =
  '"Google Sans", "WB Currency", "Segoe UI", -apple-system, Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif'

export const deliveryLabelFor = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const wdFull = d.toLocaleDateString("en-US", { weekday: "short" })
  if (offsetDays === 1) return `${wdFull.slice(0, 2)}, tomorrow`
  return `${wdFull.slice(0, 2)}, ${d.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
}

export const addrLine = (a: any) =>
  [a?.address_1, a?.city, a?.country_code?.toUpperCase()].filter(Boolean).join(", ")

export const cartAddresses = (customer: any) =>
  (customer?.addresses ?? []).filter(
    (a: any) => !a.country_code || a.country_code === "cm"
  )

/** Writes a saved account address onto the cart (shipping + billing + email). */
export const applySavedAddress = async (customer: any, a: any) => {
  const addr = {
    first_name: a.first_name,
    last_name: a.last_name,
    address_1: a.address_1,
    address_2: a.address_2 || "",
    company: a.company || "",
    postal_code: a.postal_code || "",
    city: a.city,
    country_code: a.country_code || "cm",
    province: a.province || "",
    phone: a.phone || "",
  }
  await updateCart({
    shipping_address: addr as any,
    billing_address: addr as any,
    email: customer?.email,
  } as any)
}

/** Order-completion gate: address + per-seller shipping + payment session. */
export const stepGate = (cart: any) => {
  const paidByGiftcard = cart?.gift_cards?.length > 0 && cart?.total === 0
  const cartSellerCount = new Set(
    (cart?.items ?? []).map((i: any) => i.offer?.seller_id).filter(Boolean)
  ).size
  const allSellersHaveShipping =
    (cart?.shipping_methods?.length ?? 0) > 0 &&
    cart.shipping_methods.length >= cartSellerCount
  return (
    !!cart?.shipping_address &&
    allSellersHaveShipping &&
    (!!cart?.payment_collection || paidByGiftcard)
  )
}

export const pendingSession = (cart: any) =>
  cart?.payment_collection?.payment_sessions?.find(
    (s: any) => s.status === "pending" || s.status === "pending_authorization"
  )

/**
 * Shared payment-method selection: creates/replaces the pending payment
 * session (Notch Pay tiles pass a locked channel + guest customer data).
 */
export const usePaymentSelect = (cart: any) => {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [selectError, setSelectError] = useState<string | null>(null)
  const session = pendingSession(cart)

  const select = async (providerId: string, channel?: string) => {
    const key = channel ? `${providerId}:${channel}` : providerId
    const sameSession =
      session?.provider_id === providerId &&
      (!channel || session?.data?.notchpay_channel === channel)
    if (sameSession || busy) return
    setPicked(key)
    setSelectError(null)
    setBusy(key)
    try {
      // Wallet orders get an instant discount; other methods drop it. The
      // promo must be applied before the session so its amount matches the
      // discounted cart total.
      const walletPromo = cart?.promotions?.find(
        (p: any) => p.code === WALLET_PROMO_CODE
      )
      if (isWallet(providerId)) {
        if (!walletPromo) await applyPromotions([WALLET_PROMO_CODE])
      } else if (walletPromo) {
        await deletePromotionCode(walletPromo.id)
      }
      await initiatePaymentSession(cart, {
        provider_id: providerId,
        ...(channel
          ? {
              data: {
                notchpay_channel: channel,
                customer_email: cart?.email,
                customer_phone: cart?.shipping_address?.phone,
                customer_name: [cart?.shipping_address?.first_name, cart?.shipping_address?.last_name]
                  .filter(Boolean)
                  .join(" "),
              },
            }
          : {}),
      })
      router.refresh()
    } catch (e: any) {
      setPicked(null)
      setSelectError(
        e?.message?.replace("Error setting up the request: ", "") ||
          "Couldn't set the payment method"
      )
    } finally {
      setBusy(null)
    }
  }

  const isSelected = (providerId: string, channel?: string) => {
    const key = channel ? `${providerId}:${channel}` : providerId
    return (
      (session?.provider_id === providerId &&
        (!channel || session?.data?.notchpay_channel === channel)) ||
      picked === key
    )
  }

  return { session, select, busy, isSelected, selectError }
}

/**
 * Completes the order. Notch Pay: place order with skipRedirect, stash the
 * order group id, then send the customer to the hosted authorization URL
 * (or the order page). Other providers use the shared redirecting flow.
 * Returns { ok:false, error } on failure; navigates away on success.
 */
export const submitOrder = async (
  cart: any
): Promise<{ ok: boolean; error?: string }> => {
  const session = pendingSession(cart)
  const authorizationUrl = session?.data?.authorization_url as string | undefined
  try {
    if (isNotchPay(session?.provider_id)) {
      const res = await placeOrder(undefined, { skipRedirect: true })
      if (!res.ok) {
        return { ok: false, error: res.error?.message || "Payment failed" }
      }
      const orderGroupId = res.data?.order_group?.id as string | undefined
      if (orderGroupId && typeof window !== "undefined") {
        sessionStorage.setItem("hybreed_pending_order_group", orderGroupId)
      }
      if (authorizationUrl) {
        window.location.href = authorizationUrl
        return { ok: true }
      }
      if (orderGroupId) {
        window.location.href = `/user/orders/${orderGroupId}`
        return { ok: true }
      }
      return { ok: true }
    }
    await placeOrder()
    return { ok: true }
  } catch (e: any) {
    if (e?.message === "NEXT_REDIRECT") return { ok: true }
    return {
      ok: false,
      error:
        e?.message?.replace("Error setting up the request: ", "") ||
        "Payment failed",
    }
  }
}
