"use client"

import { useCallback, useEffect, useState } from "react"
import {
  askProductQuestion,
  getProductQuestions,
  type ProductQuestion,
} from "@/lib/data/questions"
import { requestGuestSignup } from "@/components/organisms/GuestSignup/GuestSignupSheet"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

export const AskQuestionSheet = ({
  open,
  onClose,
  productId,
  productTitle,
}: {
  open: boolean
  onClose: () => void
  productId: string
  productTitle?: string
}) => {
  const [questions, setQuestions] = useState<ProductQuestion[]>([])
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  useBodyScrollLock(open)

  const load = useCallback(async () => {
    const list = await getProductQuestions(productId)
    setQuestions(list)
  }, [productId])

  useEffect(() => {
    if (open) {
      setSent(false)
      setError(null)
      load()
    }
  }, [open, load])

  const submit = async () => {
    if (body.trim().length < 5 || busy) return
    setBusy(true)
    setError(null)
    const res = await askProductQuestion({ productId, body: body.trim() })
    setBusy(false)
    if (!res.ok) {
      if (res.message === "auth") {
        requestGuestSignup(() => submit())
        return
      }
      setError(res.message || "Could not send the question")
      return
    }
    setSent(true)
    setBody("")
    load()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[75]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#F5F5F7] rounded-t-[24px] max-h-[85vh] overflow-y-auto overscroll-contain md:max-w-[520px] md:mx-auto"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)", animation: "hbSheetUp .25s ease-out" }}
      >
        <style>{`@keyframes hbSheetUp{from{transform:translateY(40px);opacity:.6}to{transform:translateY(0);opacity:1}}`}</style>
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1.5 rounded-full bg-[#D4D4DC]" />
        </div>
        <div className="flex items-center justify-between px-4 pt-2 pb-3">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1F1F23]">Questions & answers</h2>
            {productTitle && (
              <p className="text-[13px] text-[#8A8A96] truncate max-w-[260px]">{productTitle}</p>
            )}
          </div>
          <button aria-label="Close" onClick={onClose} className="w-9 h-9 flex items-center justify-center text-[#6B6B76]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
          </button>
        </div>

        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* ask form */}
          <div className="bg-white rounded-[20px] p-4">
            <p className="text-[15px] font-semibold text-[#1F1F23]">Ask about this product</p>
            <p className="text-[13px] text-[#8A8A96] mt-0.5">
              Our team checks with the seller and posts the answer here.
            </p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 1000))}
              placeholder="e.g. Is this original? Do you deliver to Douala?"
              rows={3}
              className="mt-3 w-full px-4 py-3 rounded-2xl bg-[#F0F0F3] text-[15px] text-[#1F1F23] outline-none resize-none"
            />
            {sent && (
              <p className="mt-2 text-[13px] text-[#16A34A]">
                Question sent - we'll post the seller's answer here.
              </p>
            )}
            {error && <p className="mt-2 text-[13px] text-[#DC2626]">{error}</p>}
            <button
              onClick={submit}
              disabled={body.trim().length < 5 || busy}
              className="mt-3 w-full h-11 rounded-full bg-[#2563EB] text-white text-[15px] font-semibold disabled:opacity-40"
            >
              {busy ? "Sending…" : "Ask"}
            </button>
          </div>

          {/* answered questions */}
          {questions.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-semibold text-[#1F1F23] px-1">
                Answered questions ({questions.length})
              </p>
              {questions.map((q) => (
                <div key={q.id} className="bg-white rounded-[20px] p-4">
                  <p className="text-[14px] font-medium text-[#1F1F23]">{q.body}</p>
                  <p className="text-[12px] text-[#8A8A96] mt-1">
                    {q.author_name} · {new Date(q.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                  <div className="mt-3 rounded-2xl bg-[#F0F0F3] px-3.5 py-3">
                    <p className="text-[12px] font-semibold text-[#2563EB] uppercase tracking-wide">Seller answer</p>
                    <p className="text-[14px] text-[#1F1F23] mt-1 leading-snug">{q.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
