"use client"

import { useSearchParams } from "next/navigation"
import { trackSearch } from "@/lib/behavior"
import { SearchIcon } from "@/icons"
import { useState } from "react"
import { redirect } from "next/navigation"
import clsx from "clsx"

const CameraIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
    <path d="M18.5 2l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z" fill="currentColor" stroke="none" />
  </svg>
)

interface Props {
  className?: string
}

export const NavbarSearch = ({ className }: Props) => {
  const searchParams = useSearchParams()
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
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full h-[48px] lg:h-[65px] rounded-[14px] bg-white pl-12 pr-12 text-base text-primary placeholder:font-bold placeholder:text-[#9ab8f2] outline-none"
      />
      <button
        type="button"
        aria-label="Search by image"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-action-secondary text-action flex items-center justify-center"
      >
        <CameraIcon />
      </button>
      <input type="submit" className="hidden" />
    </form>
  )
}
