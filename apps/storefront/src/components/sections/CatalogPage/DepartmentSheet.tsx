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
    <span className="w-14 h-14 rounded-2xl bg-white shrink-0 flex items-center justify-center overflow-hidden border border-[#ECECF1]">
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
        <span className="text-[20px] font-bold text-[#2563EB]">
          {child.name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  )
}

/** Slide-in-from-right department screen. */
export const DepartmentSheet = ({
  dept,
  onClose,
  onNavigate,
}: {
  dept: Department | null
  onClose: () => void
  onNavigate: () => void
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
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className="absolute inset-y-0 right-0 w-full max-w-[430px] flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: mounted ? "translateX(0)" : "translateX(100%)",
          background: "#F5F5F7",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* header */}
        <div className="bg-white px-4 pt-2 pb-3" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <div className="flex items-center min-h-[40px]">
            <button
              onClick={onClose}
              aria-label="Back"
              className="w-10 h-10 -ml-2 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h1 className="flex-1 text-center text-[18px] font-medium text-[#1F1F23] pr-10">
              {dept.name}
            </h1>
          </div>
        </div>

        {/* category list */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-8">
          <LocalizedClientLink
            href={`/categories/${dept.handle}`}
            onClick={onNavigate}
            className="flex items-center gap-4 h-[68px] rounded-2xl px-2 active:bg-black/5 transition-colors"
          >
            <Thumb child={{ id: dept.id, name: dept.name, handle: dept.handle }} />
            <span className="text-[17px] font-normal text-[#1F1F23]">All {dept.name}</span>
          </LocalizedClientLink>
          {dept.children.map((child) => (
            <LocalizedClientLink
              key={child.id}
              href={`/categories/${child.handle}`}
              onClick={onNavigate}
              className="flex items-center gap-4 h-[68px] rounded-2xl px-2 active:bg-black/5 transition-colors"
            >
              <Thumb child={child} />
              <span className="text-[17px] font-normal text-[#1F1F23] truncate">
                {child.name}
              </span>
            </LocalizedClientLink>
          ))}
          {!dept.children.length && (
            <p className="text-center text-[#8A8A96] text-[15px] mt-10">
              No subcategories yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
