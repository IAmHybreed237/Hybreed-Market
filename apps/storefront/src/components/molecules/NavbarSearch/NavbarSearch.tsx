"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { trackSearch } from "@/lib/behavior"
import { SearchIcon } from "@/icons"
import { useState } from "react"
import { redirect } from "next/navigation"
import clsx from "clsx"

const imageSearchEnabled = process.env.NEXT_PUBLIC_IMAGE_SEARCH_ENABLED !== "false"

const CameraIcon = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/images/icons/camera-search.png"
    alt=""
    aria-hidden
    draggable={false}
    className="h-[24px] lg:h-[28px] w-auto object-contain select-none"
  />
)

interface Props {
  className?: string
  placeholder?: string
}

export const NavbarSearch = ({ className, placeholder = "Search" }: Props) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { locale } = useParams() as { locale?: string }
  const [search, setSearch] = useState(searchParams.get("query") || "")

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (search) trackSearch(search)
    redirect(search ? `/categories?query=${search}` : "/categories")
  }

  return (
    <form
      className={clsx("relative w-full", className)}
      method="POST"
      onSubmit={submitHandler}
    >
      <SearchIcon
        size={22}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB] pointer-events-none"
      />
      <input
        type="search"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full h-[48px] lg:h-[65px] rounded-[14px] bg-white pl-12 pr-14 lg:pr-[68px] text-base text-primary placeholder:font-bold placeholder:text-[#9ab8f2] outline-none"
      />
      <button
        type="button"
        disabled={!imageSearchEnabled}
        onClick={() => router.push(`/${locale || "en"}/image-search/capture`)}
        aria-label={imageSearchEnabled ? "Search by image" : "Image search coming soon"}
        title={imageSearchEnabled ? "Search by image" : "Image search coming soon"}
        className="absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 h-9 lg:h-11 px-1.5 rounded-lg flex items-center justify-center transition-transform enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-default"
      >
        <CameraIcon />
      </button>
      <input type="submit" className="hidden" />
    </form>
  )
}
