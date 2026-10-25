"use client"

import { useEffect, useState } from "react"

export const DynamicHeading = ({
  base,
  savedLocation,
  withLocation = false,
}: {
  base: string
  savedLocation?: string | null
  withLocation?: boolean
}) => {
  const [city, setCity] = useState(savedLocation || "Buea")

  useEffect(() => {
    if (savedLocation || !("geolocation" in navigator)) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10`
          )
          const data = await res.json()
          const a = data?.address || {}
          const c = a.city || a.town || a.village || a.county
          if (c) setCity(c)
        } catch {}
      },
      () => {},
      { timeout: 8000, maximumAge: 300000 }
    )
  }, [savedLocation])

  return (
    <h2 className="text-xl font-bold mb-4" style={{ fontWeight: 600 }}>
      {base}
      {withLocation ? ` in ${city}` : ""}
    </h2>
  )
}
