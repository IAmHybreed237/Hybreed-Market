import { WbProductTop } from "./WbProductTop"
import { WbProductReviews } from "./WbProductReviews"
import { WbProductMobile } from "./WbProductMobile"
import { listProducts } from "@/lib/data/products"
import { listOffers } from "@/lib/data/offers"
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

  return (
    <>
      <TrackView
        productId={prod.id}
        categoryIds={(prod as any).categories?.map((c: any) => c.id) || []}
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
        similar={(prod as any).seller?.products || []}
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
          products={prod.seller?.products}
          locale={locale}
        />
      </div>
    </>
  )
}
