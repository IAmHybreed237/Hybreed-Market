"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

export type DepartmentChild = {
  id: string
  name: string
  handle: string
  image?: string | null
}

export type Department = {
  id: string
  name: string
  handle: string
  children: DepartmentChild[]
}

const Thumb = ({ child }: { child: DepartmentChild }) => {
  const [failed, setFailed] = useState(false)
  const src = child.image
  return (
    <span className="w-[60px] h-[60px] rounded-[18px] bg-white shrink-0 flex items-center justify-center overflow-hidden">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-1"
        />
      ) : (
        <span className="text-[22px] font-bold text-[#C05BFF]">
          {child.name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  )
}

/** Slide-in-from-right department screen (dark, Wildberries-style). */
export const DepartmentSheet = ({
  dept,
  onClose,
}: {
  dept: Department | null
  onClose: () => void
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (dept) {
      setMounted(false)
      const t = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(t)
    }
    setMounted(false)
  }, [dept])

  if (!dept) return null

  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-label={dept.name}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className="absolute inset-y-0 right-0 w-full max-w-[430px] flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: mounted ? "translateX(0)" : "translateX(100%)",
          background: "#0B0B14",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* header panel */}
        <div
          className="bg-[#11111A] px-6 pt-4 pb-5"
          style={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
        >
          <div className="flex items-center min-h-[44px]">
            <button
              onClick={onClose}
              aria-label="Back"
              className="w-11 h-11 -ml-2.5 flex items-center justify-center"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B356FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h1 className="flex-1 text-center text-[22px] font-semibold text-white pr-11">
              {dept.name}
            </h1>
          </div>
        </div>

        {/* category list */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-8">
          <LocalizedClientLink
            href={`/categories/${dept.handle}`}
            onClick={onClose}
            className="flex items-center gap-5 h-[88px] rounded-[20px] px-2 active:opacity-90 transition-opacity"
          >
            <Thumb child={{ id: dept.id, name: dept.name, handle: dept.handle }} />
            <span className="text-[20px] font-normal text-white">All {dept.name}</span>
          </LocalizedClientLink>
          {dept.children.map((child) => (
            <LocalizedClientLink
              key={child.id}
              href={`/categories/${child.handle}`}
              onClick={onClose}
              className="flex items-center gap-5 h-[88px] rounded-[20px] px-2 active:opacity-90 transition-opacity"
            >
              <Thumb child={child} />
              <span className="text-[20px] font-normal text-white truncate">
                {child.name}
              </span>
            </LocalizedClientLink>
          ))}
          {!dept.children.length && (
            <p className="text-center text-white/50 text-[15px] mt-10">
              No subcategories yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
