"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
const RETRACT_MS = 160

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
  const searchParams = useSearchParams()
  const { locale } = useParams() as { locale?: string }
  const loc = locale || "cm"

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [retracting, setRetracting] = useState(false)
  const [searches, setSearches] = useState<string[]>([])
  const [recents, setRecents] = useState<ViewInfo[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showImageSearch, setShowImageSearch] = useState(false)

  const headerInputRef = useRef<HTMLInputElement>(null)
  const overlayInputRef = useRef<HTMLInputElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useBodyScrollLock(open)

  // focus the overlay input once it mounts
  useEffect(() => {
    if (open) overlayInputRef.current?.focus()
  }, [open])

  const refreshLists = () => {
    setSearches(getSearches(10))
    setRecents(getRecentProducts(10))
  }

  const activate = () => {
    if (open || retracting) return
    // tell the header to retract first, then open the full-screen search page
    onActiveChange?.(true)
    setRetracting(true)
    openTimer.current = setTimeout(() => {
      setRetracting(false)
      headerInputRef.current?.blur()
      setOpen(true)
      refreshLists()
    }, RETRACT_MS)
  }

  const close = () => {
    if (openTimer.current) clearTimeout(openTimer.current)
    setOpen(false)
    setRetracting(false)
    setQuery("")
    setSuggestions([])
    headerInputRef.current?.blur()
    overlayInputRef.current?.blur()
    onActiveChange?.(false)
  }

  const go = (term?: string) => {
    const q = (term ?? query).trim()
    if (!q) return
    trackSearch(q)
    close()
    router.push(`/${loc}/search?q=${encodeURIComponent(q)}`)
  }

  const openProduct = (handle: string, term?: string) => {
    if (term) trackSearch(term)
    close()
    router.push(`/${loc}/products/${handle}`)
  }

  // debounced suggestions while typing
  useEffect(() => {
    const q = query.trim()
    if (!open || q.length < 2) {
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
  }, [query, open])

  useEffect(() => () => {
    if (openTimer.current) clearTimeout(openTimer.current)
  }, [])

  // reopen the search input when arriving with ?focus=search
  // (used by the search results page's search field)
  const focusHandled = useRef(false)
  useEffect(() => {
    if (!focusHandled.current && searchParams.get("focus") === "search") {
      focusHandled.current = true
      activate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const searching = query.trim().length >= 2

  return (
    <div className={clsx("relative", className)}>
      {/* header trigger - stays in the blue header */}
      <form
        className="relative w-full"
        onSubmit={(e) => {
          e.preventDefault()
          activate()
        }}
      >
        <SearchIcon
          size={22}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB] pointer-events-none"
        />
        <input
          ref={headerInputRef}
          type="search"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={activate}
          readOnly={open}
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

      {/* full-screen search page */}
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-white flex flex-col"
          style={{ animation: "searchOverlayIn .18s ease-out" }}
        >
          <style>{`
            @keyframes searchOverlayIn{from{opacity:0}to{opacity:1}}
            @keyframes searchFieldIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}
            @keyframes searchCancelIn{from{opacity:0;transform:translateX(52px)}to{opacity:1;transform:none}}
          `}</style>
          <div
            className="px-3 pb-2.5 flex items-center gap-2 shrink-0 bg-white"
            style={{ paddingTop: "max(env(safe-area-inset-top), 10px)" }}
          >
            <form
              className="relative flex-1"
              style={{ animation: "searchFieldIn .34s cubic-bezier(.2,.8,.2,1) both" }}
              onSubmit={(e) => {
                e.preventDefault()
                go()
              }}
            >
              <SearchIcon
                size={20}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8A96] pointer-events-none"
              />
              <input
                ref={overlayInputRef}
                type="search"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-11 rounded-[12px] bg-[#F0F0F3] pl-11 pr-11 text-[15px] text-[#1F1F23] placeholder:text-[#8A8A96] outline-none"
              />
              <button
                type="button"
                disabled={!imageSearchEnabled}
                onClick={() => setShowImageSearch(true)}
                aria-label={imageSearchEnabled ? "Search by image" : "Image search coming soon"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center enabled:active:bg-[#E4E4EA] disabled:cursor-default"
              >
                <CameraIcon />
              </button>
              <input type="submit" className="hidden" />
            </form>
            <button
              type="button"
              onClick={close}
              className="shrink-0 text-[15px] font-semibold text-[#2563EB] px-1"
              style={{ animation: "searchCancelIn .32s cubic-bezier(.2,.8,.2,1) .1s both" }}
            >
              Cancel
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8"
            style={{ animation: "searchOverlayIn .22s ease-out .14s both" }}
          >
            {searching ? (
              <div>
                {suggestions.length === 0 && (
                  <button
                    onClick={() => go()}
                    className="w-full text-left py-3.5 text-[15px] font-medium text-[#2563EB] border-b border-[#F0F0F3]"
                  >
                    See all results for &quot;{query.trim()}&quot;
                  </button>
                )}
                {suggestions.map((s) => (
                  <button
                    key={s.handle}
                    onClick={() => openProduct(s.handle, query.trim())}
                    className="w-full flex items-center gap-3 py-2.5 text-left active:bg-[#F6F6F9]"
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
              <div>
                {searches.length > 0 && (
                  <div className="pt-2 pb-5">
                    <p className="text-[13px] font-semibold text-[#8A8A96] uppercase tracking-wide mb-2.5">
                      Search history
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {searches.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 bg-[#F0F0F3] rounded-full pl-3.5 pr-1 py-1.5 text-[14px] text-[#1F1F23]"
                        >
                          <button onClick={() => go(s)} className="max-w-[200px] truncate">
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
                  <div className="pt-1">
                    <p className="text-[13px] font-semibold text-[#8A8A96] uppercase tracking-wide mb-2.5">
                      Recently viewed
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                      {recents.map((p) => (
                        <LocalizedClientLink
                          key={p.handle}
                          href={`/products/${p.handle}`}
                          onClick={() => {
                            setOpen(false)
                            headerInputRef.current?.blur()
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
        </div>
      )}

      {imageSearchEnabled && showImageSearch && (
        <ImageSearchModal onClose={() => setShowImageSearch(false)} />
      )}
    </div>
  )
}
