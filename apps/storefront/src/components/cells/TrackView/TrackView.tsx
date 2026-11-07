"use client"

import { useEffect } from "react"
import { trackView, ViewInfo } from "@/lib/behavior"

export const TrackView = ({
  productId,
  categoryIds = [],
  info,
}: {
  productId: string
  categoryIds?: string[]
  info?: ViewInfo
}) => {
  useEffect(() => {
    trackView(productId, categoryIds, info)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])
  return null
}
