"use client"

import { LogoutButton, NavigationItem } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ProfileIcon } from "@/icons"
import { useUnreads } from "@talkjs/react"
import { useState } from "react"

const itemCls =
  "block px-4 py-2 text-sm font-normal text-[#242424] hover:text-action transition-colors"

export const UserDropdown = ({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean
  userName?: string
}) => {
  const [open, setOpen] = useState(false)

  const unreads = useUnreads()

  return (
    <div
      className="relative"
      onMouseOver={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
    >
      <LocalizedClientLink
        href={isLoggedIn ? "/user" : "/login"}
        className="relative"
        aria-label="Go to user profile"
      >
        <ProfileIcon size={26} />
      </LocalizedClientLink>
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+30px)] bg-white text-primary z-50 border rounded-md shadow-xl w-[280px]"
          data-testid="user-dropdown"
        >
          {isLoggedIn ? (
            <div className="py-2">
              <div className="px-4 pb-2 border-b">
                <h3 className="text-base font-bold text-[#242424]">
                  {userName || "Your account"}
                </h3>
                <LocalizedClientLink
                  href="/user"
                  className="text-sm text-action hover:underline"
                >
                  Your details
                </LocalizedClientLink>
              </div>
              <div className="py-1">
                <NavigationItem href="/user/orders" className={itemCls}>
                  Purchases
                </NavigationItem>
                <NavigationItem href="/user/favorites" className={itemCls}>
                  Favorites
                </NavigationItem>
                <NavigationItem href="/user/favorites" className={itemCls}>
                  Favorite sellers
                </NavigationItem>
                <NavigationItem href="/user/orders" className={itemCls}>
                  Orders
                </NavigationItem>
                <NavigationItem href="/user" className={itemCls}>
                  Gift cards
                </NavigationItem>
                <NavigationItem href="/user" className={itemCls}>
                  <span className="flex items-center justify-between">
                    Hybreed Wallet
                    <span className="font-semibold">0 XAF</span>
                  </span>
                </NavigationItem>
              </div>
              <div className="border-t py-1">
                <p className="px-4 pt-2 pb-1 text-xs text-tertiary">
                  Payment methods
                </p>
                <NavigationItem href="/user" className={`${itemCls} relative`}>
                  Chats
                  <span className="text-tertiary text-xs ml-1">
                    — support and other messages
                  </span>
                  {Boolean(unreads?.length) && (
                    <span className="absolute top-2 right-3 w-4 h-4 rounded-full bg-[#E83B55] text-[10px] font-bold text-white flex items-center justify-center">
                      {unreads?.length}
                    </span>
                  )}
                </NavigationItem>
                <NavigationItem href="/user" className={itemCls}>
                  Reviews &amp; questions
                </NavigationItem>
              </div>
              <div className="border-t py-1">
                <LogoutButton />
              </div>
            </div>
          ) : (
            <div className="py-2">
              <NavigationItem href="/login" className={itemCls}>
                Login
              </NavigationItem>
              <NavigationItem href="/register" className={itemCls}>
                Register
              </NavigationItem>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
