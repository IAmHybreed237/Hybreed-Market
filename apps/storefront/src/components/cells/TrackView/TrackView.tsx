"use client"

import { useEffect } from "react"
import { trackView } from "@/lib/behavior"

export const TrackView = ({
  productId,
  categoryIds = [],
}: {
  productId: string
  categoryIds?: string[]
}) => {
  useEffect(() => {
    trackView(productId, categoryIds)
  }, [productId])
  return null
}
