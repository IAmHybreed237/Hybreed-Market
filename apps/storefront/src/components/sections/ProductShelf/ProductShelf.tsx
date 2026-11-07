import { listProducts } from "@/lib/data/products"
import { listRegions } from "@/lib/data/regions"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { DynamicHeading } from "./DynamicHeading"
import { MobileProductCard } from "./MobileProductCard"
import { retrieveCustomer } from "@/lib/data/customer"

export const ProductShelf = async ({
  heading = "Trending",
  locale = "en",
  limit = 10,
  offset = 0,
  withLocation = false,
  perRow = 6,
}: {
  heading?: string
  locale?: string
  limit?: number
  offset?: number
  withLocation?: boolean
  perRow?: number
}) => {
  const user = await retrieveCustomer().catch(() => null)
  const savedCity = (user as any)?.addresses?.[0]?.city as
    | string
    | undefined

  let products: any[] = []
  try {
    const regions = await listRegions()
    const result = await listProducts({
      queryParams: { limit, offset },
      countryCode: locale,
      regionId: regions?.[0]?.id,
    })
    products = result?.response?.products || []
  } catch {
    products = []
  }

  if (!products.length) return null

  return (
    <section
      className="w-full px-3 lg:px-10 -mt-14 lg:mt-0"
      data-testid="product-shelf"
    >
      <div className="max-w-[1400px] mx-auto">
        <DynamicHeading
          base={heading}
          savedLocation={savedCity}
          withLocation={withLocation}
        />
        {/* mobile cards - spec layout */}
        <div
          className="lg:hidden grid grid-cols-2"
          style={{ columnGap: "4px", rowGap: "24px" }}
        >
          {products.map((p) => (
            <MobileProductCard key={p.id} p={p} />
          ))}
        </div>
        {/* desktop cards */}
        <div
          className="hidden lg:grid"
          style={{ gridTemplateColumns: `repeat(${perRow}, 1fr)`, gap: "16px" }}
        >
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              className="lg:!w-full !min-w-0"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
