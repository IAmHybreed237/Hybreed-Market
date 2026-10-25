"use client"

import { useEffect, useState } from "react"
import { ArrowDownIcon } from "@/icons"

const MapPinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export const LocationSelector = ({
  savedLocation,
  className,
}: {
  savedLocation?: string | null
  className?: string
}) => {
  const [location, setLocation] = useState(
    savedLocation || "Buea, South West"
  )

  const detect = () => {
    if (!("geolocation" in navigator)) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10`,
            { headers: { "Accept-Language": "en" } }
          )
          const data = await res.json()
          const a = data?.address || {}
          const area = a.suburb || a.neighbourhood || a.residential
          const city = a.city || a.town || a.village || a.county
          const region = a.state || a.region
          if (city) {
            setLocation(
              [area, city, region].filter(Boolean).join(", ")
            )
          }
        } catch {
          /* keep fallback */
        }
      },
      () => {},
      { timeout: 8000, maximumAge: 300000 }
    )
  }

  useEffect(() => {
    if (!savedLocation) detect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedLocation])

  return (
    <button
      type="button"
      onClick={detect}
      className={className}
      data-testid="header-location"
      title="Detect my location"
    >
      <MapPinIcon />
      {location}
      <ArrowDownIcon size={12} />
    </button>
  )
}
