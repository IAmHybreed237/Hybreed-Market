"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { updateLineItem, deleteLineItem, addToCart } from "@/lib/data/cart"

/* ---------- icons ---------- */
const I = ({ d, s = 24, sw = 1.75 }: { d: string; s?: number; sw?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
)
const ChevronDown = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9" /></svg>
)
const WalletMini = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2" /><path d="M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" /></svg>
)
const CheckIcon = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
)
const icons = {
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6",
  dotsV: "M12 5h.01M12 12h.01M12 19h.01",
  minus: "M5 12h14",
  plus: "M12 5v14M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
  wallet: "M20 7H4a2 2 0 0 1 0-4h13a2 2 0 0 1 2 2v2M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2",
  cart: "M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6",
}

const fmt = (n: number, cur: string) =>
  `${Math.round(n).toLocaleString("en-US").replace(/,/g, " ")} ${cur}`

type Item = {
  id: string
  quantity: number
  unit_price?: number
  total?: number
  thumbnail?: string
  title?: string
  product?: { title?: string; handle?: string }
  variant?: { title?: string; options?: { value?: string }[] }
  offer?: { seller?: { name?: string; id?: string } }
}

export const CartClient = ({
  cart,
  locale,
  addresses,
  currencyCode = "XAF",
}: {
  cart: { items?: Item[] } | null
  locale: string
  addresses: { id: string; address_1?: string; city?: string }[]
  currencyCode?: string
}) => {
  const router = useRouter()
  const items = useMemo(() => cart?.items || [], [cart])
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.map((i) => i.id))
  )
  const [qty, setQty] = useState<Record<string, number>>({})
  const [removing, setRemoving] = useState<Set<string>>(new Set())
  const [kebab, setKebab] = useState<Item | null>(null)
  const [confirmDel, setConfirmDel] = useState<"one" | "all" | null>(null)
  const [addrSheet, setAddrSheet] = useState(false)
  const [addr, setAddr] = useState<{ address_1?: string; city?: string } | null>(
    addresses[0] || null
  )
  const [toast, setToast] = useState<string | null>(null)
  const [undoItem, setUndoItem] = useState<Item | null>(null)
  const [pending, startTransition] = useTransition()

  const qtyOf = (i: Item) => qty[i.id] ?? i.quantity
  const selItems = items.filter((i) => selected.has(i.id) && !removing.has(i.id))
  const totalQty = selItems.reduce((a, i) => a + qtyOf(i), 0)
  const totalPrice = selItems.reduce(
    (a, i) => a + (i.unit_price ?? 0) * qtyOf(i),
    0
  )
  const allSelected =
    items.length > 0 && selItems.length === items.length - removing.size
  const someSelected = selItems.length > 0 && !allSelected

  const showToast = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(null), 5000)
  }

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const setQ = (i: Item, q: number) => {
    if (q < 1) return
    setQty((m) => ({ ...m, [i.id]: q }))
    startTransition(async () => {
      try {
        await updateLineItem({ lineId: i.id, quantity: q })
      } catch {
        setQty((m) => ({ ...m, [i.id]: i.quantity }))
        showToast("Couldn't update your cart")
      }
    })
  }

  const removeItem = (i: Item) => {
    setRemoving((s) => new Set(s).add(i.id))
    setUndoItem(i)
    showToast("Item removed")
    setTimeout(() => {
      startTransition(async () => {
        try {
          await deleteLineItem(i.id)
        } catch {}
      })
    }, 200)
  }

  const undo = () => {
    if (!undoItem) return
    setRemoving((s) => {
      const n = new Set(s)
      n.delete(undoItem.id)
      return n
    })
    setUndoItem(null)
    setToast(null)
    startTransition(async () => {
      try {
        await addToCart({
          variantId: (undoItem as any).variant_id || (undoItem as any).variant?.id,
          quantity: undoItem.quantity,
        } as any)
      } catch {}
    })
  }

  const variantOf = (i: Item) =>
    i.variant?.options?.map((o) => o?.value).filter(Boolean).join(", ") ||
    i.variant?.title ||
    ""

  const Checkbox = ({
    checked,
    indet,
    onToggle,
    size = 24,
    overlay = false,
    disabled = false,
    label,
  }: {
    checked: boolean
    indet?: boolean
    onToggle: () => void
    size?: number
    overlay?: boolean
    disabled?: boolean
    label: string
  }) => (
    <button
      role="checkbox"
      aria-checked={indet ? "mixed" : checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      className={`flex items-center justify-center shrink-0 ${
        overlay ? "w-11 h-11 -m-2.5" : "w-11 h-11 -m-2.5 md:m-0"
      }`}
    >
      <span
        className="flex items-center justify-center rounded-lg border-2"
        style={{
          width: size,
          height: size,
          borderColor: checked || indet ? "#2563EB" : overlay ? "rgba(0,0,0,0.25)" : "#D4D4DB",
          background: checked || indet ? "#2563EB" : "#fff",
        }}
      >
        {indet ? (
          <span className="w-2.5 h-0.5 bg-white rounded-full" />
        ) : checked ? (
          <CheckIcon />
        ) : null}
      </span>
    </button>
  )

  const Stepper = ({ item, small = false }: { item: Item; small?: boolean }) => {
    const q = qtyOf(item)
    return (
      <div
        className={`flex items-center justify-between rounded-full bg-[#F0F0F3] ${
          small ? "w-[125px] h-9 rounded-xl px-2.5" : "w-[112px] h-11 px-3"
        }`}
      >
        <button
          aria-label="Decrease quantity"
          disabled={q <= 1 || pending}
          onClick={() => setQ(item, q - 1)}
          className="w-11 md:w-8 h-full flex items-center justify-center text-[#8A8A96] disabled:opacity-40"
        >
          <I d={icons.minus} s={small ? 18 : 28} sw={2} />
        </button>
        <span className={`font-medium text-[#1F1F23] ${small ? "text-[15px]" : "text-xl"}`}>
          {q}
        </span>
        <button
          aria-label="Increase quantity"
          disabled={pending}
          onClick={() => setQ(item, q + 1)}
          className="w-11 md:w-8 h-full flex items-center justify-center text-[#2563EB] disabled:opacity-40"
        >
          <I d={icons.plus} s={small ? 18 : 28} sw={2} />
        </button>
      </div>
    )
  }

  const Sheet = ({
    open,
    onClose,
    children,
  }: {
    open: boolean
    onClose: () => void
    children: React.ReactNode
  }) =>
    open ? (
      <>
        <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} />
        <div
          className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[420px] md:rounded-3xl bg-white z-[70] rounded-t-[24px] p-4 pb-8"
          style={{ animation: "cartUp .25s ease-out" }}
        >
          <style>{`@keyframes cartUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
          {children}
        </div>
      </>
    ) : null

  const itemCardMobile = (i: Item) => {
    const gone = removing.has(i.id)
    return (
      <div
        key={i.id}
        className="bg-white rounded-[28px] p-4 flex gap-3 transition-all duration-200 overflow-hidden"
        style={{
          maxHeight: gone ? 0 : 400,
          paddingTop: gone ? 0 : undefined,
          paddingBottom: gone ? 0 : undefined,
          opacity: gone ? 0 : 1,
        }}
      >
        {/* image + checkbox */}
        <div className="relative w-[99px] shrink-0">
          <div className="w-[99px] h-[132px] rounded-2xl bg-[#F0F0F3] overflow-hidden">
            {i.thumbnail && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={i.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
            )}
          </div>
          <span className="absolute top-1 left-1">
            <Checkbox
              checked={selected.has(i.id)}
              onToggle={() => toggleOne(i.id)}
              size={22}
              overlay
              label={`Select ${i.product?.title || "item"}`}
            />
          </span>
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-baseline gap-1.5">
              <WalletMini />
              <span className="text-[22px] font-semibold text-[#1F1F23]">
                {fmt((i.unit_price ?? 0) * qtyOf(i), currencyCode)}
              </span>
            </div>
            <button
              aria-label="Item options"
              onClick={() => setKebab(i)}
              className="w-11 h-11 -mt-1 -mr-2 flex items-center justify-center text-[#8A8A96]"
            >
              <I d={icons.dotsV} s={20} />
            </button>
          </div>
          <p className="text-lg text-[#1F1F23] truncate mt-1">
            {i.product?.title || i.title}
          </p>
          {variantOf(i) && (
            <p className="text-lg text-[#1F1F23]/80 truncate">{variantOf(i)}</p>
          )}
          <p className="text-[19px] font-semibold text-[#1F1F23] mt-2.5">
            Delivery: tomorrow
          </p>
          {/* action row */}
          <div className="flex gap-2 mt-3 h-11">
            <Stepper item={i} />
            <LocalizedClientLink
              href="/checkout?step=address"
              className="w-[112px] h-11 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xl font-semibold flex items-center justify-center active:scale-[0.98]"
            >
              Buy Now
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    )
  }

  const itemRowDesktop = (i: Item) => {
    const gone = removing.has(i.id)
    return (
      <div
        key={i.id}
        className="flex gap-[15px] transition-all duration-200 overflow-hidden"
        style={{ maxHeight: gone ? 0 : 250, opacity: gone ? 0 : 1 }}
      >
        <div className="relative w-[102px] shrink-0">
          <div className="w-[102px] h-[136px] rounded-[10px] bg-[#F0F0F3] overflow-hidden">
            {i.thumbnail && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={i.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
            )}
          </div>
          <span className="absolute top-1 left-1">
            <Checkbox
              checked={selected.has(i.id)}
              onToggle={() => toggleOne(i.id)}
              size={20}
              overlay
              label={`Select ${i.product?.title || "item"}`}
            />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#8A8A96] line-clamp-2">
            {i.product?.title || i.title}
          </p>
          {variantOf(i) && (
            <p className="text-sm text-[#8A8A96] truncate mt-0.5">{variantOf(i)}</p>
          )}
          <p className="text-sm font-semibold text-[#1F1F23] mt-2">
            Tomorrow <span className="font-normal text-[#16A34A] ml-1.5">Free return</span>
          </p>
          <div className="flex gap-2 mt-2.5 h-9 items-center">
            <Stepper item={i} small />
            <LocalizedClientLink
              href="/checkout?step=address"
              className="w-[178px] h-9 rounded-xl bg-[#F4F4F6] text-[#2563EB] text-sm font-medium flex items-center justify-center hover:bg-[#ECECF0]"
            >
              Buy Now
            </LocalizedClientLink>
            <button aria-label="Add to favorites" className="w-9 h-9 flex items-center justify-center text-[#8A8A96] hover:text-[#1F1F23]">
              <I d={icons.heart} s={18} />
            </button>
            <button aria-label="Share item" className="w-9 h-9 flex items-center justify-center text-[#8A8A96] hover:text-[#1F1F23]">
              <I d={icons.share} s={18} />
            </button>
            <button aria-label="Remove item" onClick={() => removeItem(i)} className="w-9 h-9 flex items-center justify-center text-[#8A8A96] hover:text-[#1F1F23]">
              <I d={icons.trash} s={18} />
            </button>
          </div>
        </div>

        <div className="w-[180px] shrink-0 pr-6 text-right">
          <div className="flex items-baseline gap-1.5 justify-end">
            <WalletMini />
            <span className="text-base font-semibold text-[#1F1F23]">
              {fmt((i.unit_price ?? 0) * qtyOf(i), currencyCode)}
            </span>
          </div>
          {qtyOf(i) > 1 && (
            <p className="text-xs text-[#8A8A96] mt-1">
              {fmt(i.unit_price ?? 0, currencyCode)} each
            </p>
          )}
        </div>
      </div>
    )
  }

  const visible = items.filter((i) => !removing.has(i.id))
  const empty = visible.length === 0

  const EmptyState = () => (
    <div className="bg-white md:rounded-3xl md:max-w-[560px] md:mx-auto rounded-b-[20px] py-16 px-6 flex flex-col items-center text-center">
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={icons.cart} />
      </svg>
      <p className="text-[22px] font-semibold text-[#1F1F23] mt-4">Your cart is empty</p>
      <p className="text-[15px] text-[#8A8A96] mt-2">Add something you like</p>
      <LocalizedClientLink
        href="/"
        className="mt-6 h-12 px-7 rounded-full bg-[#2563EB] text-white font-semibold flex items-center"
      >
        Start shopping
      </LocalizedClientLink>
    </div>
  )

  return (
    <div
      className="w-full min-h-screen md:min-h-0"
      style={
        {
          "--page-bg": "#F5F5F7",
          "--card": "#FFFFFF",
          "--chip": "#F0F0F3",
          "--text": "#1F1F23",
          "--muted": "#8A8A96",
          "--brand": "#2563EB",
          "--brand-tint": "#DBEAFE",
          "--cta": "#2563EB",
          background: "var(--page-bg)",
          margin: "0 -5px",
        } as React.CSSProperties
      }
    >
      {/* ================= MOBILE ================= */}
      <div className="md:hidden pb-[220px]">
        {/* A. header block */}
        <div className="bg-white rounded-b-[20px]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <button
            onClick={() => setAddrSheet(true)}
            className="w-full h-11 px-4 flex items-center gap-1.5"
          >
            <span className="text-lg text-[#1F1F23] truncate max-w-[80%]">
              {addr ? `${addr.address_1 || ""}${addr.city ? `, ${addr.city}` : ""}`.trim() || "Select address" : "Select address"}
            </span>
            <span className="text-[#8A8A96]"><ChevronDown /></span>
          </button>
          {!empty && (
            <div className="h-14 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  indet={someSelected}
                  onToggle={toggleAll}
                  label="Select all items"
                />
                <span className="text-xl text-[#1F1F23]">All</span>
              </div>
              <div className="flex items-center" style={{ gap: 34 }}>
                <button aria-label="Add selected to favorites" className="w-11 h-11 flex items-center justify-center text-[#6B6B76]"><I d={icons.heart} s={28} /></button>
                <button aria-label="Share selected items" className="w-11 h-11 flex items-center justify-center text-[#6B6B76]"><I d={icons.share} s={28} /></button>
                <button aria-label="Remove selected items" onClick={() => setConfirmDel("all")} className="w-11 h-11 flex items-center justify-center text-[#6B6B76]"><I d={icons.trash} s={28} /></button>
              </div>
            </div>
          )}
        </div>

        {/* C. items */}
        {empty ? (
          <div className="mt-[3px]"><EmptyState /></div>
        ) : (
          <div className="flex flex-col gap-[3px] mt-[3px]">
            {items.map(itemCardMobile)}
          </div>
        )}

        {/* D. sticky checkout bar */}
        {!empty && (
          <div
            className="fixed left-0 right-0 z-40 bg-[#F5F5F7] rounded-t-[24px] p-2"
            style={{ bottom: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
          >
            <LocalizedClientLink
              href="/checkout?step=address"
              className={`w-full h-[52px] rounded-[26px] px-6 flex items-center justify-between ${
                totalQty === 0 ? "bg-[#F0F0F3] pointer-events-none" : "bg-[#2563EB]"
              }`}
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
            >
              <span className={`text-xl font-semibold ${totalQty === 0 ? "text-[#8A8A96]" : "text-white"}`}>
                {totalQty === 0 ? "Select items" : `To Checkout · ${totalQty}`}
              </span>
              <span className={`flex items-center gap-1.5 text-xl font-semibold ${totalQty === 0 ? "text-[#8A8A96]" : "text-white"}`}>
                <I d={icons.wallet} s={20} sw={2} />
                {fmt(totalPrice, currencyCode)}
              </span>
            </LocalizedClientLink>
          </div>
        )}
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden md:block max-w-[1290px] mx-auto px-[30px] py-6">
        {empty ? (
          <EmptyState />
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_342px] gap-4 items-start">
            {/* items card */}
            <div className="bg-white rounded-3xl px-4 pb-2">
              {/* sticky select-all */}
              <div className="h-[46px] sticky top-0 z-20 bg-white rounded-t-3xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Checkbox checked={allSelected} indet={someSelected} onToggle={toggleAll} size={20} label="Select all items" />
                  <span className="text-sm font-medium text-[#1F1F23]">All</span>
                </div>
                <div className="flex items-center gap-1">
                  <button aria-label="Add selected to favorites" className="w-[30px] h-[30px] rounded-full bg-[#F4F4F6] text-[#8A8A96] hover:bg-[#ECECF0] flex items-center justify-center"><I d={icons.heart} s={16} /></button>
                  <button aria-label="Share selected items" className="w-[30px] h-[30px] rounded-full bg-[#F4F4F6] text-[#8A8A96] hover:bg-[#ECECF0] flex items-center justify-center"><I d={icons.share} s={16} /></button>
                  <button aria-label="Remove selected items" onClick={() => setConfirmDel("all")} className="w-[30px] h-[30px] rounded-full bg-[#F4F4F6] text-[#8A8A96] hover:bg-[#ECECF0] flex items-center justify-center"><I d={icons.trash} s={16} /></button>
                </div>
              </div>
              <div className="flex flex-col gap-4 py-4">
                {items.map(itemRowDesktop)}
              </div>
            </div>

            {/* summary card */}
            <div className="bg-white rounded-3xl p-4 lg:sticky lg:top-4">
              <p className="text-base font-semibold text-[#1F1F23]">
                Total items in order: {totalQty}
              </p>
              {selItems.length > 0 && (
                <div className="flex gap-1 mt-3">
                  {selItems.slice(0, 5).map((i, idx) =>
                    idx === 4 && selItems.length > 5 ? (
                      <span key={i.id} className="w-[46px] h-[62px] rounded-[10px] bg-[#F4F4F6] text-sm font-medium text-[#8A8A96] flex items-center justify-center">
                        +{selItems.length - 4}
                      </span>
                    ) : (
                      <span key={i.id} className="w-[46px] h-[62px] rounded-[10px] bg-[#F0F0F3] overflow-hidden">
                        {i.thumbnail && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={i.thumbnail} alt="" className="w-full h-full object-cover" />
                        )}
                      </span>
                    )
                  )}
                </div>
              )}
              <LocalizedClientLink
                href="/checkout?step=address"
                className={`mt-3 w-full h-[49px] rounded-[25px] px-4 flex items-center justify-between ${
                  totalQty === 0 ? "bg-[#F4F4F6] pointer-events-none" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
                } transition-colors active:scale-[0.99]`}
              >
                <span className={`text-base font-semibold ${totalQty === 0 ? "text-[#8A8A96]" : "text-white"}`}>
                  {totalQty === 0 ? "Select items" : "Checkout"}
                </span>
                <span className={`flex items-center gap-1.5 text-base font-semibold ${totalQty === 0 ? "text-[#8A8A96]" : "text-white"}`}>
                  <I d={icons.wallet} s={16} sw={2} />
                  {fmt(totalPrice, currencyCode)}
                </span>
              </LocalizedClientLink>
            </div>
          </div>
        )}
      </div>

      {/* sheets */}
      <Sheet open={kebab !== null} onClose={() => setKebab(null)}>
        {kebab && (
          <ul>
            {[
              { label: "Add to favourites", icon: icons.heart },
              { label: "Share", icon: icons.share },
              { label: "Remove", icon: icons.trash, danger: true },
            ].map((a) => (
              <li key={a.label}>
                <button
                  onClick={() => {
                    if (a.label === "Remove") removeItem(kebab)
                    setKebab(null)
                  }}
                  className={`w-full flex items-center gap-3.5 h-14 text-[15px] ${a.danger ? "text-[#EF4444]" : "text-[#1F1F23]"}`}
                >
                  <span className={a.danger ? "text-[#EF4444]" : "text-[#6B6B76]"}><I d={a.icon} s={22} /></span>
                  {a.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      <Sheet open={confirmDel === "all"} onClose={() => setConfirmDel(null)}>
        <p className="text-lg font-semibold text-[#1F1F23] px-1 pt-1">Remove selected items?</p>
        <div className="flex gap-2 mt-5">
          <button onClick={() => setConfirmDel(null)} className="flex-1 h-12 rounded-2xl bg-[#F0F0F3] font-semibold text-[#1F1F23]">Cancel</button>
          <button
            onClick={() => {
              selItems.forEach(removeItem)
              setConfirmDel(null)
            }}
            className="flex-1 h-12 rounded-2xl bg-[#EF4444] text-white font-semibold"
          >
            Remove
          </button>
        </div>
      </Sheet>

      <Sheet open={addrSheet} onClose={() => setAddrSheet(false)}>
        <p className="text-lg font-semibold text-[#1F1F23] px-1 pt-1 mb-2">Delivery address</p>
        {addresses.length === 0 ? (
          <p className="text-[15px] text-[#8A8A96] px-1 py-3">No saved addresses yet</p>
        ) : (
          <ul>
            {addresses.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => {
                    setAddr(a)
                    setAddrSheet(false)
                  }}
                  className="w-full flex items-center gap-3.5 h-14 text-[15px] text-[#1F1F23]"
                >
                  <span className="truncate">{a.address_1}{a.city ? `, ${a.city}` : ""}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <LocalizedClientLink href="/user/addresses" className="mt-3 w-full h-12 rounded-2xl bg-[#DBEAFE] text-[#2563EB] font-semibold flex items-center justify-center">
          Manage addresses
        </LocalizedClientLink>
      </Sheet>

      {/* undo toast */}
      {toast && (
        <div className="fixed bottom-[210px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[80] bg-[#1F1F23] text-white rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-[15px]">{toast}</span>
          {undoItem && toast === "Item removed" && (
            <button onClick={undo} className="text-[#93C5FD] font-semibold text-[15px] ml-4 shrink-0">Undo</button>
          )}
        </div>
      )}
    </div>
  )
}
