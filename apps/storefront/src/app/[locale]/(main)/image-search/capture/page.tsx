"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

const API = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

export default function ImageSearchCapture() {
  const router = useRouter()
  const { locale } = useParams() as { locale?: string }
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("")
  const [cameraError, setCameraError] = useState(false)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => setCameraError(true))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const search = useCallback(
    async (dataUrl: string) => {
      setBusy(true)
      setStatus("Finding matches...")
      try {
        const res = await fetch(`${API}/store/image-search/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": KEY!,
          },
          body: JSON.stringify({ image: dataUrl }),
        })
        const data = await res.json()
        const ids = (data.products || []).map((p: any) => p.id).join(",")
        router.push(`/${locale || "en"}/image-search?ids=${ids}`)
      } catch {
        setStatus("Search failed - try again")
        setBusy(false)
      }
    },
    [locale, router]
  )

  const capture = () => {
    const video = videoRef.current
    if (!video || busy) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 1280
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height)
    search(canvas.toDataURL("image/jpeg", 0.9))
  }

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => search(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="fixed inset-0 z-[95] bg-black text-white flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* header */}
      <div className="relative flex items-center px-4 pt-3 pb-2 min-h-[56px]">
        <button
          onClick={() => router.back()}
          aria-label="Close image search"
          className="w-11 h-11 flex items-center justify-center -ml-2"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h1 className="absolute inset-x-0 text-center text-[28px] font-bold pointer-events-none">
          Image search
        </h1>
      </div>

      {/* camera card */}
      <div className="mx-3 mt-2 h-[45%] rounded-[32px] overflow-hidden relative bg-[#111]">
        {!cameraError && (
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {cameraError ? (
            <p className="text-white/80 text-sm px-6 text-center">
              Camera unavailable - choose a photo below
            </p>
          ) : (
            <>
              <button
                onClick={capture}
                disabled={busy}
                aria-label="Take photo"
                className="w-[90px] h-[90px] rounded-full flex items-center justify-center backdrop-blur-md"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <span className="text-[24px] font-bold">Camera</span>
            </>
          )}
        </div>
        {busy && status && (
          <div className="absolute bottom-4 inset-x-0 text-center text-[15px] font-semibold">
            {status}
          </div>
        )}
      </div>

      {/* gallery panel */}
      <div
        className="flex-1 mt-3 rounded-t-[28px] flex flex-col"
        style={{ background: "#0E0E13", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <h2 className="text-center text-[22px] font-bold pt-6 pb-4">
          Choose photo from Gallery
        </h2>
        <div className="flex-1 flex items-start justify-center px-6 pb-10">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full max-w-[280px] h-[52px] rounded-2xl bg-white/10 border border-white/15 text-white font-semibold text-[16px]"
          >
            Browse photos
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
