"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import CartShippingMethodsSection from "@/components/sections/CartShippingMethodsSection/CartShippingMethodsSection"
import PaymentWrapper from "@/components/organisms/PaymentContainer/PaymentWrapper"
import { applyPromotions, deletePromotionCode } from "@/lib/data/cart"
import { convertToLocale } from "@/lib/helpers/money"
import { paymentInfoMap, WALLET_PROVIDER_ID } from "@/lib/constants"
import { getWalletStatement } from "@/lib/data/wallet"
import { Cash } from "@medusajs/icons"
import { DeliveryGroups } from "@/app/[locale]/(main)/cart/CheckoutOverlay"
import {
  WB_FONT,
  addrLine,
  applySavedAddress,
  cartAddresses,
  pendingSession,
  stepGate,
  submitOrder,
  usePaymentSelect,
} from "@/components/checkout/checkout-shared"

/* ---------- icons ---------- */
const ChevronRight = ({ s = 20, className = "" }: { s?: number; className?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const ChevronLeft = ({ s = 28 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const ChevronDown = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const PinIcon = ({ filled = false, size = 20 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const TicketIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z" />
  </svg>
)
const WalletGlyph = () => (
  <svg width="18" height="14" viewBox="0 0 24 16" fill="none" aria-hidden>
    <rect x="1" y="1" width="22" height="14" rx="3" fill="#fff" opacity="0.95" />
    <rect x="4" y="5" width="10" height="2" rx="1" fill="#2563EB" />
    <circle cx="18" cy="10" r="2" fill="#2563EB" />
  </svg>
)
const CardPlusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="8" y1="14.5" x2="12" y2="14.5" />
    <circle cx="17" cy="16" r="3.2" fill="#F0F0F3" stroke="none" />
    <line x1="17" y1="14.4" x2="17" y2="17.6" />
    <line x1="15.4" y1="16" x2="18.6" y2="16" />
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

/* ---------- WB-style checkbox ---------- */
const WbCheckbox = ({ checked, onChange, label, invalid }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; invalid?: boolean }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex items-start gap-4 w-full text-left active:scale-[0.99] py-1"
  >
    <span
      className={`mt-[1px] w-5 h-5 rounded-[7px] shrink-0 flex items-center justify-center transition-colors ${
        checked ? "bg-[#2563EB]" : "border-2 border-[#C9C9D2] bg-transparent"
      } ${invalid ? "ring-2 ring-[#DC2626]" : ""}`}
    >
      {checked && <CheckIcon />}
    </span>
    <span className="text-[15px] leading-[18px] text-[#1F1F23]">{label}</span>
  </button>
)

/* ---------- A. sticky header ---------- */
const MobileHeader = ({ qty, total, currencyCode }: { qty: number; total: number; currencyCode: string }) => (
  <div className="sticky top-0 z-40 bg-white rounded-b-[28px]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
    <div className="h-14 flex items-center px-4 relative">
      <LocalizedClientLink
        href="/cart"
        aria-label="Back to cart"
        className="w-11 h-11 -ml-2.5 flex items-center justify-center text-[#2563EB] active:scale-95"
      >
        <ChevronLeft />
      </LocalizedClientLink>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none px-16">
        <p className="text-[20px] font-semibold text-[#1F1F23] leading-6" style={{ fontFamily: WB_FONT }}>Checkout</p>
        <p className="text-[15px] text-[#6B6B76] leading-5">
          {qty} {qty === 1 ? "item" : "items"},{" "}
          {convertToLocale({ amount: total, currency_code: currencyCode })}
        </p>
      </div>
      <span className="w-11" />
    </div>
  </div>
)

/* ---------- B. delivery card ---------- */
const DeliveryCard = ({
  cart,
  customer,
  shippingMethods,
  currencyCode,
  mode,
  setMode,
  addrOpen,
  setAddrOpen,
}: {
  cart: any
  customer: any
  shippingMethods: any
  currencyCode: string
  mode: "pickup" | "courier"
  setMode: (m: "pickup" | "courier") => void
  addrOpen: boolean
  setAddrOpen: (v: boolean) => void
}) => {
  const router = useRouter()
  const [addrBusy, setAddrBusy] = useState(false)
  const addresses = cartAddresses(customer)
  const hasAddress = !!cart?.shipping_address
  const currentLabel = cart?.shipping_address?.address_1
    ? [cart.shipping_address.address_1, cart.shipping_address.city].filter(Boolean).join(", ")
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
    <section id="mb-delivery" className="bg-white rounded-[28px] px-4 pt-[15px] pb-4">
      {/* segmented control */}
      <div className="h-10 rounded-full bg-[#F0F0F3] p-0.5 flex">
        {(["pickup", "courier"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full text-[18px] transition-colors ${
              mode === m
                ? "bg-white border border-[#E4E4EA] font-medium text-[#1F1F23]"
                : "font-normal text-[#1F1F23] opacity-85"
            }`}
          >
            {m === "pickup" ? "Pickup point" : "Courier"}
          </button>
        ))}
      </div>

      {/* address row */}
      <button
        onClick={() => setAddrOpen(true)}
        className="mt-2 w-full h-14 flex items-center gap-3 text-left active:scale-[0.98]"
      >
        {hasAddress ? (
          <>
            <span className="text-[#6B6B76] shrink-0"><PinIcon size={20} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] text-[#6B6B76]">
                {mode === "pickup" ? "Pickup point" : "Delivery address"}
              </span>
              <span className="block text-[17px] font-medium text-[#1F1F23] truncate">
                {currentLabel}
              </span>
            </span>
            <span className="text-[#6B6B76]"><ChevronRight s={22} /></span>
          </>
        ) : (
          <>
            <span className="text-[#F59E0B] shrink-0"><PinIcon filled size={20} /></span>
            <span className="flex-1 text-[18px] font-medium text-[#F59E0B]">
              {mode === "pickup" ? "Select pickup point" : "Select delivery address"}
            </span>
            <span className="text-[#F59E0B]"><ChevronRight s={22} /></span>
          </>
        )}
      </button>
      <div className="border-t border-[#E4E4EA] ml-9" />

      {/* delivery date area */}
      <div className="mt-4">
        {!hasAddress ? (
          <p className="text-[20px] leading-[22px] font-semibold text-[#6B6B76]">
            Select an address to see the delivery date
          </p>
        ) : (
          <>
            <DeliveryGroups cart={cart} shippingMethods={shippingMethods} currencyCode={currencyCode} mobile />
            {/* per-seller shipping method picker - required to complete the order */}
            <div className="mt-4">
              <CartShippingMethodsSection
                cart={cart}
                availableShippingMethods={shippingMethods}
                hideTitle
                alwaysOpen
              />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/* ---------- address bottom sheet ---------- */
const AddressSheet = ({
  open,
  onClose,
  customer,
  cart,
}: {
  open: boolean
  onClose: () => void
  customer: any
  cart: any
}) => {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const addresses = cartAddresses(customer)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] max-h-[75vh] flex flex-col pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-[18px] font-semibold text-[#1F1F23]">Select address</p>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center text-[#6B6B76]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto px-2">
          {addresses.length === 0 ? (
            <p className="text-sm text-[#6B6B76] px-3 py-4">No saved addresses</p>
          ) : (
            addresses.map((a: any) => (
              <button
                key={a.id}
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    await applySavedAddress(customer, a)
                    onClose()
                    router.refresh()
                  } finally {
                    setBusy(false)
                  }
                }}
                className={`w-full text-left px-3 py-3.5 rounded-2xl text-[15px] ${
                  cart?.shipping_address?.id === a.id ? "bg-[#EFF6FF] font-medium text-[#1F1F23]" : "text-[#1F1F23]"
                } active:bg-[#F0F0F3]`}
              >
                {addrLine(a)}
              </button>
            ))
          )}
          <LocalizedClientLink
            href="/user/addresses"
            className="block px-3 py-3.5 text-[15px] font-medium text-[#2563EB]"
          >
            Manage addresses
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

/* ---------- C. payment methods card ---------- */
const MobilePaymentCard = ({ cart, paymentMethods }: { cart: any; paymentMethods: any }) => {
  const [toast, setToast] = useState<string | null>(null)
  const { session, select, busy, isSelected, selectError } = usePaymentSelect(cart)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  useEffect(() => {
    getWalletStatement()
      .then((s) => setWalletBalance(s?.balance ?? null))
      .catch(() => setWalletBalance(null))
  }, [])
  const providers = paymentMethods ?? []
  const showToast = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(null), 3000)
  }

  const tileCls = (selected: boolean) =>
    `shrink-0 h-[90px] rounded-3xl p-3 flex flex-col justify-between text-left transition-colors snap-start ${
      selected ? "bg-[#EFF6FF] border-[1.5px] border-[#2563EB]" : "bg-[#F0F0F3]"
    }`

  return (
    <section id="mb-payments" className="bg-white rounded-[28px] pt-3 pb-[17px]">
      <h2 className="px-4 text-[20px] font-semibold text-[#1F1F23] leading-7" style={{ fontFamily: WB_FONT }}>
        Payment methods
      </h2>
      <div className="mt-3.5 flex gap-[9px] overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none", scrollSnapType: "x proximity" }}>
        {/* Hybreed Wallet - closed-loop balance, debits at order capture */}
        <button
          disabled={!!busy}
          onClick={() => select(WALLET_PROVIDER_ID)}
          className={`${tileCls(isSelected(WALLET_PROVIDER_ID))} w-[160px]`}
        >
          <span className="w-[34px] h-[26px] rounded-lg bg-[#2563EB] flex items-center justify-center">
            <WalletGlyph />
          </span>
          <span>
            <span className="block text-[17px] font-medium text-[#1F1F23] leading-tight">Hybreed Wallet</span>
            <span className="block text-[15px] text-[#6B6B76]">
              {walletBalance != null
                ? `${Math.round(walletBalance).toLocaleString("en-US").replace(/,/g, " ")} XAF`
                : "Top up & pay"}
            </span>
          </span>
        </button>
        {providers.map((p: any) => {
          const info = paymentInfoMap[p.id]
          if (p.id.includes("notchpay")) {
            return (["cm.mtn", "cm.orange"] as const).map((channel) => {
              const busyKey = `${p.id}:${channel}`
              return (
                <button
                  key={busyKey}
                  disabled={!!busy}
                  onClick={() => select(p.id, channel)}
                  className={`${tileCls(isSelected(p.id, channel))} w-[140px]`}
                >
                  <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={channel === "cm.mtn" ? "/images/payments/mtn-momo.png" : "/images/payments/orange-money.png"}
                      alt={channel === "cm.mtn" ? "MTN MoMo" : "Orange Money"}
                      className="h-6 w-auto object-contain"
                    />
                    {busy === busyKey && <span className="text-[11px] text-[#6B6B76]">…</span>}
                  </span>
                  <span>
                    <span className="block text-[17px] font-medium text-[#1F1F23] leading-tight">
                      {channel === "cm.mtn" ? "MTN MoMo" : "Orange Money"}
                    </span>
                    <span className="block text-[15px] text-[#6B6B76]">Mobile Money</span>
                  </span>
                </button>
              )
            })
          }
          return (
            <button
              key={p.id}
              disabled={!!busy}
              onClick={() => select(p.id)}
              className={`${tileCls(isSelected(p.id))} w-[140px]`}
            >
              <span className="w-7 h-7 rounded-lg bg-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                {info?.icon ?? <Cash className="w-4 h-4" />}
              </span>
              <span>
                <span className="block text-[17px] font-medium text-[#1F1F23] leading-tight">
                  {info?.title || p.id}
                </span>
                <span className="block text-[15px] text-[#6B6B76]">Manual payment</span>
              </span>
            </button>
          )
        })}
        <button
          onClick={() => showToast("Card payments are coming soon")}
          className="shrink-0 w-[128px] h-[90px] rounded-3xl p-3 flex flex-col justify-between text-left border-[1.5px] border-dashed border-[#6B6B76]/50 text-[#6B6B76] snap-start"
        >
          <span className="text-[#6B6B76]"><CardPlusIcon /></span>
          <span className="text-[17px] font-medium leading-tight">Link a card or number</span>
        </button>
        {toast && (
          <span className="shrink-0 self-center text-[13px] text-[#B91C1C] bg-[#FEE2E2] px-3 py-1.5 rounded-full">
            {toast}
          </span>
        )}
      </div>
      {selectError && <p className="mt-2 px-4 text-[13px] text-[#B91C1C]">{selectError}</p>}
      {session && (
        <div className="mx-4 mt-3 rounded-2xl bg-[#F0F0F3] px-3.5 py-3 text-sm leading-[19px] text-[#3A3A44]">
          You&apos;ll pay the full amount of{" "}
          {convertToLocale({ amount: cart?.total ?? 0, currency_code: (cart?.region?.currency_code ?? "XAF").toUpperCase() })} now.
        </div>
      )}
    </section>
  )
}

/* ---------- D. promo codes card + sheet ---------- */
const PromoCard = ({ cart, currencyCode }: { cart: any; currencyCode: string }) => {
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
      else {
        setCode("")
        setOpen(false)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-14 bg-white rounded-[28px] px-4 flex items-center gap-3.5 active:scale-[0.98]"
      >
        <span className="text-[#1F1F23]"><TicketIcon /></span>
        <span className="flex-1 text-left text-[20px] font-medium text-[#1F1F23]">Promo codes</span>
        {applied ? (
          <span className="text-[15px] font-medium text-[#16A34A]">
            {applied.code} · applied
          </span>
        ) : (
          <span className="text-[#6B6B76]"><ChevronRight s={20} /></span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] p-4 pb-[max(20px,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[18px] font-semibold text-[#1F1F23]">Promo code</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="w-9 h-9 flex items-center justify-center text-[#6B6B76]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {applied ? (
              <div className="flex items-center justify-between rounded-2xl bg-[#F0F0F3] px-4 py-3.5">
                <p className="text-[16px] font-medium text-[#1F1F23]">
                  {applied.code} <span className="text-[#16A34A]">· applied</span>
                </p>
                <button
                  aria-label="Remove promo code"
                  onClick={async () => { await deletePromotionCode(applied.id) }}
                  className="w-9 h-9 flex items-center justify-center text-[#6B6B76]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && apply()}
                    placeholder="Enter code"
                    className="flex-1 h-11 rounded-full bg-[#F0F0F3] px-4 text-[16px] text-[#1F1F23] outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                  />
                  <button
                    onClick={apply}
                    disabled={busy || !code.trim()}
                    className="h-11 px-5 rounded-full bg-[#2563EB] text-white text-[16px] font-semibold disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                {error && <p className="text-[13px] text-[#DC2626] mt-2">{error}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ---------- F. totals block ---------- */
const TotalsBlock = ({ cart, currencyCode }: { cart: any; currencyCode: string }) => {
  const fmt = (n: number) => convertToLocale({ amount: n, currency_code: currencyCode })
  const qty = (cart?.items ?? []).reduce((a: number, i: any) => a + (i.quantity ?? 1), 0)
  const discount = Number(cart?.discount_total ?? 0)
  const shipping = Number(cart?.shipping_total ?? 0)
  const items = Number(cart?.item_subtotal ?? cart?.total ?? 0)
  const total = Number(cart?.total ?? 0)
  const row = "flex items-center justify-between h-[26px] text-[17px]"
  return (
    <div className="mt-2 px-4 pt-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[20px] font-semibold text-[#1F1F23]" style={{ fontFamily: WB_FONT }}>Total</span>
        <span className="text-[20px] font-semibold text-[#1F1F23]" style={{ fontFamily: WB_FONT }}>
          {fmt(total)}
        </span>
      </div>
      <div className="mt-3 flex flex-col">
        <div className={row}>
          <span className="text-[#6B6B76]">{qty} {qty === 1 ? "item" : "items"}</span>
          <span className="text-[#1F1F23] opacity-85">{fmt(items)}</span>
        </div>
        {discount > 0 && (
          <div className={row}>
            <span className="text-[#6B6B76]">Discounts</span>
            <span className="text-[#1F1F23] opacity-85">−{fmt(discount)}</span>
          </div>
        )}
        <div className={row}>
          <span className="text-[#6B6B76]">Delivery</span>
          <span className={shipping === 0 ? "text-[#16A34A]" : "text-[#1F1F23] opacity-85"}>
            {shipping === 0 ? "0 " + currencyCode : fmt(shipping)}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---------- G. consents ---------- */
const Consents = ({
  agreedTerms,
  setAgreedTerms,
  agreedMarketing,
  setAgreedMarketing,
  termsInvalid,
  marketingInvalid,
}: {
  agreedTerms: boolean
  setAgreedTerms: (v: boolean) => void
  agreedMarketing: boolean
  setAgreedMarketing: (v: boolean) => void
  termsInvalid: boolean
  marketingInvalid: boolean
}) => (
  <div className="mt-4 px-4 flex flex-col gap-3.5">
    <WbCheckbox
      checked={agreedTerms}
      onChange={setAgreedTerms}
      invalid={termsInvalid}
      label={
        <>
          I agree to the Hybreed{" "}
          <span className="text-[#2563EB]">Terms of Use</span> and the{" "}
          <LocalizedClientLink href="/user/returns" className="text-[#2563EB]">return rules</LocalizedClientLink>
        </>
      }
    />
    {termsInvalid && <p className="text-[13px] text-[#DC2626] -mt-2 ml-9">Please accept to continue</p>}
    <div>
      <WbCheckbox
        checked={agreedMarketing}
        onChange={setAgreedMarketing}
        invalid={marketingInvalid}
        label="I agree to receive useful offers about discounts, products and collections"
      />
      <p className="text-[13px] text-[#6B6B76] ml-9 -mt-1">How it works ›</p>
    </div>
  </div>
)

/* ---------- H. fixed footer ---------- */
const MobileFooter = ({
  cart,
  currencyCode,
  mode,
  onSelectAddress,
  onChoosePayment,
  onPlaceOrder,
  submitting,
  gate,
}: {
  cart: any
  currencyCode: string
  mode: "pickup" | "courier"
  onSelectAddress: () => void
  onChoosePayment: () => void
  onPlaceOrder: () => void
  submitting: boolean
  gate: boolean
}) => {
  const hasAddress = !!cart?.shipping_address
  const hasPayment = !!pendingSession(cart)
  const ready = gate
  const label = !hasAddress
    ? mode === "pickup" ? "Select Pickup Point" : "Select Delivery Address"
    : !hasPayment
      ? "Choose a payment method"
      : "Place Order"
  const total = convertToLocale({ amount: cart?.total ?? 0, currency_code: currencyCode })

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[45] bg-white rounded-t-[28px] pt-4 px-2"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <button
        onClick={ready ? onPlaceOrder : !hasAddress ? onSelectAddress : onChoosePayment}
        disabled={submitting}
        className={`w-full h-[52px] rounded-[26px] px-5 flex items-center text-white transition-all active:scale-[0.99] ${
          submitting ? "bg-[#2563EB] opacity-70" : "bg-[#2563EB]"
        }`}
      >
        {submitting ? (
          <span className="w-full flex items-center justify-center gap-2 text-[20px] font-semibold">
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
              <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            Placing order…
          </span>
        ) : ready ? (
          <>
            <span className="text-[20px] font-semibold" style={{ fontFamily: WB_FONT }}>Place Order</span>
            <span className="ml-auto flex items-center gap-1.5 text-[20px] font-semibold" style={{ fontFamily: WB_FONT }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2" /><path d="M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
              </svg>
              {total}
            </span>
          </>
        ) : (
          <span className="w-full text-center text-[20px] font-semibold" style={{ fontFamily: WB_FONT }}>{label}</span>
        )}
      </button>
    </div>
  )
}

/* ---------- page client ---------- */
export const MobileCheckoutClient = ({
  cart,
  customer,
  shippingMethods,
  paymentMethods,
  currencyCode,
  locale,
}: {
  cart: any
  customer: any
  shippingMethods: any
  paymentMethods: any
  currencyCode: string
  locale: string
}) => {
  const router = useRouter()
  const [mode, setMode] = useState<"pickup" | "courier">("courier")
  const [addrOpen, setAddrOpen] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(true)
  const [agreedMarketing, setAgreedMarketing] = useState(false)
  const [termsInvalid, setTermsInvalid] = useState(false)
  const [marketingInvalid, setMarketingInvalid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const termsRef = useRef<HTMLDivElement>(null)

  const qty = (cart?.items ?? []).reduce((a: number, i: any) => a + (i.quantity ?? 1), 0)
  const gate = stepGate(cart)

  // desktop → overlay on the cart page
  useEffect(() => {
    if (window.innerWidth >= 768) {
      router.replace(`/${locale}/cart?checkout=1`)
    }
  }, [router, locale])

  // Buy Now / old links land on /checkout?step=address - open the sheet
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("step") === "address") {
      setAddrOpen(true)
    }
  }, [])

  const scrollTo = (el: HTMLElement | null) =>
    el?.scrollIntoView({ behavior: "smooth", block: "center" })

  const onSelectAddress = () => {
    setAddrOpen(true)
    scrollTo(document.getElementById("mb-delivery"))
  }
  const onChoosePayment = () => scrollTo(document.getElementById("mb-payments"))

  const onPlaceOrder = async () => {
    setSubmitError(null)
    setTermsInvalid(false)
    setMarketingInvalid(false)
    // required consents - marketing is optional, so it never blocks
    if (!agreedTerms) {
      setTermsInvalid(true)
      scrollTo(termsRef.current)
      return
    }
    if (!gate) {
      setSubmitError("Complete the delivery and payment steps above")
      scrollTo(document.getElementById("mb-delivery"))
      return
    }
    setSubmitting(true)
    const res = await submitOrder(cart)
    if (!res.ok) {
      setSubmitError(res.error || "Payment failed")
      setSubmitting(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    // on success submitOrder navigates away
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <MobileHeader qty={qty} total={cart?.total ?? 0} currencyCode={currencyCode} />

      {submitError && (
        <div className="mx-2 mt-2 rounded-2xl bg-[#FEE2E2] text-[#B91C1C] text-sm px-3.5 py-2.5">
          {submitError}
        </div>
      )}

      <main className="flex flex-col gap-2 px-2 pt-2 pb-[150px]">
        <PaymentWrapper cart={cart}>
          <Suspense fallback={null}>
          <DeliveryCard
            cart={cart}
            customer={customer}
            shippingMethods={shippingMethods}
            currencyCode={currencyCode}
            mode={mode}
            setMode={setMode}
            addrOpen={addrOpen}
            setAddrOpen={setAddrOpen}
          />
          <MobilePaymentCard cart={cart} paymentMethods={paymentMethods} />
          <PromoCard cart={cart} currencyCode={currencyCode} />
          </Suspense>
        </PaymentWrapper>

        {/* Hybreed+ membership card - hidden, no membership product exists */}

        <TotalsBlock cart={cart} currencyCode={currencyCode} />

        <div ref={termsRef} className="scroll-mt-20">
          <Consents
            agreedTerms={agreedTerms}
            setAgreedTerms={setAgreedTerms}
            agreedMarketing={agreedMarketing}
            setAgreedMarketing={setAgreedMarketing}
            termsInvalid={termsInvalid}
            marketingInvalid={marketingInvalid}
          />
        </div>
      </main>

      <MobileFooter
        cart={cart}
        currencyCode={currencyCode}
        mode={mode}
        onSelectAddress={onSelectAddress}
        onChoosePayment={onChoosePayment}
        onPlaceOrder={onPlaceOrder}
        submitting={submitting}
        gate={gate}
      />

      <AddressSheet open={addrOpen} onClose={() => setAddrOpen(false)} customer={customer} cart={cart} />
    </div>
  )
}
