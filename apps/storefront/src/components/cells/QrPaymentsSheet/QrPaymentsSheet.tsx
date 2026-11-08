"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import QRCode from "qrcode"
import { lookupWalletUser, transferWallet } from "@/lib/data/wallet"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

type Mode = "hub" | "myqr" | "scan" | "send" | "pay" | "done"

const PAY_PREFIX_C = "hbpay:c:"
const PAY_PREFIX_S = "hbpay:s:"

const parsePayload = (text: string): { kind: "customer" | "seller"; id: string } | null => {
  const t = text.trim()
  if (t.startsWith(PAY_PREFIX_C)) return { kind: "customer", id: t.slice(PAY_PREFIX_C.length) }
  if (t.startsWith(PAY_PREFIX_S)) return { kind: "seller", id: t.slice(PAY_PREFIX_S.length) }
  return null
}

const localDigits = (v: string) => v.replace(/\D/g, "").replace(/^237/, "").slice(0, 9)

export const QrPaymentsSheet = ({
  open,
  onClose,
  customerId,
  userName,
  balance,
}: {
  open: boolean
  onClose: () => void
  customerId: string
  userName: string
  balance: number
}) => {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("hub")
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [sendPhone, setSendPhone] = useState("")
  const [sendBusy, setSendBusy] = useState(false)
  const [recipient, setRecipient] = useState<{ customer_id?: string; seller_id?: string; name: string } | null>(null)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [payBusy, setPayBusy] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  useBodyScrollLock(open)

  const reset = useCallback(() => {
    setMode("hub")
    setRecipient(null)
    setAmount("")
    setNote("")
    setPayError(null)
    setScanError(null)
    setSendPhone("")
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      return
    }
    QRCode.toDataURL(`${PAY_PREFIX_C}${customerId}`, { width: 480, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [open, customerId, reset])

  // camera scan loop using the built-in BarcodeDetector (Chrome/Android)
  useEffect(() => {
    if (mode !== "scan" || !open) return
    let raf = 0
    let dead = false
    const Detector = (window as any).BarcodeDetector
    if (!Detector) {
      setScanError("Camera scanning isn't supported on this browser - use the number field below.")
      return
    }
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        if (dead) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        const detector = new Detector({ formats: ["qr_code"] })
        const tick = async () => {
          if (dead || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            const text = codes?.[0]?.rawValue as string | undefined
            const payload = text ? parsePayload(text) : null
            if (payload) {
              dead = true
              stream.getTracks().forEach((t) => t.stop())
              const res = payload.kind === "seller"
                ? await lookupWalletUser({ seller_id: payload.id })
                : await lookupWalletUser({ customer_id: payload.id })
              const ok = payload.kind === "seller" ? res?.found && res.seller_id : res?.found && res.customer_id
              if (ok) {
                setRecipient(
                  payload.kind === "seller"
                    ? { seller_id: payload.id, name: res?.name || "Hybreed seller" }
                    : { customer_id: payload.id, name: res?.name || "Hybreed user" }
                )
                setMode("pay")
              } else {
                setScanError("That QR isn't a Hybreed payment code.")
                setMode("scan")
              }
              return
            }
          } catch {}
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch {
        setScanError("Camera unavailable - allow camera access or use the number field below.")
      }
    }
    start()
    return () => {
      dead = true
      cancelAnimationFrame(raf)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [mode, open])

  const findByPhone = async () => {
    const digits = localDigits(sendPhone)
    if (digits.length !== 9 || sendBusy) return
    setSendBusy(true)
    setPayError(null)
    const res = await lookupWalletUser({ phone: digits })
    setSendBusy(false)
    if (res?.found && res.customer_id) {
      setRecipient({ customer_id: res.customer_id, name: res.name || "Hybreed user" })
      setMode("pay")
    } else {
      setPayError("No Hybreed account found for that number")
    }
  }

  const confirmPay = async () => {
    const n = Number(amount.replace(/\s/g, ""))
    if (!recipient || !Number.isFinite(n) || n <= 0 || payBusy) return
    setPayBusy(true)
    setPayError(null)
    const res = await transferWallet({
      ...(recipient.customer_id
        ? { to_customer_id: recipient.customer_id }
        : { to_seller_id: recipient.seller_id }),
      amount: n,
      note: note.trim() || undefined,
    })
    setPayBusy(false)
    if (!res.ok) {
      setPayError(res.message || "Transfer failed")
      return
    }
    setSentTo(recipient.name)
    setMode("done")
    router.refresh()
  }

  if (!open) return null

  const fmt = (n: number) => `${Math.round(n).toLocaleString("en-US").replace(/,/g, " ")} XAF`

  return (
    <div className="fixed inset-0 z-[75]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#F5F5F7] rounded-t-[24px] max-h-[88vh] overflow-y-auto overscroll-contain md:max-w-[520px] md:mx-auto"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)", animation: "hbSheetUp .25s ease-out" }}
      >
        <style>{`@keyframes hbSheetUp{from{transform:translateY(40px);opacity:.6}to{transform:translateY(0);opacity:1}}`}</style>
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1.5 rounded-full bg-[#D4D4DC]" />
        </div>
        <div className="flex items-center justify-between px-4 pt-2 pb-3">
          <h2 className="text-[20px] font-semibold text-[#1F1F23]">
            {mode === "hub" && "QR Payments"}
            {mode === "myqr" && "My QR"}
            {mode === "scan" && "Scan QR"}
            {mode === "send" && "Send to a number"}
            {mode === "pay" && "Confirm payment"}
            {mode === "done" && "Sent"}
          </h2>
          <button aria-label="Close" onClick={onClose} className="w-9 h-9 flex items-center justify-center text-[#6B6B76]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
          </button>
        </div>

        <div className="px-4 pb-4">
          {mode === "hub" && (
            <div className="flex flex-col gap-3">
              {[
                {
                  title: "My QR",
                  sub: "Show this so others can pay you",
                  icon: "M3 7V4h3M17 4h3v3M21 17v3h-3M7 20H4v-3M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z",
                  fn: () => setMode("myqr"),
                },
                {
                  title: "Scan QR",
                  sub: "Scan someone's code to pay them",
                  icon: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M3 12h18",
                  fn: () => setMode("scan"),
                },
                {
                  title: "Send to number",
                  sub: "Pay any Hybreed user by phone number",
                  icon: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z",
                  fn: () => setMode("send"),
                },
              ].map((o) => (
                <button
                  key={o.title}
                  onClick={o.fn}
                  className="w-full bg-white rounded-[20px] p-4 flex items-center gap-4 text-left active:scale-[0.99] transition-transform"
                >
                  <span className="w-11 h-11 rounded-[14px] bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={o.icon} /></svg>
                  </span>
                  <span>
                    <span className="block text-[16px] font-semibold text-[#1F1F23]">{o.title}</span>
                    <span className="block text-[13px] text-[#8A8A96] mt-0.5">{o.sub}</span>
                  </span>
                  <svg className="ml-auto text-[#8A8A96]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}
              <p className="text-[12px] text-[#8A8A96] text-center pt-1">
                Balance: <b className="text-[#1F1F23]">{fmt(balance)}</b>
              </p>
            </div>
          )}

          {mode === "myqr" && (
            <div className="bg-white rounded-[20px] p-5 flex flex-col items-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Your Hybreed payment QR" className="w-56 h-56" />
              ) : (
                <div className="w-56 h-56 bg-[#F0F0F3] rounded-xl animate-pulse" />
              )}
              <p className="mt-3 text-[16px] font-semibold text-[#1F1F23]">{userName}</p>
              <p className="text-[13px] text-[#8A8A96] text-center mt-1">
                Anyone who scans this can send you Hybreed Wallet money.
              </p>
            </div>
          )}

          {mode === "scan" && (
            <div className="flex flex-col gap-3">
              <div className="relative bg-black rounded-[20px] overflow-hidden aspect-[4/3]">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-6 border-2 border-white/80 rounded-2xl pointer-events-none" />
              </div>
              {scanError && <p className="text-[13px] text-[#DC2626]">{scanError}</p>}
              <p className="text-[13px] text-[#8A8A96] text-center">
                Point the camera at a Hybreed payment QR code.
              </p>
              <div className="bg-white rounded-[20px] p-4">
                <p className="text-[14px] font-medium text-[#1F1F23] mb-2">Or enter a number</p>
                <div className="flex gap-2">
                  <span className="flex items-center h-11 px-3 rounded-xl bg-[#F0F0F3] text-[15px] text-[#8A8A96]">+237</span>
                  <input
                    value={sendPhone}
                    onChange={(e) => setSendPhone(localDigits(e.target.value))}
                    placeholder="6XX XXX XXX"
                    inputMode="tel"
                    className="flex-1 h-11 px-3 rounded-xl bg-[#F0F0F3] text-[15px] text-[#1F1F23] outline-none"
                  />
                </div>
                <button
                  onClick={findByPhone}
                  disabled={sendPhone.length !== 9 || sendBusy}
                  className="mt-2 w-full h-11 rounded-full bg-[#2563EB] text-white text-[15px] font-semibold disabled:opacity-40"
                >
                  {sendBusy ? "Finding…" : "Find & pay"}
                </button>
                {payError && <p className="text-[13px] text-[#DC2626] mt-2">{payError}</p>}
              </div>
            </div>
          )}

          {mode === "send" && (
            <div className="bg-white rounded-[20px] p-4">
              <p className="text-[14px] text-[#6B6B76] mb-2">Enter the person's Hybreed phone number.</p>
              <div className="flex gap-2">
                <span className="flex items-center h-11 px-3 rounded-xl bg-[#F0F0F3] text-[15px] text-[#8A8A96]">+237</span>
                <input
                  value={sendPhone}
                  onChange={(e) => setSendPhone(localDigits(e.target.value))}
                  placeholder="6XX XXX XXX"
                  inputMode="tel"
                  className="flex-1 h-11 px-3 rounded-xl bg-[#F0F0F3] text-[15px] text-[#1F1F23] outline-none"
                />
              </div>
              {payError && <p className="text-[13px] text-[#DC2626] mt-2">{payError}</p>}
              <button
                onClick={findByPhone}
                disabled={sendPhone.length !== 9 || sendBusy}
                className="mt-3 w-full h-11 rounded-full bg-[#2563EB] text-white text-[15px] font-semibold disabled:opacity-40"
              >
                {sendBusy ? "Finding…" : "Continue"}
              </button>
            </div>
          )}

          {mode === "pay" && recipient && (
            <div className="bg-white rounded-[20px] p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center text-[16px] font-bold">
                  {recipient.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-[16px] font-semibold text-[#1F1F23]">{recipient.name}</p>
                  <p className="text-[13px] text-[#8A8A96]">Hybreed Wallet</p>
                </div>
              </div>
              <label className="block">
                <span className="text-[14px] font-medium text-[#1F1F23]">Amount (XAF)</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d\s]/g, ""))}
                  placeholder="e.g. 5 000"
                  inputMode="numeric"
                  className="mt-1 w-full h-12 px-4 rounded-2xl bg-[#F0F0F3] text-[16px] text-[#1F1F23] outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[14px] font-medium text-[#1F1F23]">Note (optional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's this for?"
                  className="mt-1 w-full h-12 px-4 rounded-2xl bg-[#F0F0F3] text-[16px] text-[#1F1F23] outline-none"
                />
              </label>
              <p className="text-[13px] text-[#8A8A96]">Your balance: <b className="text-[#1F1F23]">{fmt(balance)}</b></p>
              {payError && <p className="text-[13px] text-[#DC2626]">{payError}</p>}
              <button
                onClick={confirmPay}
                disabled={payBusy || !amount.trim()}
                className="w-full h-12 rounded-full bg-[#2563EB] text-white text-[16px] font-semibold disabled:opacity-40"
              >
                {payBusy ? "Sending…" : `Send ${amount.trim() ? fmt(Number(amount.replace(/\s/g, "")) || 0) : ""}`}
              </button>
            </div>
          )}

          {mode === "done" && (
            <div className="bg-white rounded-[20px] p-6 flex flex-col items-center text-center">
              <span className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mb-3">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
              <p className="text-[18px] font-semibold text-[#1F1F23]">Payment sent</p>
              <p className="text-[14px] text-[#8A8A96] mt-1">
                {fmt(Number(amount.replace(/\s/g, "")) || 0)} to {sentTo}
              </p>
              <button
                onClick={() => { reset(); onClose() }}
                className="mt-4 w-full h-11 rounded-full bg-[#2563EB] text-white text-[15px] font-semibold"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
