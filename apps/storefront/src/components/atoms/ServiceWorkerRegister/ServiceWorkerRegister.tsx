"use client"

import { useEffect } from "react"

/**
 * Registers /sw.js (push notifications + installability) and asks the
 * browser to keep site storage persistent so home-screen sessions and
 * login cookies survive browser data eviction.
 */
export const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js").catch(() => {})

    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {})
    }
  }, [])

  return null
}
