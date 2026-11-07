"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

/** The search results experience is mobile-only; desktop keeps the classic listing. */
export const SearchRedirectDesktop = ({ q }: { q: string }) => {
  const router = useRouter()
  const { locale } = useParams() as { locale?: string }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    if (mq.matches) {
      router.replace(
        `/${locale || "cm"}/categories${q ? `?query=${encodeURIComponent(q)}` : ""}`
      )
    }
  }, [q, locale, router])

  return null
}
