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
  SHOW_NUMBER_ROW,
  STEPS,
  TOPUP_LIMIT,
  TOPUP_NUMBER,
  TOPUP_NUMBER_RAW,
} from "./topup.config"

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

  const tapMethod = (enabled: boolean, label: string) => {
    if (!enabled) showToast("Coming soon")
    else showToast(label) // real flows land here when integrated
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
            {/* drag handle — floats above the sheet edge */}
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
                    onClick={() => tapMethod(m.enabled, m.label)}
                    className="w-[90px] h-[84px] shrink-0 rounded-[24px] p-3 flex flex-col justify-between text-left snap-start transition-transform duration-100 active:scale-[0.96]"
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
                    <span className="text-[16px] font-medium leading-[17px] text-[#1F1F23] line-clamp-2">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
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

// Trigger for server-rendered places — same look via caller's className
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
