"use client"

import { useEffect, useRef, useState } from "react"

type Summary = {
  display_id: string | number | null
  status: string | null
  created_at: string | null
  orders: { display_id: string | number | null; status: string | null; seller: string | null; items: number }[]
}

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export default function PickupVerifyClient() {
  const [token, setToken] = useState("")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [redeemed, setRedeemed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const verify = async (t: string) => {
    setBusy(true)
    setError(null)
    setRedeemed(false)
    const res = await fetch(`${BACKEND_URL}/store/pickup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: t.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setSummary(null)
      setError(data.message || "Invalid pickup code")
      return
    }
    setSummary(data)
  }

  const redeem = async () => {
    if (!token.trim() || busy) return
    setBusy(true)
    setError(null)
    const res = await fetch(`${BACKEND_URL}/store/pickup`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.message || "Could not confirm pickup")
      return
    }
    setRedeemed(true)
    setSummary(data)
  }

  // camera scan via built-in BarcodeDetector when available
  useEffect(() => {
    if (!scanning) return
    let raf = 0
    let dead = false
    const Detector = (window as any).BarcodeDetector
    if (!Detector) {
      setError("Camera scanning isn't supported here - paste the code instead.")
      setScanning(false)
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
            if (text && text.trim().startsWith("hbp1.")) {
              dead = true
              stream.getTracks().forEach((t) => t.stop())
              setScanning(false)
              setToken(text.trim())
              verify(text.trim())
              return
            }
          } catch {}
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch {
        setError("Camera unavailable - paste the code instead.")
        setScanning(false)
      }
    }
    start()
    return () => {
      dead = true
      cancelAnimationFrame(raf)
    }
  }, [scanning])

  return (
    <main className="min-h-screen bg-[#F5F5F7] px-4 py-8">
      <div className="max-w-[480px] mx-auto">
        <h1 className="text-[24px] font-semibold text-[#1F1F23]">Verify pickup</h1>
        <p className="text-[14px] text-[#8A8A96] mt-1">
          Scan the customer's pickup QR or paste the code to confirm handover.
        </p>

        {scanning && (
          <div className="mt-4 relative bg-black rounded-[20px] overflow-hidden aspect-[4/3]">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-6 border-2 border-white/80 rounded-2xl pointer-events-none" />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste pickup code (hbp1.…）"
            className="flex-1 h-12 px-4 rounded-2xl bg-white text-[14px] text-[#1F1F23] outline-none"
          />
          <button
            onClick={() => verify(token)}
            disabled={busy || !token.trim()}
            className="h-12 px-5 rounded-full bg-[#2563EB] text-white text-[15px] font-semibold disabled:opacity-40"
          >
            {busy ? "…" : "Check"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setScanning((v) => !v)}
            className="flex-1 h-11 rounded-full bg-white text-[15px] font-medium text-[#2563EB] border border-[#DBEAFE]"
          >
            {scanning ? "Stop camera" : "Scan with camera"}
          </button>
        </div>

        {error && <p className="mt-4 text-[14px] text-[#DC2626]">{error}</p>}

        {summary && (
          <div className="mt-4 bg-white rounded-[20px] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#1F1F23]">
                Order #{summary.display_id}
              </h2>
              {redeemed ? (
                <span className="text-[12px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-3 py-1 rounded-full">Picked up</span>
              ) : (
                <span className="text-[12px] font-semibold text-[#B45309] bg-[#FEF3C7] px-3 py-1 rounded-full">Not yet picked up</span>
              )}
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {summary.orders.map((o, i) => (
                <li key={i} className="flex items-center justify-between text-[14px]">
                  <span className="text-[#1F1F23]">
                    {o.seller || "Seller"} · order #{o.display_id}
                  </span>
                  <span className="text-[#8A8A96]">{o.items} item{o.items === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
            {!redeemed && (
              <button
                onClick={redeem}
                disabled={busy}
                className="mt-4 w-full h-12 rounded-full bg-[#16A34A] text-white text-[16px] font-semibold disabled:opacity-40"
              >
                {busy ? "Confirming…" : "Confirm handover"}
              </button>
            )}
            {redeemed && (
              <p className="mt-3 text-[13px] text-[#16A34A] text-center">
                Pickup confirmed - this code can't be used again.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
