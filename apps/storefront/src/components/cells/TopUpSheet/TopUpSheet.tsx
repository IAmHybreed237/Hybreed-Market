"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  METHODS,
  MTN_USSD,
  MTN_USSD_TEL,
  SHOW_NUMBER_ROW,
  STEPS,
  TOPUP_LIMIT,
  TOPUP_NAME,
  TOPUP_NUMBER,
  TOPUP_NUMBER_RAW,
  WHATSAPP_NUMBER,
} from "./topup.config"
import { requestWalletTopUp, uploadTopUpReceipt } from "@/lib/data/wallet"

const TopUpCtx = createContext<{ open: () => void; close: () => void }>({
  open: () => {},
  close: () => {},
})
export const useTopUpSheet = () => useContext(TopUpCtx)

const XIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
  </svg>
)
const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const CopyIcon = ({ done }: { done: boolean }) =>
  done ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="12" height="12" rx="3" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )

export const TopUpSheetProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [tuAmount, setTuAmount] = useState("")
  const [tuPhone, setTuPhone] = useState("")
  const [tuRef, setTuRef] = useState("")
  const [tuBusy, setTuBusy] = useState(false)
  const [tuError, setTuError] = useState<string | null>(null)
  const [flow, setFlow] = useState<"idle" | "mtn-amount" | "mtn-details">("idle")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ y: number; t: number } | null>(null)
  const [dragY, setDragY] = useState(0)
  const pushedRef = useRef(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const fn = () => setIsDesktop(mq.matches)
    fn()
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1600)
  }, [])

  const openSheet = useCallback(() => {
    if (typeof window === "undefined") return
    triggerRef.current = document.activeElement as HTMLElement
    setMounted(true)
    requestAnimationFrame(() => setOpen(true))
    history.pushState({ topupSheet: true }, "")
    pushedRef.current = true
  }, [])

  const closeSheet = useCallback(() => {
    setOpen(false)
    setDragY(0)
    setTimeout(() => setMounted(false), 300)
    if (pushedRef.current) {
      pushedRef.current = false
      history.back()
    }
  }, [])

  // popstate (browser back) closes
  useEffect(() => {
    const onPop = () => {
      pushedRef.current = false
      setOpen(false)
      setTimeout(() => setMounted(false), 300)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // esc, scroll lock, focus
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet()
      if (e.key === "Tab" && sheetRef.current) {
        const els = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
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
    const t = setTimeout(() => sheetRef.current?.focus(), 60)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      clearTimeout(t)
      triggerRef.current?.focus?.()
    }
  }, [open, closeSheet])

  const onTouchStart = (e: React.TouchEvent) => {
    dragRef.current = { y: e.touches[0].clientY, t: Date.now() }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return
    // Only allow drag-to-close when the sheet content is already at the top -
    // otherwise a downward swipe is just normal scrolling and must not close.
    if ((sheetRef.current?.scrollTop ?? 0) > 0) {
      dragRef.current = null
      setDragY(0)
      return
    }
    const dy = Math.max(0, e.touches[0].clientY - dragRef.current.y)
    setDragY(dy)
  }
  const onTouchEnd = () => {
    if (!dragRef.current) return
    const fast = Date.now() - dragRef.current.t < 250 && dragY > 30
    if (dragY > 90 || fast) closeSheet()
    else setDragY(0)
    dragRef.current = null
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(TOPUP_NUMBER_RAW)
      setCopied(true)
      showToast("Number copied")
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const tapMethod = (id: string, enabled: boolean, label: string) => {
    if (!enabled) {
      showToast("Coming soon")
      return
    }
    if (id === "mtn") {
      setTuError(null)
      setFlow("mtn-amount")
    }
  }

  const pickReceipt = (file: File | null) => {
    setReceiptFile(file)
    setReceiptPreview(file ? URL.createObjectURL(file) : null)
  }

  const openWhatsApp = (text: string) => {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank"
    )
  }

  const submitTopUp = async () => {
    const amount = Number(tuAmount.replace(/\s/g, ""))
    if (!Number.isFinite(amount) || amount <= 0) {
      setTuError("Enter a valid amount")
      return
    }
    if (tuPhone.replace(/\D/g, "").length < 8) {
      setTuError("Enter the MoMo number you sent from")
      return
    }
    setTuBusy(true)
    setTuError(null)

    let receiptUrl: string | undefined
    if (receiptFile) {
      const up = await uploadTopUpReceipt(receiptFile)
      if (!up.ok) {
        setTuBusy(false)
        setTuError(up.message || "Couldn't upload the receipt - try again")
        return
      }
      receiptUrl = up.url
    }

    const res = await requestWalletTopUp({
      amount,
      sender_phone: tuPhone.trim(),
      momo_reference: tuRef.trim() || undefined,
      receipt_url: receiptUrl,
    })
    setTuBusy(false)
    if (!res.ok) {
      setTuError(res.message || "Couldn't submit the request")
      return
    }

    const lines = [
      "Hybreed Wallet top-up request",
      `Amount: ${amount.toLocaleString("en-FR")} XAF`,
      `Sent from: ${tuPhone.trim()}`,
      tuRef.trim() ? `Reference: ${tuRef.trim()}` : null,
      receiptUrl ? `Receipt: ${receiptUrl}` : null,
    ].filter(Boolean)
    openWhatsApp(lines.join("\n"))

    showToast("Opening WhatsApp - tap send to finish")
    setTuAmount("")
    setTuPhone("")
    setTuRef("")
    setReceiptFile(null)
    setReceiptPreview(null)
    setFlow("idle")
    setTimeout(closeSheet, 1500)
  }

  return (
    <TopUpCtx.Provider value={{ open: openSheet, close: closeSheet }}>
      {children}
      {mounted && (
        <>
          {/* scrim */}
          <div
            aria-hidden
            onClick={closeSheet}
            className="fixed inset-0 z-[59]"
            style={{
              background: "rgba(0,0,0,0.6)",
              opacity: open ? 1 : 0,
              pointerEvents: open ? "auto" : "none",
              transition: "opacity .2s",
            }}
          />
          {/* sheet */}
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="topup-title"
            tabIndex={-1}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="fixed left-0 right-0 bottom-0 z-[60] bg-[#F5F5F7] rounded-t-[28px] max-h-[92dvh] overflow-y-auto outline-none md:inset-0 md:m-auto md:h-fit md:w-[560px] md:rounded-[28px] md:max-h-[85vh]"
            style={{
              overscrollBehavior: "contain",
              transform: isDesktop
                ? `scale(${open ? 1 : 0.94})`
                : `translateY(${open ? dragY : 100}%)`,
              opacity: isDesktop ? (open ? 1 : 0) : 1,
              transition: dragY
                ? "none"
                : "transform .28s ease-out, opacity .2s ease-out",
            }}
          >
            {/* drag handle - floats above the sheet edge */}
            <div
              aria-hidden
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-9 h-[5px] rounded-[3px] md:hidden"
              style={{ background: "rgba(255,255,255,0.35)" }}
            />

            {/* CARD 1 */}
            <div className="bg-white rounded-[28px] px-4 pt-3 pb-4">
              <div className="h-7 flex items-center justify-between">
                <h2
                  id="topup-title"
                  className="text-[22px] min-[380px]:text-[24px] font-semibold text-[#1F1F23] whitespace-nowrap"
                >
                  How to top up Hybreed Wallet
                </h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeSheet}
                  className="w-11 h-11 -mr-3 flex items-center justify-center text-[#8A8A96]"
                >
                  <XIcon />
                </button>
              </div>

              {/* upgrade banner */}
              <button
                type="button"
                onClick={() => showToast("Coming soon")}
                className="mt-[17px] w-full h-[88px] rounded-[24px] bg-[#F0F0F3] px-4 flex items-center gap-5 text-left transition-transform duration-100 active:scale-[0.98]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/wallet/wallet.png"
                  alt=""
                  aria-hidden
                  width={48}
                  height={48}
                  className="shrink-0 object-contain"
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-[18px] font-semibold text-[#1F1F23] leading-tight">
                    Enjoy easier top-up
                  </span>
                  <span className="block mt-0.5 text-[15px] leading-[17px] text-[#8A8A96] line-clamp-2">
                    Upgrade your Hybreed Wallet to top it up directly in the
                    app
                  </span>
                </span>
                <span className="text-[#8A8A96] shrink-0">
                  <Chevron />
                </span>
              </button>

              {/* numbered steps */}
              <div className="mt-5 flex flex-col gap-[26px]">
                {STEPS.map((s, i) => (
                  <div key={i} className="flex gap-[17px]">
                    <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-[16px] font-medium flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-[17px] leading-[20px] text-[#1F1F23]">
                      {s}
                    </p>
                  </div>
                ))}
              </div>

              {/* number row */}
              {SHOW_NUMBER_ROW && (
                <div className="mt-[22px] pl-[41px] flex items-center gap-x-6 gap-y-1.5 flex-wrap">
                  <span className="text-[18px] font-medium text-[#1F1F23] flex items-center gap-1.5">
                    {TOPUP_NUMBER}
                    <button
                      type="button"
                      aria-label="Copy number"
                      onClick={copyNumber}
                      className="w-11 h-11 flex items-center justify-center text-[#1F1F23]"
                    >
                      <CopyIcon done={copied} />
                    </button>
                  </span>
                  <span className="text-[18px] font-medium text-[#1F1F23]">
                    {TOPUP_LIMIT}
                  </span>
                </div>
              )}
            </div>

            {/* CARD 2 */}
            <div
              className="mt-1 bg-white rounded-[28px] pt-3"
              style={{
                paddingBottom: "calc(16px + env(safe-area-inset-bottom,0px))",
              }}
            >
              <h3 className="px-4 h-7 text-[24px] font-semibold text-[#1F1F23]">
                Payment method
              </h3>
              <div
                className="mt-[17px] flex gap-1.5 px-4 overflow-x-auto scroll-px-4 scrollbar-hide"
                style={{ scrollSnapType: "x proximity" }}
              >
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => tapMethod(m.id, m.enabled, m.label)}
                    className="relative w-[90px] h-[84px] shrink-0 rounded-[24px] p-3 flex flex-col justify-between text-left snap-start transition-transform duration-100 active:scale-[0.96]"
                    style={{ background: m.tileLight }}
                  >
                    {m.logoImg ? (
                      <span className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.logoImg}
                          alt=""
                          aria-hidden
                          draggable={false}
                          className="w-full h-full object-contain"
                        />
                      </span>
                    ) : (
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold"
                        style={{ background: m.logoBg, color: m.logoTextColor }}
                      >
                        {m.logoText}
                      </span>
                    )}
                    {m.badge && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-semibold bg-black/10 text-[#8A8A96] px-1.5 py-0.5 rounded-full">
                        {m.badge}
                      </span>
                    )}
                    <span className="text-[16px] font-medium leading-[17px] text-[#1F1F23] line-clamp-2">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* CARD 3 - MTN MoMo top-up flow */}
            <div
              className="mt-1 bg-white rounded-[28px] p-4"
              style={{
                paddingBottom: "calc(16px + env(safe-area-inset-bottom,0px))",
              }}
            >
              {flow === "idle" && (
                <>
                  <h3 className="text-[20px] font-semibold text-[#1F1F23]">
                    Top up with Mobile Money
                  </h3>
                  <p className="mt-1 text-[14px] leading-snug text-[#8A8A96]">
                    Select MTN MoMo above to start. Send the money to{" "}
                    {TOPUP_NUMBER} ({TOPUP_NAME}), then send us the details -
                    your balance is credited once we confirm the transfer.
                  </p>
                </>
              )}

              {flow === "mtn-amount" && (
                <>
                  <h3 className="text-[20px] font-semibold text-[#1F1F23]">
                    1. Enter amount
                  </h3>
                  <div className="mt-4 flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[14px] font-medium text-[#1F1F23]">
                        Amount (XAF)
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tuAmount}
                        onChange={(e) => setTuAmount(e.target.value)}
                        placeholder="e.g. 20 000"
                        className="h-12 px-4 rounded-2xl bg-[#F0F0F3] text-[16px] text-[#1F1F23] outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const amount = Number(tuAmount.replace(/\s/g, ""))
                        if (!Number.isFinite(amount) || amount <= 0) {
                          setTuError("Enter a valid amount")
                          return
                        }
                        setTuError(null)
                        setFlow("mtn-details")
                      }}
                      className="h-12 rounded-full bg-[#2563EB] text-white text-[16px] font-semibold active:scale-[0.99] transition-transform"
                    >
                      Continue
                    </button>
                    {tuError && (
                      <p className="text-[13px] text-[#DC2626]">{tuError}</p>
                    )}
                  </div>
                </>
              )}

              {flow === "mtn-details" && (
                <>
                  <h3 className="text-[20px] font-semibold text-[#1F1F23]">
                    2. Send via MTN MoMo
                  </h3>
                  <div className="mt-3 rounded-2xl bg-[#FFF4C2] p-4">
                    <p className="text-[13px] text-[#8A6D00]">
                      Send <b>{tuAmount || "the amount"} XAF</b> to:
                    </p>
                    <p className="mt-1 text-[16px] font-semibold text-[#1F1F23]">
                      {TOPUP_NUMBER}
                    </p>
                    <p className="text-[13px] text-[#8A6D00]">{TOPUP_NAME}</p>
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a
                      href={MTN_USSD_TEL}
                      className="mt-3 inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#FFCC00] text-black text-[15px] font-bold active:scale-[0.98] transition-transform"
                    >
                      Open {MTN_USSD} on dialpad
                    </a>
                    <p className="mt-2 text-[12px] text-[#8A6D00]">
                      Tap the button, confirm the USSD prompt, then come back
                      here.
                    </p>
                  </div>

                  <h3 className="mt-5 text-[20px] font-semibold text-[#1F1F23]">
                    3. Confirm your transfer
                  </h3>
                  <div className="mt-4 flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[14px] font-medium text-[#1F1F23]">
                        MoMo number you sent from
                      </span>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={tuPhone}
                        onChange={(e) => setTuPhone(e.target.value)}
                        placeholder="e.g. 6XX XX XX XX"
                        className="h-12 px-4 rounded-2xl bg-[#F0F0F3] text-[16px] text-[#1F1F23] outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[14px] font-medium text-[#1F1F23]">
                        Transfer reference (optional)
                      </span>
                      <input
                        type="text"
                        value={tuRef}
                        onChange={(e) => setTuRef(e.target.value)}
                        placeholder="Reference or memo on the transfer"
                        className="h-12 px-4 rounded-2xl bg-[#F0F0F3] text-[16px] text-[#1F1F23] outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[14px] font-medium text-[#1F1F23]">
                        Receipt of payment
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) =>
                          pickReceipt(e.target.files?.[0] ?? null)
                        }
                        className="text-[14px] text-[#1F1F23] file:mr-3 file:h-10 file:px-4 file:rounded-full file:border-0 file:bg-[#2563EB] file:text-white file:text-[14px] file:font-semibold"
                      />
                      {receiptPreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={receiptPreview}
                          alt="Receipt preview"
                          className="mt-1 h-24 w-24 rounded-xl object-cover border border-[#E5E5EA]"
                        />
                      )}
                    </label>
                    {tuError && (
                      <p className="text-[13px] text-[#DC2626]">{tuError}</p>
                    )}
                    <button
                      type="button"
                      onClick={submitTopUp}
                      disabled={tuBusy}
                      className="h-12 rounded-full bg-[#25D366] text-white text-[16px] font-semibold disabled:opacity-60 active:scale-[0.99] transition-transform"
                    >
                      {tuBusy
                        ? "Sending…"
                        : "Send request on WhatsApp"}
                    </button>
                    <p className="text-[12px] text-[#8A8A96] text-center">
                      Opens WhatsApp with your details - just tap send.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* toast */}
          {toast && (
            <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[65] bg-[#1F1F23] text-white text-[15px] font-medium px-5 py-3 rounded-2xl">
              {toast}
            </div>
          )}
        </>
      )}
    </TopUpCtx.Provider>
  )
}

// Trigger for server-rendered places - same look via caller's className
export const TopUpButton = ({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) => {
  const { open } = useTopUpSheet()
  return (
    <button type="button" onClick={open} className={className}>
      {children ?? "Top up"}
    </button>
  )
}
