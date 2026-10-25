"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { quickAdd } from "@/lib/quickAdd"
import { HeartIcon, HeartFilledIcon, CartIcon } from "@/icons"

export const ShelfCardActions = ({ p }: { p: any }) => {
  const pathname = usePathname()
  const [fav, setFav] = useState(false)

  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      <button
        type="button"
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={fav}
        onClick={(e) => {
          stop(e)
          setFav((v) => !v)
        }}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-primary shadow-sm"
      >
        {fav ? <HeartFilledIcon size={20} /> : <HeartIcon size={20} />}
      </button>
      <button
        type="button"
        aria-label="Add to cart"
        onClick={async (e) => {
          stop(e)
          try {
            await quickAdd(p.id, pathname.split("/")[1] || "de")
          } catch {}
        }}
        className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-action shadow-sm"
      >
        <CartIcon size={18} />
      </button>
    </>
  )
}
