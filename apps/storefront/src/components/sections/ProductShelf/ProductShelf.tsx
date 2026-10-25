import { listProducts } from "@/lib/data/products"
import { listRegions } from "@/lib/data/regions"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { convertToLocale } from "@/lib/helpers/money"
import { ShelfCardActions } from "./ShelfCardActions"
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
      className="w-full px-[5px] -mt-14 lg:mt-0"
      data-testid="product-shelf"
    >
      <div className="max-w-[1400px] mx-auto">
        <DynamicHeading
          base={heading}
          savedLocation={savedCity}
          withLocation={withLocation}
        />
        {/* mobile cards — spec layout */}
        <div
          className="lg:hidden grid grid-cols-2"
          style={{ columnGap: "4px", rowGap: "24px", padding: "0 4px" }}
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
          {products.map((p) => {
            const v = p.variants?.[0]
            const price =
              v?.calculated_price?.calculated_amount ?? v?.prices?.[0]?.amount
            const compare =
              v?.calculated_price?.original_amount &&
              v.calculated_price.original_amount > price
                ? v.calculated_price.original_amount
                : null
            const currency =
              v?.calculated_price?.currency_code ??
              v?.prices?.[0]?.currency_code ??
              "eur"
            const discount = compare
              ? Math.round(((compare - price) / compare) * 100)
              : 0
            return (
              <LocalizedClientLink
                key={p.id}
                href={`/products/${p.handle}`}
                className="group relative flex flex-col rounded-2xl overflow-hidden bg-primary border hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-tertiary text-xs">
                      No image
                    </div>
                  )}
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-[#E83B55] text-white text-xs font-bold px-1.5 py-0.5 rounded-md">
                      -{discount}%
                    </span>
                  )}
                  <ShelfCardActions p={p} />
                </div>
                <div className="flex flex-col gap-0.5 p-2.5">
                  <div className="flex items-baseline gap-1.5">
                    {price != null && (
                      <span className="text-base font-bold text-primary">
                        {convertToLocale({ amount: price, currency_code: currency })}
                      </span>
                    )}
                    {compare && (
                      <span className="text-xs text-tertiary line-through">
                        {convertToLocale({ amount: compare, currency_code: currency })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-snug truncate">
                    {p.collection?.title && (
                      <span className="font-semibold text-primary">
                        {p.collection.title}{" "}
                      </span>
                    )}
                    <span className="text-secondary">{p.title}</span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-tertiary">
                    <span className="text-[#f59e0b]">★</span>4.8
                    <span>· 23 reviews</span>
                  </div>
                  <p className="text-[11px] text-tertiary">
                    Pickup · Buea · by{" "}
                    {new Date(Date.now() + 3 * 86400000).toLocaleDateString(
                      "en-GB",
                      { weekday: "short", day: "numeric", month: "short" }
                    )}
                  </p>
                </div>
              </LocalizedClientLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
