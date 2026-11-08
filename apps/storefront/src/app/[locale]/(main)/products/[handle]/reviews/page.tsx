import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { listProducts } from "@/lib/data/products"
import { listOffers } from "@/lib/data/offers"
import { getProductReviews } from "@/lib/data/reviews"
import { ReviewsMobile } from "@/components/sections/ProductReviewsPage/ReviewsMobile"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params
  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])
  return { title: prod ? `Reviews · ${prod.title} | Hybreed` : "Reviews | Hybreed" }
}

export default async function ProductReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string; locale: string }>
  searchParams: Promise<{ variant?: string }>
}) {
  const { handle, locale } = await params
  const { variant } = await searchParams

  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])
  if (!prod) notFound()

  const [{ offers }, initial] = await Promise.all([
    listOffers({ productId: prod.id, countryCode: locale }),
    getProductReviews(prod.id, { limit: 10 }),
  ])

  const variants = ((prod.variants || []) as any[]).map((v) => {
    const opts = (v.options || [])
      .filter((o: any) => o?.value)
      .map((o: any) => (o.option?.title ? `${o.option.title}: ${o.value}` : o.value))
    return {
      id: v.id as string,
      label: (opts.length ? opts.join("; ") : v.title) as string,
      offerId: ((offers as any[]).find((o) => o.variant_id === v.id)?.id ?? null) as string | null,
    }
  })

  return (
    <main className="md:max-w-[520px] md:mx-auto">
      <ReviewsMobile
        productId={prod.id}
        handle={prod.handle!}
        locale={locale}
        initial={initial}
        variants={variants}
        initialVariantId={variants.some((v) => v.id === variant) ? variant! : null}
      />
    </main>
  )
}
