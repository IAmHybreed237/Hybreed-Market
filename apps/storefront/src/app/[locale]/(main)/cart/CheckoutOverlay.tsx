"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PaymentWrapper from "@/components/organisms/PaymentContainer/PaymentWrapper"
import CartShippingMethodsSection from "@/components/sections/CartShippingMethodsSection/CartShippingMethodsSection"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { applyPromotions, deletePromotionCode } from "@/lib/data/cart"
import { convertToLocale } from "@/lib/helpers/money"
import { paymentInfoMap, WALLET_PROVIDER_ID } from "@/lib/constants"
import { getWalletStatement } from "@/lib/data/wallet"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { Cash } from "@medusajs/icons"
import {
  WB_FONT,
  addrLine,
  applySavedAddress,
  cartAddresses,
  deliveryLabelFor,
  stepGate,
  submitOrder,
  usePaymentSelect,
} from "@/components/checkout/checkout-shared"

const XIcon = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)
const PinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const ChevronRight = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const ChevronLeft = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
/* ---------- LEFT: delivery groups ---------- */
export const DeliveryGroups = ({ cart, shippingMethods, currencyCode, mobile = false }: { cart: any; shippingMethods: any; currencyCode: string; mobile?: boolean }) => {
  const items = cart?.items ?? []
  const groups: Record<string, { seller: any; items: any[] }> = {}
  items.forEach((item: any) => {
    const seller = item.offer?.seller
    const key = seller?.id || "store"
    if (!groups[key]) groups[key] = { seller: seller || { name: "Hybreed" }, items: [] }
    groups[key].items.push(item)
  })

  const optionSeller = new Map<string, string>()
  ;(shippingMethods ?? []).forEach((o: any) => {
    if (o?.id && o?.seller_id) optionSeller.set(o.id, o.seller_id)
  })
  const methodCostForSeller = (sellerId: string) => {
    const m = (cart?.shipping_methods ?? []).find(
      (sm: any) => sm.shipping_option_id && optionSeller.get(sm.shipping_option_id) === sellerId
    )
    return m ? Number(m.amount ?? 0) : null
  }

  return (
    <div className={mobile ? "flex flex-col gap-3.5" : "bg-white rounded-3xl p-[13px] self-start max-h-full overflow-y-auto"}>
      {Object.entries(groups).map(([key, g], gi) => {
        const cost = methodCostForSeller(key === "store" ? "" : key)
        const qty = g.items.reduce((a, i) => a + (i.quantity ?? 1), 0)
        return (
          <div key={key} className={gi > 0 && !mobile ? "mt-[14px] pt-[14px] border-t border-[#F0F0F3]" : ""}>
            <div className="flex items-baseline justify-between">
              <p className={`${mobile ? "text-[18px]" : "text-[17px] h-6"} font-semibold text-[#1F1F23]`} style={{ fontFamily: WB_FONT }}>
                {deliveryLabelFor(1)},{" "}
                {cost === null ? (
                  <span className="text-[#8A8A96] font-normal">delivery TBD</span>
                ) : (
                  <span className={cost === 0 ? "text-[#16A34A]" : "text-[#1F1F23]"}>
                    {convertToLocale({ amount: cost, currency_code: currencyCode })}
                  </span>
                )}
              </p>
              <span className="text-sm text-[#8A8A96]">
                {qty} {qty === 1 ? "item" : "items"}
              </span>
            </div>
            <div className={`flex flex-wrap gap-1.5 ${mobile ? "mt-3" : "mt-2"}`}>
              {g.items.map((item: any) => (
                <div
                  key={item.id}
                  title={item.product?.title || item.title || ""}
                  className={`bg-white border overflow-hidden shrink-0 ${mobile ? "w-[63px] h-[84px] rounded-[14px] border-[#E4E4EA]" : "w-[59px] h-[79px] rounded-lg border-[#EDEDF0]"}`}
                >
                  {item.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- RIGHT: checkout card with segmented control + address ---------- */
const CheckoutCard = ({ cart, customer, currencyCode }: { cart: any; customer: any; currencyCode: string }) => {
  const router = useRouter()
  const [mode, setMode] = useState<"pickup" | "courier">("courier")
  const [addrOpen, setAddrOpen] = useState(false)
  const [addrBusy, setAddrBusy] = useState(false)
  const addresses = cartAddresses(customer)
  const currentAddr = cart?.shipping_address
  const currentLabel = currentAddr?.address_1
    ? [currentAddr.address_1, currentAddr.city].filter(Boolean).join(", ")
    : null

  const pickAddress = async (a: any) => {
    setAddrBusy(true)
    try {
      await applySavedAddress(customer, a)
      setAddrOpen(false)
      router.refresh()
    } finally {
      setAddrBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-3.5 relative">
      <p className="text-[22px] font-semibold text-[#1F1F23]" style={{ fontFamily: WB_FONT }}>Checkout</p>
      {/* segmented control */}
      <div className="mt-3 h-11 rounded-xl bg-[#F4F4F7] p-1 flex shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        {(["pickup", "courier"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-[10px] text-[17px] font-medium transition-all ${
              mode === m ? "bg-white text-[#1F1F23] shadow-[0_2px_8px_rgba(0,0,0,0.14)]" : "text-[#6B6B76]"
            }`}
          >
            {m === "pickup" ? "Pickup point" : "Courier"}
          </button>
        ))}
      </div>
      {/* address row */}
      <button
        onClick={() => setAddrOpen((v) => !v)}
        className="mt-4 w-full h-11 flex items-center gap-2.5 text-left active:scale-[0.99]"
      >
        <span className="text-[#8A8A96] shrink-0"><PinIcon /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] text-[#8A8A96]">
            {mode === "pickup" ? "Pickup point" : "Delivery address"}
          </span>
          <span className={`block text-[17px] font-medium truncate ${currentLabel ? "text-[#1F1F23]" : "text-[#2563EB]"}`}>
            {currentLabel || (mode === "pickup" ? "Choose a pickup point" : "Choose a delivery address")}
          </span>
        </span>
        <span className="text-[#8A8A96]"><ChevronDown /></span>
      </button>
      {addrOpen && (
        <div className="mt-1 rounded-2xl bg-[#F4F4F7] p-1.5 max-h-56 overflow-y-auto">
          {addresses.length === 0 ? (
            <p className="text-sm text-[#8A8A96] px-2 py-3">No saved addresses</p>
          ) : (
            addresses.map((a: any) => (
              <button
                key={a.id}
                disabled={addrBusy}
                onClick={() => pickAddress(a)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm ${
                  currentAddr?.id === a.id ? "bg-white font-medium text-[#1F1F23]" : "text-[#1F1F23]"
                } hover:bg-white/70`}
              >
                {addrLine(a)}
              </button>
            ))
          )}
          <LocalizedClientLink
            href="/user/addresses"
            className="block px-3 py-2.5 text-sm font-medium text-[#2563EB]"
          >
            Manage addresses
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}

/* ---------- RIGHT: payment card ---------- */
const PaymentCard = ({ cart, paymentMethods, currencyCode }: { cart: any; paymentMethods: any; currencyCode: string }) => {
  const [toast, setToast] = useState<string | null>(null)
  const { session, select, busy, isSelected, selectError } = usePaymentSelect(cart)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  useEffect(() => {
    getWalletStatement()
      .then((s) => setWalletBalance(s?.balance ?? null))
      .catch(() => setWalletBalance(null))
  }, [])
  const providers = paymentMethods ?? []
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const updateEdges = () => {
    const el = scrollerRef.current
    if (!el) return
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }

  useEffect(() => {
    updateEdges()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener("scroll", updateEdges, { passive: true })
    window.addEventListener("resize", updateEdges)
    return () => {
      el.removeEventListener("scroll", updateEdges)
      window.removeEventListener("resize", updateEdges)
    }
  }, [providers.length])

  const scrollTiles = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const tile = el.querySelector<HTMLElement>("button")
    const step = (tile?.offsetWidth ?? 150) + 12
    el.scrollBy({ left: dir * step, behavior: "smooth" })
  }

  const showToast = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="bg-white rounded-3xl p-3.5">
      {/* timing tabs - "On receipt" isn't supported by our payment providers */}
      <div className="flex items-center gap-3 h-[35px]">
        <span className="h-[35px] px-3.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[15px] font-medium flex items-center">
          Now
        </span>
        <span
          title="Not available for this order"
          className="h-[35px] px-2.5 rounded-full text-[#1F1F23] text-[15px] font-normal flex items-center opacity-50 cursor-not-allowed"
        >
          On receipt
        </span>
      </div>

      {/* payment tiles */}
      <div className="relative mt-3">
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Hybreed Wallet - closed-loop balance, debits at order capture */}
        <button
          disabled={!!busy}
          onClick={() => select(WALLET_PROVIDER_ID)}
          className={`shrink-0 w-[150px] h-[100px] rounded-2xl p-3 flex flex-col justify-between text-left transition-colors ${
            isSelected(WALLET_PROVIDER_ID) ? "bg-[#EFF6FF] border-[1.5px] border-[#2563EB]" : "bg-[#F4F4F7]"
          }`}
        >
          <span className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2" /><path d="M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
            </svg>
          </span>
          <span>
            <span className="block text-[13px] font-medium text-[#1F1F23] leading-tight">Hybreed Wallet</span>
            <span className="block text-[13px] text-[#8A8A96]">
              {walletBalance != null
                ? `${Math.round(walletBalance).toLocaleString("en-US").replace(/,/g, " ")} XAF`
                : "Top up & pay"}
            </span>
          </span>
        </button>
        {providers.map((p: any) => {
          const info = paymentInfoMap[p.id]
          // Notch Pay hosts both MTN MoMo and Orange Money - one provider,
          // two tiles that lock the channel on the payment session.
          if (p.id.includes("notchpay")) {
            return (["cm.mtn", "cm.orange"] as const).map((channel) => {
              const busyKey = `${p.id}:${channel}`
              const selected = isSelected(p.id, channel)
              return (
                <button
                  key={busyKey}
                  disabled={!!busy}
                  onClick={() => select(p.id, channel)}
                  className={`shrink-0 w-[150px] h-[100px] rounded-2xl p-3 flex flex-col justify-between text-left transition-colors ${
                    selected ? "bg-[#EFF6FF] border-[1.5px] border-[#2563EB]" : "bg-[#F4F4F7]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={channel === "cm.mtn" ? "/images/payments/mtn-momo.png" : "/images/payments/orange-money.png"}
                      alt={channel === "cm.mtn" ? "MTN MoMo" : "Orange Money"}
                      className="h-6 w-auto object-contain"
                    />
                    {busy === busyKey && <span className="text-[11px] text-[#8A8A96]">…</span>}
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium text-[#1F1F23] leading-tight">
                      {channel === "cm.mtn" ? "MTN MoMo" : "Orange Money"}
                    </span>
                    <span className="block text-[13px] text-[#8A8A96]">Mobile Money</span>
                  </span>
                </button>
              )
            })
          }
          const selected = isSelected(p.id)
          return (
            <button
              key={p.id}
              disabled={!!busy}
              onClick={() => select(p.id)}
              className={`shrink-0 w-[150px] h-[100px] rounded-2xl p-3 flex flex-col justify-between text-left transition-colors ${
                selected ? "bg-[#EFF6FF] border-[1.5px] border-[#2563EB]" : "bg-[#F4F4F7]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                  {info?.icon ?? <Cash className="w-4 h-4" />}
                </span>
                {busy === p.id && <span className="text-[11px] text-[#8A8A96]">…</span>}
              </span>
              <span>
                <span className="block text-[13px] font-medium text-[#1F1F23] leading-tight">
                  {info?.title || p.id}
                </span>
                <span className="block text-[13px] text-[#8A8A96]">Manual payment</span>
              </span>
            </button>
          )
        })}
        <button
          onClick={() => showToast("Card payments are coming soon")}
          className="shrink-0 w-[118px] h-[100px] rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border-[1.5px] border-dashed border-[#8A8A96]/50 text-[#6B6B76]"
        >
          <span className="text-xl leading-none">+</span>
          <span className="text-[13px] font-medium text-center leading-tight">Link a card / number</span>
        </button>
        {toast && (
          <span className="shrink-0 self-center text-[13px] text-[#B91C1C] bg-[#FEE2E2] px-3 py-1.5 rounded-full">
            {toast}
          </span>
        )}
      </div>
      {edges.left && (
        <button
          onClick={() => scrollTiles(-1)}
          aria-label="Scroll payment options left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.22)] border border-black/[0.04] flex items-center justify-center text-[#1F1F23] hover:bg-[#F4F4F7]"
        >
          <ChevronLeft s={14} />
        </button>
      )}
      {edges.right && (
        <button
          onClick={() => scrollTiles(1)}
          aria-label="Scroll payment options right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.22)] border border-black/[0.04] flex items-center justify-center text-[#1F1F23] hover:bg-[#F4F4F7]"
        >
          <ChevronRight s={14} />
        </button>
      )}
      </div>

      {selectError && (
        <p className="mt-2 text-[13px] text-[#B91C1C]">{selectError}</p>
      )}

      {/* info box */}
      {session && (
        <div className="mt-3 rounded-2xl bg-[#F4F4F7] px-3.5 py-3 text-sm leading-[19px] text-[#3A3A44]">
          You&apos;ll pay the full amount of{" "}
          {convertToLocale({ amount: cart?.total ?? 0, currency_code: currencyCode })} now.
        </div>
      )}
    </div>
  )
}

/* ---------- promo card ---------- */
const PromoCard = ({ cart }: { cart: any }) => {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const applied = cart?.promotions?.[0]

  const apply = async () => {
    if (!code.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await applyPromotions([code.trim()])
      if (!res.success) setError(res.error || "Invalid code")
      else if (!res.applied) setError("Code is not valid for this cart")
      else setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-[20px] min-h-[50px] px-3.5 flex flex-col justify-center">
      {applied ? (
        <div className="flex items-center justify-between h-[50px]">
          <p className="text-[17px] font-semibold text-[#1F1F23] truncate">
            {applied.code} <span className="text-[#16A34A] font-medium">· applied</span>
          </p>
          <button
            aria-label="Remove promo code"
            onClick={async () => {
              await deletePromotionCode(applied.id)
            }}
            className="w-9 h-9 flex items-center justify-center text-[#8A8A96]"
          >
            <XIcon s={18} />
          </button>
        </div>
      ) : open ? (
        <div className="py-2">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Promo code"
              className="flex-1 h-9 rounded-xl bg-[#F4F4F7] px-3 text-[15px] text-[#1F1F23] outline-none focus:ring-2 focus:ring-[#2563EB]/40"
            />
            <button
              onClick={apply}
              disabled={busy || !code.trim()}
              className="h-9 px-4 rounded-xl bg-[#2563EB] text-white text-sm font-medium disabled:opacity-50"
            >
              Apply
            </button>
          </div>
          {error && <p className="text-[13px] text-[#DC2626] mt-1.5">{error}</p>}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="w-full h-[50px] flex items-center justify-between">
          <span className="text-[17px] font-semibold text-[#1F1F23]">Promo code</span>
          <span className="text-[#8A8A96]"><ChevronRight /></span>
        </button>
      )}
    </div>
  )
}

/* ---------- shipping section (existing, needed for per-seller methods) ---------- */
const ShippingBlock = ({ cart, shippingMethods }: { cart: any; shippingMethods: any }) => (
  <CartShippingMethodsSection cart={cart} availableShippingMethods={shippingMethods} hideTitle alwaysOpen />
)

/* ---------- body ---------- */
const OverlayBody = ({
  cart,
  customer,
  shippingMethods,
  paymentMethods,
  currencyCode,
}: {
  cart: any
  customer: any
  shippingMethods: any
  paymentMethods: any
  currencyCode: string
}) => (
  <div className="flex flex-col gap-1.5 pb-56">
    <CheckoutCard cart={cart} customer={customer} currencyCode={currencyCode} />
    <ShippingBlock cart={cart} shippingMethods={shippingMethods} />
    <PaymentCard cart={cart} paymentMethods={paymentMethods} currencyCode={currencyCode} />
    <PromoCard cart={cart} />
    {/* Hybreed+ membership + Priority order: hidden - neither exists yet */}
  </div>
)

/* ---------- totals + terms + place order ---------- */
const WbPlaceOrder = ({ cart, currencyCode, disabled }: { cart: any; currencyCode: string; disabled: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  const pay = async () => {
    if (disabled || !agreed || submitting) return
    setSubmitting(true)
    setError(null)
    const res = await submitOrder(cart)
    if (!res.ok) setError(res.error || "Payment failed")
    setSubmitting(false)
  }

  const blocked = disabled || !agreed || submitting
  const total = convertToLocale({ amount: cart?.total ?? 0, currency_code: currencyCode })

  return (
    <div>
      {error && (
        <div className="mb-2 rounded-2xl bg-[#FEE2E2] text-[#B91C1C] text-sm px-3.5 py-2.5">
          {error}
        </div>
      )}
      <label className="flex items-start gap-2.5 mb-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded accent-[#2563EB]"
        />
        <span className="text-[13px] text-[#6B6B76] leading-snug">
          I agree to the Hybreed Terms of Service and Return Policy
        </span>
      </label>
      <button
        onClick={pay}
        disabled={blocked}
        className={`w-full h-[49px] rounded-2xl px-4 flex items-center justify-between text-white transition-all active:scale-[0.99] ${
          blocked ? "bg-[#2563EB] opacity-60 cursor-not-allowed" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
        }`}
      >
        <span className="text-base font-semibold">
          {submitting ? "Placing order…" : "Place Order"}
        </span>
        {!submitting && (
          <span className="flex items-center gap-1.5 text-base font-semibold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2" /><path d="M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
            </svg>
            {total}
          </span>
        )}
      </button>
      {disabled && !submitting && (
        <p className="text-[13px] text-[#B91C1C] mt-1.5">Choose a delivery address and complete the steps above</p>
      )}
    </div>
  )
}

const Footer = ({ cart, currencyCode }: { cart: any; currencyCode: string }) => {
  const qty = (cart?.items ?? []).reduce((a: number, i: any) => a + (i.quantity ?? 1), 0)
  const gate = stepGate(cart)
  return (
    <div className="sticky bottom-0 z-[2] bg-white rounded-t-3xl px-3 pt-3 pb-3.5">
      <div className="mb-2.5">
        <div className="flex justify-between items-baseline">
          <span className="text-lg font-semibold text-[#1F1F23]">Total</span>
          <span className="text-lg font-semibold text-[#1F1F23]">
            {convertToLocale({ amount: cart?.total ?? 0, currency_code: currencyCode })}
          </span>
        </div>
        <p className="text-sm text-[#6B6B76] mt-0.5">
          {qty} {qty === 1 ? "item" : "items"} totaling{" "}
          {convertToLocale({ amount: cart?.item_subtotal ?? 0, currency_code: currencyCode })}
        </p>
        {(cart?.discount_total ?? 0) > 0 && (
          <p className="text-sm text-[#16A34A] mt-0.5">
            Discounts −{convertToLocale({ amount: cart.discount_total, currency_code: currencyCode })}
          </p>
        )}
      </div>
      <WbPlaceOrder cart={cart} currencyCode={currencyCode} disabled={!gate} />
    </div>
  )
}

/* ---------- overlay shell ---------- */
export const CheckoutOverlay = ({
  open,
  onClose,
  cart,
  customer,
  shippingMethods,
  paymentMethods,
  currencyCode,
}: {
  open: boolean
  onClose: () => void
  cart: any
  customer: any
  shippingMethods: any
  paymentMethods: any
  currencyCode: string
}) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onPop = () => {
      if (new URLSearchParams(window.location.search).get("checkout") !== "1") {
        onClose()
      }
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [onClose])

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    if (new URLSearchParams(window.location.search).get("checkout") !== "1") {
      window.history.pushState({ checkout: true }, "", "?checkout=1")
    }
    const t = setTimeout(() => closeRef.current?.focus(), 50)
    return () => {
      clearTimeout(t)
      const p = new URLSearchParams(window.location.search)
      if (p.get("checkout") === "1") {
        p.delete("checkout")
        const qs = p.toString()
        window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""))
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab" && panelRef.current) {
        const els = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )
        if (!els.length) return
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open || !cart) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-md"
        style={{ animation: "ovFade .2s ease-out" }}
        onClick={onClose}
      />
      <button
        ref={closeRef}
        aria-label="Close checkout"
        onClick={onClose}
        className="absolute z-[102] top-[18px] w-12 h-12 rounded-2xl bg-white hover:bg-[#F4F4F7] flex items-center justify-center text-[#1F1F23] shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
        style={{ right: "calc(min(920px, 100vw - 80px) + 12px)", animation: "ovFade .2s ease-out" }}
      >
        <XIcon />
      </button>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-overlay-title"
        className="absolute right-0 top-0 bottom-0 bg-[#F2F2F5] overflow-hidden grid grid-cols-2 gap-1.5"
        style={{
          width: "min(920px, calc(100vw - 80px))",
          borderTopLeftRadius: 40,
          borderBottomLeftRadius: 40,
          padding: "12px 12px 10px 13px",
          animation: "ovSlideIn .32s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <style>{`
          @keyframes ovFade{from{opacity:0}to{opacity:1}}
          @keyframes ovSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
          @media (prefers-reduced-motion:reduce){*{animation:ovFade .2s ease-out!important}}
          .ov-col{overflow-y:auto;min-height:0;scrollbar-width:none}
          .ov-col::-webkit-scrollbar{display:none}
        `}</style>
        <h2 id="checkout-overlay-title" className="sr-only">Checkout</h2>
        <div className="ov-col">
          <DeliveryGroups cart={cart} shippingMethods={shippingMethods} currencyCode={currencyCode} />
        </div>
        <div className="ov-col relative">
          <PaymentWrapper cart={cart}>
            <Suspense fallback={<div className="p-6 text-[#8A8A96]">Loading checkout…</div>}>
              <OverlayBody
                cart={cart}
                customer={customer}
                shippingMethods={shippingMethods}
                paymentMethods={paymentMethods}
                currencyCode={currencyCode}
              />
            </Suspense>
          </PaymentWrapper>
          <Footer cart={cart} currencyCode={currencyCode} />
        </div>
      </div>
    </div>
  )
}
