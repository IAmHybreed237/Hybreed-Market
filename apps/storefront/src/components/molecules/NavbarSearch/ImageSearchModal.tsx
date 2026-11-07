"use client"

import { useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

type Component = { label: string; x: number; y: number }
type Box = { x: number; y: number; w: number; h: number }

const API = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

export const ImageSearchModal = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter()
  const { locale } = useParams() as { locale?: string }
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [components, setComponents] = useState<Component[]>([])
  const [boxes, setBoxes] = useState<Record<string, Box>>({})
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("")
  useBodyScrollLock(true)

  const pick = () => fileRef.current?.click()

  const onFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setImage(dataUrl)
      setBusy(true)
      setStatus("Finding items in your photo...")
      try {
        const res = await fetch(`${API}/store/image-search/detect`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-publishable-api-key": KEY! },
          body: JSON.stringify({ image: dataUrl }),
        })
        const data = await res.json()
        setComponents(data.components || [])
        // store boxes too for cropping
        const map: Record<string, Box> = {}
        ;(data.components || []).forEach((c: any) => { if (c.box) map[c.label] = c.box })
        setBoxes(map)
        setStatus((data.components || []).length ? "Tap a dot to search that item" : "No items detected - searching whole photo")
      } catch {
        setStatus("Couldn't analyze the photo - searching whole photo")
      }
      setBusy(false)
    }
    reader.readAsDataURL(file)
  }

  const searchRegion = async (box?: Box) => {
    if (!image) return
    setBusy(true)
    setStatus("Searching for matches...")
    try {
      const res = await fetch(`${API}/store/image-search/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": KEY! },
        body: JSON.stringify({ image, box }),
      })
      const data = await res.json()
      const ids = (data.products || []).map((p: any) => p.id).join(",")
      router.push(`/${locale || "de"}/image-search?ids=${ids}`)
      onClose()
    } catch {
      setStatus("Search failed - try again")
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-full max-w-[420px] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#1F1F23]">Search by photo</h2>
          <button aria-label="Close" onClick={onClose} className="w-9 h-9 flex items-center justify-center text-[#8A8A96]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

        {!image ? (
          <button onClick={pick} className="w-full h-40 rounded-2xl border-2 border-dashed border-[#BFDBFE] text-[#2563EB] font-medium flex flex-col items-center justify-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            Choose a photo
          </button>
        ) : (
          <div className="relative rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={image} alt="" className="w-full object-contain max-h-[420px]" />
            {components.map((c) => (
              <button
                key={c.label}
                aria-label={`Search ${c.label}`}
                onClick={() => searchRegion(boxes[c.label])}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
              >
                <span className="block w-4 h-4 rounded-full bg-[#2563EB] ring-4 ring-[#2563EB]/40 animate-pulse group-hover:scale-125 transition-transform" />
                <span className="absolute left-1/2 -translate-x-1/2 top-5 bg-[#1F1F23] text-white text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {status && <p className="mt-3 text-sm text-[#6B6B76] text-center">{busy ? status : status}</p>}

        {image && (
          <div className="mt-3 flex gap-2">
            <button onClick={pick} className="flex-1 h-11 rounded-full bg-[#F0F0F3] text-[#1F1F23] font-medium">Change photo</button>
            <button onClick={() => searchRegion()} disabled={busy} className="flex-1 h-11 rounded-full bg-[#2563EB] text-white font-semibold disabled:opacity-50">
              Search all
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
