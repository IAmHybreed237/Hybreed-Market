import { WbProductTop } from "./WbProductTop"
import { WbProductReviews } from "./WbProductReviews"
import { WbProductMobile } from "./WbProductMobile"
import { listProducts } from "@/lib/data/products"
import { listOffers } from "@/lib/data/offers"
import { getTrends } from "@/lib/data/trending"
import { getProductReviews } from "@/lib/data/reviews"
import { StoreOffer } from "@/lib/helpers/buybox"
import { HomeProductSection } from "../HomeProductSection/HomeProductSection"
import NotFound from "@/app/not-found"
import { TrackView } from "@/components/cells/TrackView/TrackView"

export const ProductDetailsPage = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}) => {
  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])

  if (!prod) return null

  if (prod.seller?.store_status === "SUSPENDED") {
    return NotFound()
  }

  const { offers } = await listOffers({
    productId: prod.id,
    countryCode: locale,
  })

  // --- recommendations: recent search/view trends + this product's categories
  const prodCatIds: string[] = ((prod as any).categories || [])
    .map((c: any) => c?.id)
    .filter(Boolean)
  const [trends, reviewsData] = await Promise.all([getTrends(30), getProductReviews(prod.id, { limit: 1 })])
  const reviewSummary = reviewsData.summary
  const trendCatIds = trends.category_ids.map((c) => c.key).slice(0, 5)
  const trendProductIds = new Set(trends.product_ids.map((p) => p.key))
  const trendTerms = trends.terms.map((t) => t.key).filter((t) => t.length >= 2)

  const poolCatIds = [...new Set([...prodCatIds, ...trendCatIds])]
  const { response: poolRes } = poolCatIds.length
    ? await listProducts({
        countryCode: locale,
        category_id: poolCatIds,
        queryParams: { limit: 60 },
      })
    : { response: { products: [] as any[], count: 0 } }

  const scored = (poolRes.products || [])
    .filter((p: any) => p.handle !== handle)
    .map((p: any) => {
      let score = 0
      if (trendProductIds.has(p.id)) score += 4
      const hay = `${p.title || ""} ${p.handle || ""}`.toLowerCase()
      if (trendTerms.some((t) => hay.includes(t.toLowerCase()))) score += 3
      const pCats = ((p as any).categories || []).map((c: any) => c?.id)
      if (pCats.some((c: string) => prodCatIds.includes(c))) score += 2
      return { p, score }
    })
    .sort((a, b) => b.score - a.score)

  const likeList = scored.slice(0, 8).map((s) => s.p)
  const sellerProducts = ((prod as any).seller?.products || []).filter(
    (p: any) => p.handle !== handle
  )
  const likeHandles = new Set(likeList.map((p: any) => p.handle))
  const buyList = [
    ...sellerProducts.filter((p: any) => !likeHandles.has(p.handle)),
    ...scored.filter((s) => !likeHandles.has(s.p.handle)).map((s) => s.p),
  ].slice(0, 8)

  return (
    <>
      <TrackView
        productId={prod.id}
        categoryIds={(prod as any).categories?.map((c: any) => c.id) || []}
        info={{
          title: prod.title,
          handle: prod.handle,
          image:
            (prod as any).thumbnail ||
            (prod.images?.[0] as any)?.url ||
            undefined,
          price:
            (prod.variants?.[0] as any)?.calculated_price?.calculated_amount ??
            null,
        }}
      />
      <div data-testid="product-details-page" className="hidden md:block">
        <WbProductTop
          product={prod}
          offers={offers as StoreOffer[]}
          locale={locale}
        />
      </div>
      <WbProductMobile
        product={prod}
        offers={offers as StoreOffer[]}
        similar={likeList}
        alsoBuy={buyList}
        reviewSummary={reviewSummary}
        reviewMedia={reviewsData.media}
        locale={locale}
      />
      <div className="hidden md:block">
        <WbProductReviews
          images={(prod?.images || []).map((i: any) => i.url || i)}
        />
      </div>
      <div className="my-8 hidden md:block">
        <HomeProductSection
          heading="Similar items"
          products={sellerProducts}
          locale={locale}
        />
      </div>
    </>
  )
}
