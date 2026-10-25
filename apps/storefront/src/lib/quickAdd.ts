"use client"

import { addToCart } from "@/lib/data/cart"
import { listOffers } from "@/lib/data/offers"

/**
 * Resolves the product's first available offer and adds one unit to the cart.
 * Used by the shelf cards' quick-add buttons.
 */
export const quickAdd = async (productId: string, countryCode: string) => {
  const { offers } = await listOffers({
    productId,
    countryCode,
  } as any)
  const offer = (offers as any[])?.[0]
  if (!offer?.id) throw new Error("No offers for product")
  await addToCart({
    offerId: offer.id,
    quantity: 1,
    countryCode,
  } as any)
}
