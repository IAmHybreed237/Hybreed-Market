"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import clsx from "clsx"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { SearchIcon } from "@/icons"
import {
  trackSearch,
  getSearches,
  removeSearch,
  getRecentProducts,
  ViewInfo,
} from "@/lib/behavior"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { ImageSearchModal } from "./ImageSearchModal"

const imageSearchEnabled = process.env.NEXT_PUBLIC_IMAGE_SEARCH_ENABLED === "true"

const CameraIcon = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/images/icons/camera-search.png"
    alt=""
    aria-hidden
    draggable={false}
    className="h-[24px] w-auto object-contain select-none"
  />
)

const num = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ")

type Suggestion = { title: string; handle: string; image: string | null; price: number | null }

export const MobileSearch = ({
  className,
  onActiveChange,
}: {
  className?: string
  onActiveChange?: (active: boolean) => void
}) => {
  const router = useRouter()
  const { locale } = useParams() as { locale?: string }
  const loc = locale || "cm"

  const [query, setQuery] = useState("")
  const [active, setActive] = useState(false)
  const [searches, setSearches] = useState<string[]>([])
  const [recents, setRecents] = useState<ViewInfo[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showImageSearch, setShowImageSearch] = useState(false)

  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useBodyScrollLock(active)

  useEffect(() => {
    onActiveChange?.(active)
  }, [active, onActiveChange])

  const refreshLists = () => {
    setSearches(getSearches(10))
    setRecents(getRecentProducts(10))
  }

  const activate = () => {
    setActive(true)
    refreshLists()
  }

  const deactivate = () => {
    setActive(false)
    setSuggestions([])
    inputRef.current?.blur()
  }

  const cancel = () => {
    setQuery("")
    setSuggestions([])
    deactivate()
  }

  const go = (term?: string) => {
    const q = (term ?? query).trim()
    if (!q) return
    trackSearch(q)
    setActive(false)
    setSuggestions([])
    inputRef.current?.blur()
    router.push(`/${loc}/categories?query=${encodeURIComponent(q)}`)
  }

  const openProduct = (handle: string) => {
    setActive(false)
    setSuggestions([])
    inputRef.current?.blur()
    router.push(`/${loc}/products/${handle}`)
  }

  // debounced suggestions while typing
  useEffect(() => {
    const q = query.trim()
    if (!active || q.length < 2) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/search-suggest?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setSuggestions(d.products || []))
        .catch(() => setSuggestions([]))
    }, 250)
    return () => clearTimeout(t)
  }, [query, active])

  const onBlur = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    blurTimer.current = setTimeout(() => {
      if (!wrapRef.current?.contains(document.activeElement)) deactivate()
    }, 150)
  }

  const searching = query.trim().length >= 2

  return (
    <div ref={wrapRef} className={clsx("relative", className)}>
      <div className="flex items-center gap-2">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            go()
          }}
        >
          <SearchIcon
            size={22}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB] pointer-events-none"
          />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={activate}
            onBlur={onBlur}
            className="w-full h-[48px] rounded-[14px] bg-white pl-12 pr-14 text-base text-primary placeholder:font-bold placeholder:text-[#9ab8f2] outline-none"
          />
          <button
            type="button"
            disabled={!imageSearchEnabled}
            onClick={() => setShowImageSearch(true)}
            aria-label={imageSearchEnabled ? "Search by image" : "Image search coming soon"}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-1.5 rounded-lg flex items-center justify-center transition-transform enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-default"
          >
            <CameraIcon />
          </button>
          <input type="submit" className="hidden" />
        </form>
        {active && (
          <button
            type="button"
            onClick={cancel}
            className="shrink-0 text-[15px] font-semibold text-white px-1"
          >
            Cancel
          </button>
        )}
      </div>

      {active && (
        <div
          className="mt-2 bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.18)] max-h-[62vh] overflow-y-auto overscroll-contain"
          // keep the input focused while tapping chips/products inside
          onMouseDown={(e) => e.preventDefault()}
        >
          {searching ? (
            <div>
              {suggestions.length === 0 && (
                <button
                  onClick={() => go()}
                  className="w-full text-left px-4 py-3.5 text-[15px] font-medium text-[#2563EB] border-b border-[#F0F0F3]"
                >
                  See all results for &quot;{query.trim()}&quot;
                </button>
              )}
              {suggestions.map((s) => (
                <button
                  key={s.handle}
                  onClick={() => {
                    trackSearch(query.trim())
                    openProduct(s.handle)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left active:bg-[#F6F6F9]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {s.image ? (
                    <img
                      src={s.image}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover bg-[#F0F0F3] shrink-0"
                    />
                  ) : (
                    <span className="w-11 h-11 rounded-xl bg-[#F0F0F3] shrink-0" />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-medium text-[#1F1F23] truncate">
                      {s.title}
                    </span>
                    {s.price != null && (
                      <span className="block text-[13px] text-[#8A8A96]">
                        {num(s.price)} XAF
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3">
              {searches.length > 0 && (
                <div className="mb-4">
                  <p className="text-[13px] font-semibold text-[#8A8A96] uppercase tracking-wide mb-2">
                    Search history
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searches.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 bg-[#F0F0F3] rounded-full pl-3.5 pr-1.5 py-1.5 text-[14px] text-[#1F1F23]"
                      >
                        <button onClick={() => go(s)} className="max-w-[180px] truncate">
                          {s}
                        </button>
                        <button
                          aria-label={`Remove ${s}`}
                          onClick={() => {
                            removeSearch(s)
                            refreshLists()
                          }}
                          className="w-5 h-5 rounded-full bg-[#D9D9E0] text-[#1F1F23] flex items-center justify-center shrink-0"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="6" y1="6" x2="18" y2="18" />
                            <line x1="18" y1="6" x2="6" y2="18" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recents.length > 0 && (
                <div>
                  <p className="text-[13px] font-semibold text-[#8A8A96] uppercase tracking-wide mb-2">
                    Recently viewed
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    {recents.map((p) => (
                      <LocalizedClientLink
                        key={p.handle}
                        href={`/products/${p.handle}`}
                        onClick={() => {
                          setActive(false)
                          inputRef.current?.blur()
                        }}
                        className="w-[104px] shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-full aspect-square rounded-xl object-cover bg-[#F0F0F3]"
                          />
                        ) : (
                          <span className="block w-full aspect-square rounded-xl bg-[#F0F0F3]" />
                        )}
                        <span className="block mt-1.5 text-[12px] font-medium text-[#1F1F23] line-clamp-2 leading-tight">
                          {p.title}
                        </span>
                        {p.price != null && (
                          <span className="block text-[12px] text-[#8A8A96]">
                            {num(p.price)} XAF
                          </span>
                        )}
                      </LocalizedClientLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {imageSearchEnabled && showImageSearch && (
        <ImageSearchModal onClose={() => setShowImageSearch(false)} />
      )}
    </div>
  )
}
